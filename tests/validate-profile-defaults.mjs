import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

assert.match(
  source,
  /alex:\s+\{\s*lvl:\s*1,[^}]*coins:\s*80,[^}]*keys:\s*0/,
  'fresh Alex profile must start with 80 coins and 0 keys'
);
assert.match(
  source,
  /katya:\s*\{\s*lvl:\s*1,[^}]*coins:\s*110,[^}]*keys:\s*0/,
  'fresh Katya profile must start with 110 coins and 0 keys'
);
assert.match(
  source,
  /if \(state\[w\]\.coins == null\) state\[w\]\.coins = FRESH\[w\]\.coins;/,
  'coins must be initialized only when the stored field is missing'
);
assert.match(
  source,
  /if \(state\[w\]\.keys == null\) state\[w\]\.keys = FRESH\[w\]\.keys;/,
  'keys must be initialized only when the stored field is missing'
);
assert.doesNotMatch(
  source,
  /restoreRememberedJuly15Progress/,
  'an unconditional historical balance floor must not overwrite stored progress'
);

console.log('Validated fresh child balance defaults and non-destructive missing-field initialization.');
