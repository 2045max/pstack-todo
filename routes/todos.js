import { HttpError } from '../lib/http.js';

const notFound = () => new HttpError(404, 'todo not found');

function parseTitle(body) {
	const title = body?.title;
	if (typeof title !== 'string' || title.trim() === '') throw new HttpError(400, 'title is required');
	return title;
}

function parseDone(body) {
	if (typeof body?.done !== 'boolean') throw new HttpError(400, 'done must be a boolean');
	return body.done;
}

export default {
	'GET /api/todos': ({ store, filters, query }) => {
		let todos = store.list();
		for (const [param, filter] of filters) {
			if (query.has(param)) todos = filter(todos, query.get(param));
		}
		return { json: todos };
	},
	'POST /api/todos': async ({ store, readJson }) => ({
		status: 201,
		json: store.create(parseTitle(await readJson())),
	}),
	'PATCH /api/todos/:id': async ({ store, params, readJson }) => {
		const todo = store.setDone(Number(params.id), parseDone(await readJson()));
		if (!todo) throw notFound();
		return { json: todo };
	},
	'DELETE /api/todos/:id': ({ store, params }) => {
		if (!store.remove(Number(params.id))) throw notFound();
		return { status: 204 };
	},
};
