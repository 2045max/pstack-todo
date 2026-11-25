import app from '/app.js';

const link = document.createElement('a');
link.href = '/api/export.csv';
link.download = '';
link.textContent = '导出 CSV';
app.toolbar.append(link);
