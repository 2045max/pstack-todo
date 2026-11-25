import { DatabaseSync } from 'node:sqlite';

const toTodo = (row) => row && { id: row.id, title: row.title, done: row.done === 1 };

// The only code that touches SQLite. A Todo is { id, title, done }.
export function openStore(path) {
	const db = new DatabaseSync(path);
	db.exec(`CREATE TABLE IF NOT EXISTS todos (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		done INTEGER NOT NULL DEFAULT 0 CHECK (done IN (0, 1))
	)`);
	const list = db.prepare('SELECT * FROM todos ORDER BY id');
	const create = db.prepare('INSERT INTO todos (title) VALUES (?) RETURNING *');
	const setDone = db.prepare('UPDATE todos SET done = ? WHERE id = ? RETURNING *');
	const remove = db.prepare('DELETE FROM todos WHERE id = ?');
	return {
		list: () => list.all().map(toTodo),
		create: (title) => toTodo(create.get(title)),
		setDone: (id, done) => toTodo(setDone.get(done ? 1 : 0, id)),
		remove: (id) => remove.run(id).changes > 0,
	};
}
