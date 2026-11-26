// @ts-check
import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { ExpressiveCodeTheme } from '@astrojs/starlight/expressive-code';
import { darkTheme, lightTheme } from './src/code/themes.mjs';

// Grammar dim untuk Shiki. Daftar katanya (`{{kinds}}`, `{{attributes}}`, …) diisi dari kosakata compiler,
// yang dirilis bersama runtime SDK.
const vocab = JSON.parse(readFileSync(new URL(import.meta.resolve('@dim/sdk/vocab.json')), 'utf-8'));
const words = {
	kinds: vocab.kinds,
	attributes: vocab.attributes,
	// `none` dan `cookie` (skema auth) dibiarkan polos; `cookie` sudah berwarna sebagai atribut endpoint.
	values: vocab.values.filter((/** @type {string} */ w) => w !== 'none' && w !== 'cookie'),
};
const grammarText = readFileSync(new URL('./src/code/dim.tmLanguage.json', import.meta.url), 'utf-8');
const dimGrammar = JSON.parse(grammarText, (key, value) =>
	typeof value === 'string' && key !== 'comment'
		? value.replace(/\{\{(\w+)\}\}/g, (_, name) => {
				const list = words[/** @type {keyof typeof words} */ (name)];
				if (!list) throw new Error(`dim.tmLanguage.json: daftar {{${name}}} tidak dikenal`);
				return list.join('|');
			})
		: value,
);
const tutorialDir = new URL('./src/examples/model-pertama/', import.meta.url);

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'dim',
			description: 'dim (Diagram In Markup): a language for writing software architecture as one zoomable map.',
			logo: {
				light: './src/assets/logo-light.svg',
				dark: './src/assets/logo-dark.svg',
				// Dekoratif: judul "dim" tetap ditulis sebagai teks di sebelahnya.
				alt: '',
			},
			head: [{ tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' } }],
			locales: {
				root: { label: 'English', lang: 'en' },
				id: { label: 'Bahasa Indonesia', lang: 'id' },
			},
			customCss: [
				'@fontsource/source-sans-3/400.css',
				'@fontsource/source-sans-3/400-italic.css',
				'@fontsource/source-sans-3/600.css',
				'@fontsource/source-serif-4/600.css',
				'@fontsource/ibm-plex-mono/400.css',
				'@fontsource/ibm-plex-mono/600.css',
				'./src/styles/theme.css',
			],
			expressiveCode: {
				themes: [ExpressiveCodeTheme.fromJSONString(JSON.stringify(darkTheme)), ExpressiveCodeTheme.fromJSONString(JSON.stringify(lightTheme))],
				useStarlightUiThemeColors: true,
				shiki: { langs: [dimGrammar] },
				plugins: [{
					name: 'Contoh tutorial dim',
					hooks: {
						preprocessCode({ codeBlock }) {
							const example = codeBlock.metaOptions.getString('contoh-tutorial');
							if (!example) return;

							const source = (/^[a-z-]+\.(dim|mjs)$/.test(example) || example === 'ShopMap.astro' || example === 'dim.config')
								? readFileSync(new URL(example, tutorialDir), 'utf8')
								: JSON.parse(readFileSync(new URL('cek.json', tutorialDir), 'utf8'))[example];
							if (typeof source !== 'string') throw new Error(`Contoh tutorial tidak ditemukan: ${example}`);

							const existing = codeBlock.getLines();
							if (existing.length) codeBlock.deleteLines(existing.map((_, index) => index));
							codeBlock.insertLines(0, source.trimEnd().split(/\r?\n/));
						},
					},
				}],
				styleOverrides: {
					borderRadius: '4px',
					codeFontFamily: "'IBM Plex Mono', ui-monospace, monospace",
				},
				defaultProps: {
					// Baris panjang dibungkus supaya kode tidak perlu digeser di layar sempit.
					wrap: true,
					// Perintah shell ditampilkan tanpa bingkai jendela terminal.
					overridesByLang: { 'bash,sh,shell': { frame: 'none' } },
				},
			},
			components: { Sidebar: './src/components/DocsSidebar.astro' },
			sidebar: [
				{
					label: 'Introduction', translations: { id: 'Pengantar' },
					items: [{ slug: 'mulai/apa-itu-dim' }, { slug: 'ekosistem' }],
				},
				{
					label: 'Tutorial',
					items: [
						{ slug: 'mulai' }, { slug: 'mulai/checkout' },
						{ slug: 'mulai/kontrak' }, { slug: 'mulai/review' },
					],
				},
				{
					label: 'Guide', translations: { id: 'Panduan' },
					items: [
						{ slug: 'panduan' }, { slug: 'menulis/memodelkan' }, { slug: 'menulis/konfigurasi' },
						{ slug: 'menulis/elemen' }, { slug: 'menulis/relasi' }, { slug: 'konsep/aliran-data' },
						{ slug: 'konsep/endpoint' }, { slug: 'konsep/level-kode' }, { slug: 'konsep/alur' },
						{ slug: 'konsep/komposisi' }, { slug: 'konsep/deployment' }, { slug: 'konsep/peta-zoom' },
						{ slug: 'ekosistem/peta-web' },
					],
				},
				{
					label: 'Reference', translations: { id: 'Referensi' },
					items: [
						{ slug: 'referensi' }, { slug: 'referensi/cli' },
						{
							label: 'Language specification',
							translations: { id: 'Spesifikasi bahasa' },
							collapsed: true,
							items: [
								{ slug: 'referensi/spesifikasi', label: 'Overview', translations: { id: 'Ikhtisar' } },
								{ slug: 'referensi/spesifikasi/sintaks' },
								{ slug: 'referensi/spesifikasi/konfigurasi' },
								{ slug: 'referensi/spesifikasi/model' },
								{ slug: 'referensi/spesifikasi/level-kode' },
								{ slug: 'referensi/spesifikasi/tipe' },
								{ slug: 'referensi/spesifikasi/relasi' },
								{ slug: 'referensi/spesifikasi/endpoint' },
								{ slug: 'referensi/spesifikasi/komposisi-dan-flow' },
								{ slug: 'referensi/spesifikasi/deployment' },
								{ slug: 'referensi/spesifikasi/semantik-zoom' },
								{ slug: 'referensi/spesifikasi/validasi' },
								{ slug: 'referensi/spesifikasi/output' },
								{ slug: 'referensi/spesifikasi/bentuk-kanonik' },
							],
						},
					],
				},
			],
		}),
	],
});
