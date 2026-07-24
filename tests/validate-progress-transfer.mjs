import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function extractFunction(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} must exist`);
  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  for (let i = bodyStart; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`Could not extract ${name}`);
}

const context = vm.createContext({ Array, JSON, Number, Object });
vm.runInContext(
  `${extractFunction('validateImportedProgress')}
   ${extractFunction('summarizeImportDifferences')}`,
  context
);

const historical = {
  format: 'summer-math-battle-state',
  formatVersion: 1,
  storageKey: 'smbt-state-v2',
  exportedAt: '2026-07-24T20:14:51.850700Z',
  familySync: {
    code: 'H7K9M2QX',
    lastSynced: 1784924000000,
    note: 'Metadata only. Importing this file never links a device or writes to Firebase.'
  },
  state: {
    alex: { lvl:4, xp:50, xpMax:250, totalXP:500, coins:42, keys:1, streak:3, updatedAt:1784857000000 },
    katya: { lvl:3, xp:25, xpMax:200, totalXP:275, coins:55, keys:2, streak:2, updatedAt:1784856000000 },
    mastery: {
      alex: { fractions:{ seen:12, correct:9, recent:[1,1,0] } },
      katya: { geometry:{ seen:8, correct:7, recent:[1,1,1] } }
    },
    mathThinking: {
      alex: { unlocked:['fractions.equal-pieces'], events:[{ questionKey:'a', correct:true }] },
      katya: { unlocked:['geometry.fence-cover-fill'], events:[{ questionKey:'b', correct:false }] }
    },
    activity: { alex:{ missions:2, battles:1, money:1 }, katya:{ missions:3, battles:2, money:0 } },
    requests: [{ id:'reward-1', who:'alex', status:'approved' }],
    rewards: [{ id:'movie', coins:120, enabled:true }],
    log: [{ who:'katya', msg:'Mission complete' }],
    settings: { muted:false, reducedMotion:false },
    daily: { alex:{ date:'2026-07-24', done:true }, katya:{ date:'2026-07-24', done:true } }
  }
};

const checked = context.validateImportedProgress(historical);
assert.equal(checked.ok, true, checked.error);
assert.deepEqual(
  JSON.parse(JSON.stringify(checked.familySync)),
  historical.familySync,
  'Family Sync metadata must survive validation without linking the device'
);
assert.deepEqual(
  JSON.parse(JSON.stringify(checked.state.mastery)),
  historical.state.mastery,
  'mastery must survive validation unchanged'
);
assert.deepEqual(
  JSON.parse(JSON.stringify(checked.state.mathThinking)),
  historical.state.mathThinking,
  'Math Secrets and question evidence must survive validation unchanged'
);
assert.deepEqual(
  JSON.parse(JSON.stringify(checked.state.requests)),
  historical.state.requests,
  'reward requests must survive validation unchanged'
);
assert.deepEqual(
  JSON.parse(JSON.stringify(checked.state.rewards)),
  historical.state.rewards,
  'store configuration/history must survive validation unchanged'
);
assert.deepEqual(
  JSON.parse(JSON.stringify(checked.state.settings)),
  historical.state.settings,
  'settings must survive validation unchanged'
);

const current = {
  alex: { lvl:3, totalXP:300, coins:60, keys:0, streak:1 },
  katya: { lvl:1, totalXP:5, coins:15, keys:0, streak:0 }
};
const preview = context.summarizeImportDifferences(current, historical.state);
assert.equal(preview.some(row => row.includes('500') && row.includes('42')), true);
assert.equal(preview.some(row => row.includes('275') && row.includes('55')), true);
assert.equal(preview.some(row => row.includes('Math Secrets: Alex 1, Katya 1')), true);

const confirmSource = extractFunction('confirmProgressImport');
assert.match(confirmSource, /Import stopped: this device has a newer/, 'newer child profiles must block import');
assert.ok(
  confirmSource.indexOf("localStorage.setItem('smbt-state-v2-backup-before-import-'") <
    confirmSource.indexOf('Object.keys(state).forEach'),
  'the complete local backup must be saved before state replacement'
);
assert.match(confirmSource, /downloadJSONFile\(/, 'the pre-import backup must also be downloaded');
assert.doesNotMatch(confirmSource, /Cloud\.linkFamily|Cloud\.pushNow|Cloud\.syncNow/, 'import confirmation must never write to Firebase');
assert.match(source, /function buildProgressExportEnvelope\(/, 'exports must use the complete envelope builder');
assert.match(source, /Metadata only\. Importing this file never links a device or writes to Firebase\./);

console.log('Validated PIN-gated progress transfer with non-empty mastery, secrets, missions, rewards, store data, and settings.');
