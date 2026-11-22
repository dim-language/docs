import { mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileProject, initDim } from '@dim/sdk';

const shop = new URL('../examples/shop/', import.meta.url);
const tutorial = new URL('../src/examples/model-pertama/', import.meta.url);
const data = fileURLToPath(new URL('../src/data/', import.meta.url));
const examples = [
	[shop, 'main.dim', 'shop.json'],
	[shop, 'to-be.dim', 'shop-to-be.json'],
	[tutorial, 'kode.dim', 'toko-tutorial.json'],
];

async function readSources(directory) {
	const paths = (await readdir(directory, { recursive: true, withFileTypes: true }))
		.filter((entry) => entry.isFile() && entry.name.endsWith('.dim'));
	const root = fileURLToPath(directory);
	return Object.fromEntries(await Promise.all(paths.map(async ({ name, parentPath }) => {
		const path = join(parentPath, name);
		return [relative(root, path).split(sep).join('/'), await readFile(path, 'utf8')];
	})));
}

await initDim();
const sources = new Map(await Promise.all([shop, tutorial].map(async (dir) => [dir, await readSources(dir)])));
await mkdir(data, { recursive: true });
const staging = await mkdtemp(join(data, '.examples-'));
try {
	for (const [dir, entry, target] of examples) {
		const { model, diagnostics } = compileProject(entry, sources.get(dir));
		if (!model) {
			const details = diagnostics.map(({ file, line, col, code, message }) => `${file}:${line}:${col} [${code}] ${message}`);
			throw new Error(`Could not compile ${entry}\n${details.join('\n')}`);
		}
		await writeFile(join(staging, target), JSON.stringify(model) + '\n');
	}
	for (const [, , target] of examples) {
		await rename(join(staging, target), join(data, target));
	}
} finally {
	await rm(staging, { recursive: true, force: true });
}
