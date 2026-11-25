import app from '/app.js';

const form = document.createElement('form');
const input = document.createElement('input');
input.type = 'text';
input.placeholder = '要做什么？';
input.required = true;
const button = document.createElement('button');
button.textContent = '添加';
form.append(input, button);
app.toolbar.prepend(form);

form.addEventListener('submit', async (event) => {
	event.preventDefault();
	if (input.value.trim() === '') return;
	await app.api('POST', '/api/todos', { title: input.value });
	input.value = '';
	await app.refresh();
});
