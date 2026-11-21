// @ts-check
import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { ExpressiveCodeTheme } from '@astrojs/starlight/expressive-code';
import { darkTheme, lightTheme } from './src/code/themes.mjs';

// Grammar dim untuk Shiki. Daftar katanya (`{{kinds}}`, `{{attributes}}`, …) diisi dari kosakata compiler,
// yang dirilis bersama runtime SDK.
const vocab = JSON.parse(readFileSync(new URL(import.meta.resolve('@dim/zoom-map/vocab.json')), 'utf-8'));
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
			description: 'dim (Diagram In Markup): bahasa untuk menulis arsitektur software sebagai satu peta yang bisa di-zoom.',
			logo: {
				light: './src/assets/logo-light.svg',
				dark: './src/assets/logo-dark.svg',
				// Dekoratif: judul "dim" tetap ditulis sebagai teks di sebelahnya.
				alt: '',
			},
			head: [{ tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' } }],
			locales: {
				root: { label: 'Bahasa Indonesia', lang: 'id' },
				en: { label: 'English' },
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

							const source = /^[a-z-]+\.(dim|mjs)$/.test(example)
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
			sidebar: [
				{
					label: 'Mulai',
					translations: { en: 'Getting started' },
					items: [{ slug: 'mulai/apa-itu-dim' }, { slug: 'mulai' }],
				},
				{
					label: 'Menulis model',
					translations: { en: 'Writing models' },
					items: [{ slug: 'menulis/elemen' }, { slug: 'menulis/relasi' }, { slug: 'menulis/memodelkan' }],
				},
				{
					label: 'Konsep',
					translations: { en: 'Concepts' },
					items: [
						{ slug: 'konsep/peta-zoom' },
						{ slug: 'konsep/aliran-data' },
						{ slug: 'konsep/level-kode' },
						{ slug: 'konsep/endpoint' },
						{ slug: 'konsep/alur' },
						{ slug: 'konsep/komposisi' },
					],
				},
				{
					label: 'Referensi',
					translations: { en: 'Reference' },
					items: [
						{
							label: 'Spesifikasi bahasa',
							translations: { en: 'Language specification' },
							collapsed: true,
							items: [
								{ slug: 'referensi/spesifikasi', label: 'Ikhtisar', translations: { en: 'Overview' } },
								{ slug: 'referensi/spesifikasi/sintaks' },
								{ slug: 'referensi/spesifikasi/model' },
								{ slug: 'referensi/spesifikasi/validasi' },
								{ slug: 'referensi/spesifikasi/output' },
								{ slug: 'referensi/spesifikasi/semantik-zoom' },
								{ slug: 'referensi/spesifikasi/komposisi-dan-flow' },
								{ slug: 'referensi/spesifikasi/endpoint-http' },
								{ slug: 'referensi/spesifikasi/bentuk-kanonik' },
							],
						},
						{ slug: 'referensi/cli' },
					],
				},
			],
		}),
	],
});
