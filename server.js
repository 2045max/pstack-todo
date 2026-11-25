import { createServer } from 'node:http';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadDir } from './lib/load.js';
import { openStore } from './lib/store.js';
import { HttpError } from './lib/http.js';

const dir = (name) => join(import.meta.dirname, name);
const store = openStore(process.env.DB_PATH ?? 'todo.db');
const filters = await loadDir(dir('filters'));
const features = readdirSync(dir('public/features')).filter((f) => f.endsWith('.js')).sort().map((f) => f.slice(0, -3));

// routes/*.js each export { 'METHOD /path': handler }.
const routes = (await loadDir(dir('routes'))).flatMap(([, table]) =>
	Object.entries(table).map(([key, handler]) => {
		const [method, pathname] = key.split(' ');
		return { method, pattern: new URLPattern({ pathname }), handler };
	}),
);

async function readJson(req) {
	const chunks = [];
	for await (const chunk of req) chunks.push(chunk);
	try {
		return JSON.parse(Buffer.concat(chunks).toString('utf8'));
	} catch {
		throw new HttpError(400, 'invalid JSON');
	}
}

async function dispatch(req) {
	const url = new URL(req.url, 'http://localhost');
	for (const { method, pattern, handler } of routes) {
		const match = method === req.method && pattern.exec(url);
		if (match) {
			const params = match.pathname.groups;
			return handler({ store, filters, features, params, query: url.searchParams, readJson: () => readJson(req) });
		}
	}
	throw new HttpError(404, 'not found');
}

const server = createServer(async (req, res) => {
	let result;
	try {
		result = await dispatch(req);
	} catch (err) {
		if (!(err instanceof HttpError)) console.error(err);
		const status = err instanceof HttpError ? err.status : 500;
		result = { status, json: { error: status === 500 ? 'internal error' : err.message } };
	}
	const { status = 200, headers = {}, json, body } = result;
	if (json === undefined) res.writeHead(status, headers).end(body);
	else res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers }).end(JSON.stringify(json));
});

server.listen(Number(process.env.PORT ?? 3000), '127.0.0.1', () => {
	console.log(`listening on http://127.0.0.1:${server.address().port}`);
});
