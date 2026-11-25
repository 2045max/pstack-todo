// Runs every check in checks/*.js. Each check gets its own server process and temporary database.
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { loadDir } from './lib/load.js';

const root = import.meta.dirname;
const tmp = mkdtempSync(join(tmpdir(), 'pstack-todo-'));
const running = new Set();

process.on('exit', () => {
	for (const child of running) child.kill('SIGKILL');
	rmSync(tmp, { recursive: true, force: true });
});
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(signal, () => process.exit(1));

async function startServer(dbPath) {
	const child = spawn(process.execPath, [join(root, 'server.js')], {
		env: { ...process.env, PORT: '0', DB_PATH: dbPath },
		stdio: ['ignore', 'pipe', 'inherit'],
	});
	running.add(child);
	const exited = once(child, 'exit').then(([code, signal]) => {
		running.delete(child);
		throw new Error(`server exited early (${signal ?? code})`);
	});
	exited.catch(() => {});
	const lines = createInterface({ input: child.stdout });
	const [line] = await Promise.race([once(lines, 'line'), exited]);
	return {
		url: line.match(/http:\/\/127\.0\.0\.1:\d+/)[0],
		async stop() {
			child.kill();
			await exited.catch(() => {});
		},
	};
}

async function runCheck(name, check) {
	const dbPath = join(tmp, `${name.replace(/\W+/g, '_')}.db`);
	let server = await startServer(dbPath);
	const ctx = {
		async request(method, path, body) {
			const payload = body === undefined || typeof body === 'string' ? body : JSON.stringify(body);
			const res = await fetch(server.url + path, { method, body: payload });
			const text = await res.text();
			const isJson = res.headers.get('content-type')?.startsWith('application/json');
			return { status: res.status, headers: res.headers, text, json: isJson ? JSON.parse(text) : undefined };
		},
		async restart() {
			await server.stop();
			server = await startServer(dbPath);
		},
	};
	try {
		await check(ctx);
	} finally {
		await server.stop();
	}
}

let total = 0;
let failed = 0;
for (const [file, checks] of await loadDir(join(root, 'checks'))) {
	for (const [title, check] of Object.entries(checks)) {
		total++;
		try {
			await runCheck(`${file} ${total}`, check);
			console.log(`ok   ${file}: ${title}`);
		} catch (err) {
			failed++;
			console.log(`FAIL ${file}: ${title}\n${err.message}`);
		}
	}
}
console.log(`${total - failed}/${total} checks passed`);
process.exit(total > 0 && failed === 0 ? 0 : 1);
