import type { Box } from '@dim/zoom-map';

type Point = { x: number; y: number };

const MIN = 0.1;
const MAX = 3;
const STEP = 1.25;
const PAD = 16;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function createCamera(viewport: HTMLElement, stage: HTMLElement, onZoom: (scale: number) => void) {
	let scale = 0.5;
	let origin = { x: 0, y: 0 };
	let width = 0;
	let height = 0;
	let fitting = true;
	let reportedScale: number | undefined;
	const center = () => ({ x: viewport.clientWidth / 2, y: viewport.clientHeight / 2 });
	const local = (event: { clientX: number; clientY: number }) => {
		const rect = viewport.getBoundingClientRect();
		return { x: event.clientX - rect.left - viewport.clientLeft, y: event.clientY - rect.top - viewport.clientTop };
	};
	const apply = (next: number, x: number, y: number) => {
		const left = viewport.clientWidth - width * next - PAD;
		const bottom = viewport.clientHeight - height * next - PAD;
		origin = { x: clamp(x, Math.min(left, PAD), Math.max(left, PAD)), y: clamp(y, Math.min(bottom, PAD), Math.max(bottom, PAD)) };
		stage.style.transform = `translate(${origin.x}px, ${origin.y}px) scale(${next})`;
		stage.style.setProperty('--zm-zoom', String(next));
		viewport.toggleAttribute('data-compact', next < 0.6);
		scale = next;
		if (reportedScale !== next) {
			reportedScale = next;
			onZoom(scale);
		}
	};
	const frame = (next: number, point: Point) => {
		const mid = center();
		apply(next, mid.x - point.x * next, mid.y - point.y * next);
	};
	const fit = () => {
		if (!width || !height) return;
		fitting = true;
		const next = clamp(Math.min((viewport.clientWidth - PAD * 2) / width, (viewport.clientHeight - PAD * 2) / height), MIN, MAX);
		frame(next, { x: width / 2, y: height / 2 });
	};
	const zoomAt = (factor: number, from: Point, to = from) => {
		fitting = false;
		const next = clamp(scale * factor, MIN, MAX);
		const ratio = next / scale;
		apply(next, to.x - (from.x - origin.x) * ratio, to.y - (from.y - origin.y) * ratio);
	};
	const pan = (dx: number, dy: number) => {
		fitting = false;
		apply(scale, origin.x + dx, origin.y + dy);
	};
	const zoomBy = (factor: number) => zoomAt(factor, center());

	viewport.addEventListener('wheel', (event) => {
		const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientHeight : 1;
		if (event.ctrlKey || event.metaKey) {
			event.preventDefault();
			zoomAt(Math.exp(-clamp(event.deltaY * unit, -100, 100) / 100), local(event));
		} else if (Math.abs(event.deltaX) > Math.abs(event.deltaY) && width * scale > viewport.clientWidth) {
			event.preventDefault();
			pan(-event.deltaX * unit, 0);
		}
	}, { passive: false });

	const pointers = new Map<number, Point>();
	let dragging = false;
	let suppressClick = false;
	const middle = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
	const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
	viewport.addEventListener('pointerdown', (event) => {
		if (event.button !== 0 || pointers.size >= 2) return;
		if (!pointers.size) suppressClick = false;
		pointers.set(event.pointerId, local(event));
		if (pointers.size === 2) {
			for (const id of pointers.keys()) viewport.setPointerCapture(id);
			suppressClick = true;
		}
	});
	viewport.addEventListener('pointermove', (event) => {
		const before = pointers.get(event.pointerId);
		if (!before) return;
		const after = local(event);
		const other = [...pointers].find(([id]) => id !== event.pointerId)?.[1];
		if (other) {
			pointers.set(event.pointerId, after);
			const previous = distance(before, other);
			if (previous > 0) zoomAt(distance(after, other) / previous, middle(before, other), middle(after, other));
			return;
		}
		if (!dragging && distance(before, after) < 4) return;
		if (!dragging) {
			dragging = true;
			viewport.setPointerCapture(event.pointerId);
			viewport.setAttribute('data-dragging', '');
			suppressClick = true;
		}
		pointers.set(event.pointerId, after);
		pan(after.x - before.x, after.y - before.y);
	});
	const endPointer = (event: PointerEvent) => {
		if (!pointers.delete(event.pointerId) || pointers.size) return;
		dragging = false;
		viewport.removeAttribute('data-dragging');
	};
	viewport.addEventListener('pointerup', endPointer);
	viewport.addEventListener('pointercancel', endPointer);
	viewport.addEventListener('lostpointercapture', (event) => {
		if (event.target === viewport) endPointer(event);
	});
	viewport.addEventListener('pointerleave', (event) => {
		if (!viewport.hasPointerCapture(event.pointerId)) endPointer(event);
	});
	for (const type of ['click', 'dblclick']) {
		viewport.addEventListener(type, (event) => {
			if (!suppressClick || (event as MouseEvent).detail === 0) return;
			event.preventDefault();
			event.stopPropagation();
		}, true);
	}

	// Safari sends a cumulative scale for trackpad pinch instead of a modified wheel event.
	let gestureScale = 1;
	viewport.addEventListener('gesturestart', (event) => {
		event.preventDefault();
		gestureScale = 1;
	});
	viewport.addEventListener('gesturechange', (event) => {
		event.preventDefault();
		const gesture = event as MouseEvent & { scale: number };
		if (gesture.scale > 0 && !pointers.size) zoomAt(gesture.scale / gestureScale, local(gesture));
		if (gesture.scale > 0) gestureScale = gesture.scale;
	});
	viewport.addEventListener('gestureend', (event) => event.preventDefault());

	viewport.addEventListener('scroll', () => {
		const { scrollLeft, scrollTop } = viewport;
		if (!scrollLeft && !scrollTop) return;
		viewport.scrollTo(0, 0);
		pan(-scrollLeft, -scrollTop);
	});
	viewport.addEventListener('keydown', (event) => {
		if (event.ctrlKey || event.metaKey || event.altKey) return;
		switch (event.key) {
			case '+': case '=': zoomBy(STEP); break;
			case '-': case '_': zoomBy(1 / STEP); break;
			case '0': fit(); break;
			case 'ArrowLeft': pan(48, 0); break;
			case 'ArrowRight': pan(-48, 0); break;
			case 'ArrowUp': pan(0, 48); break;
			case 'ArrowDown': pan(0, -48); break;
			default: return;
		}
		event.preventDefault();
	});
	new ResizeObserver(() => {
		if (fitting) fit();
		else apply(scale, origin.x, origin.y);
	}).observe(viewport);

	return {
		setSize(w: number, h: number) { width = w; height = h; },
		fit,
		zoomIn: () => zoomBy(STEP),
		zoomOut: () => zoomBy(1 / STEP),
		focus(box: Box, minimum = MIN) {
			fitting = false;
			const target = Math.min(viewport.clientWidth * 0.7 / box.w, viewport.clientHeight * 0.7 / box.h);
			const next = clamp(Math.max(target, minimum, scale * STEP), MIN, MAX);
			frame(next, { x: box.x + box.w / 2, y: box.y + box.h / 2 });
		},
	};
}
