import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';

const realFetch = globalThis.fetch;

// Just enough DOM to run app.js. Writing markup throws, so titles can only be set as text.
function fakeElement() {
	const el = { children: [], dataset: {}, classList: { toggle() {} } };
	el.append = (...nodes) => el.children.push(...nodes);
	el.replaceChildren = (...nodes) => (el.children = nodes);
	const noMarkup = () => {
		throw new Error('page wrote markup instead of text');
	};
	el.insertAdjacentHTML = noMarkup;
	for (const prop of ['innerHTML', 'outerHTML']) Object.defineProperty(el, prop, { set: noMarkup });
	return el;
}

export default {
	'GET / loads every file in public/features': async ({ request }) => {
		const page = await request('GET', '/');
		assert.equal(page.status, 200);
		assert.equal(page.headers.get('content-type'), 'text/html; charset=utf-8');
		const srcs = [...page.text.matchAll(/<script[^>]* src="([^"]+)"/g)].map((m) => m[1]);
		const features = readdirSync(new URL('../public/features/', import.meta.url)).sort();
		assert.deepEqual(srcs, ['/app.js', ...features.map((f) => `/features/${f}`)]);
		for (const src of srcs) assert.equal((await request('GET', src)).status, 200, src);
	},
	'the page shows HTML in a title as text': async ({ request }) => {
		const title = '<img src=x onerror="alert(1)">';
		const elements = { toolbar: fakeElement(), list: fakeElement() };
		globalThis.document = { getElementById: (id) => elements[id], createElement: fakeElement };
		globalThis.addEventListener = () => {};
		const source = (await request('GET', '/app.js')).text;
		globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => [{ id: 1, title, done: false }] });
		try {
			const { default: app } = await import(`data:text/javascript,${encodeURIComponent(source)}`);
			await app.refresh();
		} finally {
			delete globalThis.document;
			delete globalThis.addEventListener;
			globalThis.fetch = realFetch;
		}
		const [span] = elements.list.children[0].children;
		assert.equal(span.textContent, title);
	},
	'the server listens on 127.0.0.1 only': async ({ url }) => {
		const { port } = new URL(url());
		// 0.0.0.0 would answer on every loopback address; 127.0.0.1 must not answer on 127.0.0.2.
		await assert.rejects(fetch(`http://127.0.0.2:${port}/`));
	},
};
