import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

assert.match(source, /document\.createElement\('button'\)/);
assert.match(source, /button\.textContent = choice/);
assert.match(source, /button\.addEventListener\('click', \(\) => chooseMissionAnswer\(choice\)\)/);
assert.doesNotMatch(source, /onclick=\"chooseMissionAnswer/);

const values = ["don't", "Let's go to the park.", "s'il vous plaît", 'é', '3/4', '0.5', '42'];
assert.deepEqual(values, ["don't", "Let's go to the park.", "s'il vous plaît", 'é', '3/4', '0.5', '42']);
console.log('choice-rendering regression checks passed');
