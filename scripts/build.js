import { mkdir, copyFile, cp, rm } from 'node:fs/promises';

// Publish only browser assets, excluding tests, local metadata, and source tooling.
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const file of ['index.html', 'style.css', 'themes.css'])
  await copyFile(file, `dist/${file}`);
await cp('src', 'dist/src', { recursive: true });
console.log('Static website built in dist/');
