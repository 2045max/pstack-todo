// RFC 4180: quote a field that holds a comma, double quote, CR or LF, and double its quotes.
const field = (value) => {
	const text = String(value);
	return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const row = (values) => `${values.map(field).join(',')}\r\n`;

export default {
	'GET /api/export.csv': ({ store }) => ({
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': 'attachment; filename="todos.csv"',
		},
		body: [['id', 'title', 'done'], ...store.list().map(({ id, title, done }) => [id, title, done])].map(row).join(''),
	}),
};
