import {mkdir,copyFile,cp} from 'node:fs/promises';

// Publish only browser assets, excluding tests, local metadata, and source tooling.
await mkdir('dist',{recursive:true});
for(const file of ['index.html','style.css']) await copyFile(file,`dist/${file}`);
await cp('src','dist/src',{recursive:true});
console.log('Static website built in dist/');
