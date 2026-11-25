import assert from 'node:assert/strict';

// Strict RFC 4180 parser: rows end in CRLF, and text it cannot read one way only is an error.
function parseCsv(text) {
	const rows = [];
	let row = [];
	let pos = 0;
	while (pos < text.length) {
		let value = '';
		if (text[pos] === '"') {
			pos++;
			for (;;) {
				const end = text.indexOf('"', pos);
				assert.notEqual(end, -1, 'unclosed quoted field');
				value += text.slice(pos, end);
				pos = end + 1;
				if (text[pos] !== '"') break;
				value += '"';
				pos++;
			}
		} else {
			while (pos < text.length && !',"\r\n'.includes(text[pos])) value += text[pos++];
		}
		row.push(value);
		if (text[pos] === ',') {
			pos++;
		} else {
			assert.equal(text.slice(pos, pos + 2), '\r\n', `expected "," or CRLF at ${pos} in ${JSON.stringify(text)}`);
			pos += 2;
			rows.push(row);
			row = [];
		}
	}
	assert.deepEqual(row, [], 'last row is not terminated');
	return rows;
}

// More than 9 titles, so that sorting ids as text would change the order.
const TITLES = [
	'zebra',
	'买牛奶',
	'a,b',
	',',
	'say "hi"',
	'"',
	'""',
	'"quoted"',
	'line1\nline2',
	'line1\r\nline2',
	'line1\rline2',
	'\nx\n',
	'x\r',
	'  spaces  ',
	'\ttab\t',
	'买“牛奶”，\n"两瓶", 第二行\r\n完',
	'a","b',
	'"\r\n99,fake,true\r\n"',
	'=1+1',
	'🛒 é',
	'apple',
];

const create = async (request, titles) => {
	for (const title of titles) assert.equal((await request('POST', '/api/todos', { title })).status, 201);
};

export default {
	'GET /api/export.csv is a CSV attachment': async ({ request }) => {
		const res = await request('GET', '/api/export.csv');
		assert.equal(res.status, 200);
		assert.equal(res.headers.get('content-type'), 'text/csv; charset=utf-8');
		assert.equal(res.headers.get('content-disposition'), 'attachment; filename="todos.csv"');
	},
	'an empty list exports the header row only': async ({ request }) => {
		assert.equal((await request('GET', '/api/export.csv')).text, 'id,title,done\r\n');
	},
	'the export is UTF-8 without a BOM': async ({ request, url }) => {
		await create(request, ['买牛奶']);
		// request() decodes the body, and decoding hides a BOM.
		const bytes = Buffer.from(await (await fetch(`${url()}/api/export.csv`)).arrayBuffer());
		assert.deepEqual(bytes, Buffer.from('id,title,done\r\n1,买牛奶,false\r\n'));
	},
	'every title survives the CSV round trip': async ({ request }) => {
		await create(request, TITLES);
		const [header, ...rows] = parseCsv((await request('GET', '/api/export.csv')).text);
		assert.deepEqual(header, ['id', 'title', 'done']);
		assert.deepEqual(rows, TITLES.map((title, i) => [String(i + 1), title, 'false']));
	},
	'the export matches GET /api/todos after edits': async ({ request }) => {
		await create(request, TITLES);
		for (const id of [1, 5, 21]) await request('PATCH', `/api/todos/${id}`, { done: true });
		for (const id of [2, 10]) await request('DELETE', `/api/todos/${id}`);
		const [, ...rows] = parseCsv((await request('GET', '/api/export.csv')).text);
		const todos = (await request('GET', '/api/todos')).json;
		assert.deepEqual(rows, todos.map((t) => [String(t.id), t.title, String(t.done)]));
		assert.deepEqual(rows.filter((r) => r[2] === 'true').map((r) => r[0]), ['1', '5', '21']);
		assert.equal(rows.length, TITLES.length - 2);
	},
	'titles with comma, quote and newlines in every order survive': async ({ request }) => {
		const parts = [',', '"', '\n', '\r\n', '\r', '中'];
		const titles = parts.flatMap((a) => parts.flatMap((b) => parts.map((c) => `x${a}${b}${c}`)));
		await create(request, titles);
		const [, ...rows] = parseCsv((await request('GET', '/api/export.csv')).text);
		assert.deepEqual(rows.map((r) => r[1]), titles);
	},
};
