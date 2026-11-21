// Tema blok kode "kertas peta" dan "peta malam". Warna mengikuti DESIGN.md:
// tinta untuk struktur, vermilion hanya untuk panah relasi (rute), sisanya turunan tinta/kertas.

/** @param {'light' | 'dark'} type */
function theme(type) {
	const c =
		type === 'light'
			? {
					bg: '#faf7ef',
					fg: '#2c3a41',
					muted: '#5f6a6b',
					strong: '#15232b',
					kind: '#1f4e66',
					string: '#6b4a12',
					constant: '#3d5c2e',
					property: '#4a3f6b',
					route: '#b23a16',
					selection: '#ece5d3',
				}
			: {
					bg: '#141e24',
					fg: '#cfcbbe',
					muted: '#8e9893',
					strong: '#f7f3e8',
					kind: '#8fc1d6',
					string: '#d9c08a',
					constant: '#a9c99a',
					property: '#c3b6e6',
					route: '#f0997a',
					selection: '#26333b',
				};

	return {
		name: type === 'light' ? 'dim-kertas' : 'dim-malam',
		type,
		colors: {
			'editor.background': c.bg,
			'editor.foreground': c.fg,
			'editor.selectionBackground': c.selection,
		},
		tokenColors: [
			{ scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: c.muted, fontStyle: 'italic' } },
			{ scope: ['string', 'markup.inline.raw'], settings: { foreground: c.string } },
			{ scope: ['constant.character.escape'], settings: { foreground: c.kind } },
			{
				scope: ['keyword', 'storage', 'storage.type', 'keyword.control'],
				settings: { foreground: c.kind, fontStyle: 'bold' },
			},
			{ scope: ['keyword.operator.arrow.dim', 'keyword.operator.root.dim'], settings: { foreground: c.route, fontStyle: 'bold' } },
			{ scope: ['keyword.operator', 'punctuation'], settings: { foreground: c.muted } },
			{
				scope: ['entity.name', 'entity.name.type', 'entity.name.function', 'support.function'],
				settings: { foreground: c.strong, fontStyle: 'bold' },
			},
			{ scope: ['entity.name.label'], settings: { foreground: c.route } },
			{ scope: ['constant', 'constant.numeric', 'constant.language', 'support.constant'], settings: { foreground: c.constant } },
			{ scope: ['variable.other.property', 'support.type.property-name', 'meta.object-literal.key'], settings: { foreground: c.property } },
			{ scope: ['variable', 'variable.other.path.dim'], settings: { foreground: c.fg } },
			{ scope: ['invalid'], settings: { foreground: c.route, fontStyle: 'underline' } },
		],
	};
}

export const lightTheme = theme('light');
export const darkTheme = theme('dark');
