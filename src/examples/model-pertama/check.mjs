import { readFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { compileProject, initDim } from '@dim/sdk';

const path = process.argv[2];
if (!path) throw new Error('Usage: node check.mjs <file.dim>');

const entry = basename(path);
const files = {
	'dim.config': await readFile(join(dirname(path), 'dim.config'), 'utf8'),
	[entry]: await readFile(path, 'utf8'),
};
await initDim();
const result = compileProject(entry, files);

for (const { code, message } of result.diagnostics) {
	console.error(`error[${code}]: ${message}`);
}
if (result.model) {
	const { elements, relations, flows } = result.model;
	console.log(`ok: ${elements.length} elemen, ${relations.length} relasi, ${flows.length} flow`);
} else {
	process.exitCode = 1;
}
