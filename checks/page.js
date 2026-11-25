import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';

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
};
