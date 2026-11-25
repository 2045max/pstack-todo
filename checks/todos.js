import assert from 'node:assert/strict';

export default {
	'POST creates a todo': async ({ request }) => {
		const res = await request('POST', '/api/todos', { title: '买牛奶' });
		assert.equal(res.status, 201);
		assert.deepEqual(res.json, { id: 1, title: '买牛奶', done: false });
	},
	'POST rejects bad titles and bad JSON without writing': async ({ request }) => {
		for (const body of [{}, { title: '' }, { title: '  \t\n' }, { title: 5 }, { title: null }, null, [], '{bad', '']) {
			const res = await request('POST', '/api/todos', body);
			assert.equal(res.status, 400, `body ${JSON.stringify(body)}`);
		}
		assert.deepEqual((await request('GET', '/api/todos')).json, []);
	},
	'GET lists todos by id ascending': async ({ request }) => {
		for (const title of ['b', 'a', 'c']) await request('POST', '/api/todos', { title });
		await request('PATCH', '/api/todos/1', { done: true });
		const res = await request('GET', '/api/todos');
		assert.equal(res.status, 200);
		assert.deepEqual(res.json, [
			{ id: 1, title: 'b', done: true },
			{ id: 2, title: 'a', done: false },
			{ id: 3, title: 'c', done: false },
		]);
	},
	'PATCH sets done both ways': async ({ request }) => {
		await request('POST', '/api/todos', { title: 'x' });
		for (const done of [true, false]) {
			const res = await request('PATCH', '/api/todos/1', { done });
			assert.equal(res.status, 200);
			assert.deepEqual(res.json, { id: 1, title: 'x', done });
		}
		for (const body of [{}, { done: 1 }, { done: 'true' }, '{bad']) {
			assert.equal((await request('PATCH', '/api/todos/1', body)).status, 400);
		}
	},
	'DELETE removes a todo': async ({ request }) => {
		await request('POST', '/api/todos', { title: 'x' });
		const res = await request('DELETE', '/api/todos/1');
		assert.equal(res.status, 204);
		assert.equal(res.text, '');
		assert.deepEqual((await request('GET', '/api/todos')).json, []);
	},
	'PATCH and DELETE on a missing id return 404': async ({ request }) => {
		await request('POST', '/api/todos', { title: 'x' });
		for (const id of ['2', '0', 'abc', '-1']) {
			assert.equal((await request('PATCH', `/api/todos/${id}`, { done: true })).status, 404, `PATCH ${id}`);
			assert.equal((await request('DELETE', `/api/todos/${id}`)).status, 404, `DELETE ${id}`);
		}
		assert.equal((await request('GET', '/api/todos')).json.length, 1);
	},
	'todos survive a restart': async ({ request, restart }) => {
		await request('POST', '/api/todos', { title: '重启' });
		await request('PATCH', '/api/todos/1', { done: true });
		await restart();
		assert.deepEqual((await request('GET', '/api/todos')).json, [{ id: 1, title: '重启', done: true }]);
	},
};
