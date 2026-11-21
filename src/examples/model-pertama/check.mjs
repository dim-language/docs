import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { compileProject, initDim } from '@dim/zoom-map';

const path = process.argv[2];
if (!path) throw new Error('Usage: node check.mjs <file.dim>');

const entry = basename(path);
await initDim();
const result = compileProject(entry, { [entry]: await readFile(path, 'utf8') });

for (const { severity, code, message } of result.diagnostics) {
	console.error(`${severity}[${code}]: ${message}`);
}
if (result.model) {
	const { nodes, edges, flows } = result.model;
	console.log(`ok: ${result.files.length} file, ${nodes.length} elemen, ${edges.length} relasi, ${flows.length} flow`);
} else {
	process.exitCode = 1;
}
