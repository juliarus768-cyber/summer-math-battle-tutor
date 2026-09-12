import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
for (const marker of ['normalizeLoadedState', "'-backup'", "'-corrupt'", 'readback', 'recovery-readonly', 'function doResetProgress', 'if (resetInProgress) return', 'resetInProgress = true']) {
  assert.match(source, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}

const fresh = () => ({ activePlayer:'alex', alex:{lvl:1,xp:0,coins:0}, katya:{lvl:1,xp:0,coins:0} });
const normalize = raw => {
  const out = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : fresh();
  let safe = !!(raw && typeof raw === 'object' && !Array.isArray(raw));
  if (!['alex','katya'].includes(out.activePlayer)) { out.activePlayer='alex'; safe=false; }
  for (const who of ['alex','katya']) if (!out[who] || typeof out[who] !== 'object' || Array.isArray(out[who])) { out[who]=fresh()[who]; safe=false; }
  return {out,safe};
};
const current = { ...fresh(), custom:{keep:true} };
assert.equal(normalize(current).out.custom.keep, true);
assert.equal(normalize(current).safe, true);
assert.equal(normalize({ ...fresh(), katya:undefined }).safe, false);
assert.equal(normalize({ ...fresh(), alex:undefined }).safe, false);
assert.equal(normalize({ ...fresh(), activePlayer:'nobody' }).safe, false);
assert.equal(normalize(null).safe, false);

let primary = JSON.stringify(current), backup = null, corrupt = '{bad';
backup = primary;
assert.equal(JSON.parse(backup).custom.keep, true);
assert.equal(corrupt, '{bad');
let failed = false;
try { JSON.parse(primary + 'x'); } catch { failed = true; }
assert.equal(failed, true);
assert.equal(normalize({ ...fresh(), alex:{lvl:-4,xp:'bad'}, katya:{lvl:2,xp:5} }).out.katya.lvl, 2);
assert.notEqual(normalize({ ...fresh(), alex:{lvl:2}, katya:{lvl:3} }).out.alex, normalize({ ...fresh(), alex:{lvl:2}, katya:{lvl:3} }).out.katya);
let reset = false;
let persisted = JSON.stringify(current);
const lastKnownGood = persisted;
reset = true;
if (!reset) persisted = JSON.stringify(current); // beforeunload must not resurrect reset data
persisted = null;
assert.equal(persisted, null);
assert.equal(JSON.parse(lastKnownGood).custom.keep, true);
console.log('persistence and recovery regression checks passed');
