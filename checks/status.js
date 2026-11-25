import assert from 'node:assert/strict';

const a = { id: 1, title: 'a', done: false };
const b = { id: 2, title: 'b', done: true };
const c = { id: 3, title: 'c', done: false };
const d = { id: 4, title: 'd', done: true };

async function seed(request) {
	for (const { title } of [a, b, c, d]) await request('POST', '/api/todos', { title });
	for (const { id } of [b, d]) await request('PATCH', `/api/todos/${id}`, { done: true });
}

async function list(request, query) {
	const res = await request('GET', `/api/todos${query}`);
	assert.equal(res.status, 200, query);
	return res.json;
}

export default {
	'status=open returns only open todos': async ({ request }) => {
		await seed(request);
		assert.deepEqual(await list(request, '?status=open'), [a, c]);
	},
	'status=done returns only done todos': async ({ request }) => {
		await seed(request);
		assert.deepEqual(await list(request, '?status=done'), [b, d]);
	},
	'no status returns every todo': async ({ request }) => {
		await seed(request);
		assert.deepEqual(await list(request, ''), [a, b, c, d]);
	},
	'a todo changes status when PATCH changes done': async ({ request }) => {
		await seed(request);
		await request('PATCH', '/api/todos/1', { done: true });
		await request('PATCH', '/api/todos/2', { done: false });
		assert.deepEqual(await list(request, '?status=open'), [{ ...b, done: false }, c]);
		assert.deepEqual(await list(request, '?status=done'), [{ ...a, done: true }, d]);
	},
	'a status with no matching todos returns an empty list': async ({ request }) => {
		assert.deepEqual(await list(request, '?status=open'), []);
		await request('POST', '/api/todos', { title: 'a' });
		assert.deepEqual(await list(request, '?status=done'), []);
	},
	'any other status returns 400': async ({ request }) => {
		await seed(request);
		for (const value of ['', 'all', 'Open', 'DONE', ' open', 'true', '0', 'constructor', 'toString', '__proto__']) {
			const res = await request('GET', `/api/todos?status=${encodeURIComponent(value)}`);
			assert.equal(res.status, 400, `status=${JSON.stringify(value)}`);
			assert.equal(typeof res.json.error, 'string');
		}
		assert.equal((await request('GET', '/api/todos?status')).status, 400);
	},
};
