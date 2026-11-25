// app is the whole contract for public/features/*.js:
//   app.toolbar   element to append controls to
//   app.query     URLSearchParams sent with GET /api/todos
//   app.onRow(fn) fn(li, todo) runs for every rendered row
//   app.refresh() reload and render the list
//   app.api(method, path, body) JSON request, throws on error status
const toolbar = document.getElementById('toolbar');
const list = document.getElementById('list');
const rowHooks = [];
let latest = 0;

const app = {
	toolbar,
	query: new URLSearchParams(),
	onRow: (fn) => rowHooks.push(fn),
	async api(method, path, body) {
		const res = await fetch(path, { method, body: body && JSON.stringify(body) });
		if (!res.ok) throw new Error(`${method} ${path}: ${res.status}`);
		return res.status === 204 ? undefined : res.json();
	},
	async refresh() {
		const seq = ++latest;
		const todos = await app.api('GET', `/api/todos?${app.query}`);
		if (seq !== latest) return; // a newer refresh was started
		list.replaceChildren(
			...todos.map((todo) => {
				const li = document.createElement('li');
				li.dataset.id = todo.id;
				li.classList.toggle('done', todo.done);
				const title = document.createElement('span');
				title.className = 'title';
				title.textContent = todo.title;
				li.append(title);
				for (const hook of rowHooks) hook(li, todo);
				return li;
			}),
		);
	},
};

export default app;
addEventListener('load', app.refresh);
