import app from '/app.js';

app.onRow((li, todo) => {
	const button = document.createElement('button');
	button.className = 'remove';
	button.textContent = '删除';
	button.addEventListener('click', async () => {
		await app.api('DELETE', `/api/todos/${todo.id}`);
		await app.refresh();
	});
	li.append(button);
});
