import { HttpError } from '../lib/http.js';

const STATUS = {
	open: (todo) => !todo.done,
	done: (todo) => todo.done,
};

export default (todos, value) => {
	if (!Object.hasOwn(STATUS, value)) throw new HttpError(400, 'status must be open or done');
	return todos.filter(STATUS[value]);
};
