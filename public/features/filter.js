import app from '/app.js';

const group = document.createElement('div');
group.className = 'filter';
group.role = 'group';
group.ariaLabel = '按状态筛选';

const buttons = [
	['全部', null],
	['未完成', 'open'],
	['已完成', 'done'],
].map(([label, status]) => {
	const button = document.createElement('button');
	button.textContent = label;
	button.addEventListener('click', async () => {
		if (status === null) app.query.delete('status');
		else app.query.set('status', status);
		markActive();
		await app.refresh();
	});
	group.append(button);
	return { button, status };
});

function markActive() {
	for (const { button, status } of buttons) {
		const active = app.query.get('status') === status;
		button.ariaPressed = String(active);
		button.style.fontWeight = active ? 'bold' : '';
	}
}

markActive();
app.toolbar.append(group);
