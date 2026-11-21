import { expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import cek from '../src/examples/model-pertama/cek.json';

const examples = fileURLToPath(new URL('../src/examples/model-pertama/', import.meta.url));

function check(path) {
	const result = Bun.spawnSync([process.execPath, join(examples, 'check.mjs'), path], {
		stdout: 'pipe',
		stderr: 'pipe',
	});
	return { exitCode: result.exitCode, stdout: result.stdout.toString().trimEnd(), stderr: result.stderr.toString().trimEnd() };
}

test.each([
	['sistem.dim', cek.sistem],
	['container.dim', cek.container],
	['kode.dim', cek.kode],
])('%s lolos dengan ringkasan yang tampil di tutorial', (file, expected) => {
	expect(check(join(examples, file))).toEqual({ exitCode: 0, stdout: expected, stderr: '' });
});

test('menghapus push dari POST /pesanan menghasilkan E035', () => {
	const model = readFileSync(join(examples, 'kode.dim'), 'utf8');
	const salah = model.replace('data push "Pesanan"', 'data "Pesanan"');
	const temp = mkdtempSync(join(tmpdir(), 'dim-tutorial-'));

	try {
		const file = join(temp, 'toko.dim');
		writeFileSync(file, salah);

		const { exitCode, stderr } = check(file);
		expect(exitCode).toBe(1);
		const errors = stderr.split(/\r?\n/).filter((line) => line.startsWith('error['));
		expect(errors).toEqual([cek.tanpaArah]);
	} finally {
		rmSync(temp, { recursive: true, force: true });
	}
});
