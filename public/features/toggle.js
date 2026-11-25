import app from '/app.js';

app.onRow((li, todo) => {
	const box = document.createElement('input');
	box.type = 'checkbox';
	box.checked = todo.done;
	box.addEventListener('change', async () => {
		await app.api('PATCH', `/api/todos/${todo.id}`, { done: box.checked });
		await app.refresh();
	});
	li.prepend(box);
});
