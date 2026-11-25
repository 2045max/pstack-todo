import { readFileSync } from 'node:fs';

const PUBLIC = new URL('../public/', import.meta.url);
const TYPES = { html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8' };

const file = (name) => () => ({
	headers: { 'Content-Type': TYPES[name.split('.').pop()] },
	body: readFileSync(new URL(name, PUBLIC)),
});

export default {
	'GET /': ({ features }) => ({
		headers: { 'Content-Type': TYPES.html },
		body: readFileSync(new URL('index.html', PUBLIC), 'utf8').replace(
			'<!-- features -->',
			() => features.map((name) => `<script type="module" src="/features/${name}.js"></script>`).join('\n'),
		),
	}),
	'GET /app.js': file('app.js'),
	'GET /features/:name.js': ({ features, params }) =>
		features.includes(params.name) ? file(`features/${params.name}.js`)() : { status: 404, json: { error: 'not found' } },
};
