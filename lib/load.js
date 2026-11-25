import { readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { pathToFileURL } from 'node:url';

// Every .js file in dir, as [name without extension, default export], sorted by name.
export async function loadDir(dir) {
	const files = readdirSync(dir).filter((f) => f.endsWith('.js')).sort();
	return Promise.all(
		files.map(async (f) => [basename(f, '.js'), (await import(pathToFileURL(join(dir, f)))).default]),
	);
}
