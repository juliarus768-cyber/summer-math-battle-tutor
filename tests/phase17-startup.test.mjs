import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
if (!scripts.length) throw new Error('no inline application script found');
for (const [i, source] of scripts.entries()) new vm.Script(source, { filename: `index-inline-${i}.js` });
if (html.includes('build __BUILD_ID__')) throw new Error('development build placeholder remains visible');
console.log('Phase 17 startup parse regression checks passed');
