import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function extractFunction(name) {
  const regularStart = source.indexOf(`function ${name}(`);
  const asyncStart = source.indexOf(`async function ${name}(`);
  const start = asyncStart >= 0 && (regularStart < 0 || asyncStart < regularStart)
    ? asyncStart
    : regularStart;
  assert.notEqual(start, -1, `${name} must exist`);
  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = bodyStart; i < source.length; i++) {
    const ch = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { quote = ch; continue; }
    if (ch === '{') depth++;
    if (ch === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`Could not extract ${name}`);
}

const storageStart = source.indexOf("const PRIMARY_STATE_KEY = 'smbt-state-v2';");
const storageEnd = source.indexOf('const Store = createSafeStore', storageStart);
const stateStart = source.indexOf('const FRESH = {', storageEnd);
const stateEnd = source.indexOf('const loadedState = Store.get', stateStart);
assert.ok(storageStart >= 0 && storageEnd > storageStart && stateStart > storageEnd && stateEnd > stateStart);

const context = vm.createContext({
  JSON, Number, Object, Array, Map, Set, Math,
  console: { warn() {}, log() {} }
});
vm.runInContext(
  `${source.slice(storageStart, storageEnd)}\n${source.slice(stateStart, stateEnd)}\n` +
  `globalThis.api={createSafeStore,normalizeLoadedState,FRESH,PRIMARY_STATE_KEY,STATE_BACKUP_KEY,STATE_CORRUPT_KEY};`,
  context
);
const { createSafeStore, normalizeLoadedState } = context.api;
const PRIMARY = 'smbt-state-v2';
const BACKUP = 'smbt-state-v2-backup';
const CORRUPT = 'smbt-state-v2-corrupt';

class MockStorage {
  constructor(initial = {}, available = true) {
    this.map = new Map(Object.entries(initial));
    this.available = available;
    this.failGet = new Set();
    this.failSet = new Set();
    this.failRemove = new Set();
    this.readOverride = new Map();
    this.operations = [];
  }
  getItem(key) {
    this.operations.push(`get:${key}`);
    if (this.failGet.has(key)) throw new Error('read failed');
    if (this.readOverride.has(key)) return this.readOverride.get(key);
    return this.map.has(key) ? this.map.get(key) : null;
  }
  setItem(key, value) {
    this.operations.push(`set:${key}`);
    if (!this.available || this.failSet.has(key) || [...this.failSet].some(pattern => pattern.endsWith('*') && key.startsWith(pattern.slice(0, -1)))) throw new Error('write failed');
    this.map.set(key, String(value));
  }
  removeItem(key) {
    this.operations.push(`remove:${key}`);
    if (!this.available || this.failRemove.has(key)) throw new Error('remove failed');
    this.map.delete(key);
  }
}

function fixture(overrides = {}) {
  return {
    activePlayer: 'alex',
    alex: { lvl:4, xp:50, xpMax:250, coins:82, streak:3, totalXP:500, keys:1, lastKeyMilestone:300, updatedAt:1000, alexOnly:'kept' },
    katya: { lvl:3, xp:25, xpMax:200, coins:55, streak:2, totalXP:275, keys:2, lastKeyMilestone:200, updatedAt:900, katyaOnly:'kept' },
    mastery: { alex:{ fractions:{ seen:12 } }, katya:{ geometry:{ seen:8 } } },
    mathThinking: {
      version:3,
      alex:{ unlocked:['fractions.equal-pieces'], events:[{ questionKey:'a', correct:true }] },
      katya:{ unlocked:['geometry.fence-cover-fill'], events:[{ questionKey:'b', correct:false }] }
    },
    requests:[{ id:'r1', who:'alex', status:'approved' }],
    rewards:[{ id:'movie', coins:120, enabled:true }],
    log:[{ who:'katya', msg:'Mission complete' }],
    settings:{ muted:false },
    activity:{ alex:{ missions:2 }, katya:{ missions:3 } },
    daily:{ alex:{ date:'2026-07-24', count:1 }, katya:{ date:'2026-07-24', count:1 } },
    pausedDaily:{ alex:{ i:4, questions:[{ q:'2+2', a:4 }] }, katya:null },
    evidence:{ alex:[{ outcome:'first-attempt' }], katya:[] },
    moneyLabDaily:{ alex:{ date:'2026-09-17', rewarded:2 }, katya:{ date:'', rewarded:0 } },
    cloudMetadata:{ device:'tablet', revision:7 },
    futureTop:{ enabled:true },
    ...overrides
  };
}

function makeStore(storage, cloudCalls = []) {
  const host = { __storageUiReady:false };
  const cloud = { scheduleDebouncedPush() { cloudCalls.push('queued'); } };
  return { store:createSafeStore(storage, host, () => cloud), host, cloudCalls };
}

// Fresh-install backfill uses an empty lastDay sentinel until the first
// completed day. It is valid state and must be writable through Store.
{
  const fresh = JSON.parse(JSON.stringify(context.api.FRESH));
  fresh.alex.lastDay = '';
  fresh.katya.lastDay = '';
  const normalized = normalizeLoadedState(fresh);
  assert.equal(normalized.safe, true, 'empty lastDay sentinels are valid');
  const storage = new MockStorage();
  const { store, host } = makeStore(storage);
  const result = store.set(PRIMARY, fresh);
  assert.equal(result.ok, true, 'fresh state can be written');
  assert.ok(storage.getItem(PRIMARY), 'first write creates primary state');
  assert.ok(storage.getItem(BACKUP), 'first write creates a valid backup');
  assert.equal(host.__storageStatus, null, 'first valid write does not enter validation recovery');

  const reloaded = makeStore(storage).store.get(PRIMARY, context.api.FRESH);
  assert.equal(reloaded.status, 'ok', 'the first save reloads as valid state');
  assert.equal(reloaded.value.alex.lastDay, '');
  assert.equal(reloaded.value.katya.lastDay, '');
}

// Fresh-install Parent PIN setup uses the same verified Store path and does
// not become a validation failure merely because streak dates are empty.
{
  const fresh = JSON.parse(JSON.stringify(context.api.FRESH));
  fresh.alex.lastDay = '';
  fresh.katya.lastDay = '';
  fresh.parentPin = '2468';
  const storage = new MockStorage();
  const { store } = makeStore(storage);
  assert.equal(store.set(PRIMARY, fresh).ok, true, 'fresh Parent PIN state persists');
  assert.equal(JSON.parse(storage.getItem(PRIMARY)).parentPin, '2468');
}

// Empty and valid local-date keys are accepted; malformed nonempty values
// remain unsafe and are repaired. The existing format-only behavior for
// calendar-impossible but correctly shaped keys is intentionally unchanged.
{
  const valid = fixture();
  valid.alex.lastDay = '2026-09-24';
  valid.katya.lastDay = '';
  assert.equal(normalizeLoadedState(valid).safe, true);
  for (const malformed of ['abc', '09/24/2026']) {
    const value = fixture();
    value.alex.lastDay = malformed;
    const normalized = normalizeLoadedState(value);
    assert.equal(normalized.safe, false, `${malformed} must remain unsafe`);
    assert.equal(normalized.state.alex.lastDay, '');
  }
  const shapedButImpossible = fixture();
  shapedButImpossible.alex.lastDay = '2026-99-99';
  assert.equal(normalizeLoadedState(shapedButImpossible).safe, true);
}

// Production defaults are unchanged by persistence hardening.
assert.deepEqual(JSON.parse(JSON.stringify(context.api.FRESH)), {
  activePlayer:'alex',
  alex:{ lvl:1, xp:0, xpMax:100, coins:80, streak:0, totalXP:0, keys:0, lastKeyMilestone:0, updatedAt:0 },
  katya:{ lvl:1, xp:0, xpMax:100, coins:110, streak:0, totalXP:0, keys:0, lastKeyMilestone:0, updatedAt:0 }
});

// Current valid save: load, normalize missing newer fields, preserve all known/unknown data, and seed backup.
{
  const current = fixture();
  const storage = new MockStorage({ [PRIMARY]:JSON.stringify(current) });
  const { store } = makeStore(storage);
  const loaded = store.get(PRIMARY, context.api.FRESH);
  assert.equal(loaded.status, 'ok');
  assert.equal(loaded.value.futureTop.enabled, true);
  assert.equal(loaded.value.alex.alexOnly, 'kept');
  assert.equal(loaded.value.katya.katyaOnly, 'kept');
  assert.deepEqual(JSON.parse(JSON.stringify(loaded.value.mathThinking)), current.mathThinking);
  assert.ok(storage.getItem(BACKUP), 'valid primary seeds a recoverable backup');
}

// Older July-style save with missing newer fields remains valid and gets targeted defaults only.
{
  const july = fixture();
  delete july.pausedDaily;
  delete july.evidence;
  delete july.moneyLabDaily;
  delete july.alex.updatedAt;
  const normalized = normalizeLoadedState(july);
  assert.equal(normalized.safe, true);
  assert.equal(normalized.state.alex.updatedAt, 0);
  assert.deepEqual(JSON.parse(JSON.stringify(normalized.state.pausedDaily)), { alex:null, katya:null });
  assert.equal(normalized.state.alex.coins, 82);
  assert.equal(normalized.state.katya.coins, 55);
}

// A genuinely new device starts from unchanged defaults without queueing cloud until a verified save exists.
{
  const storage = new MockStorage();
  const calls = [];
  const { store } = makeStore(storage, calls);
  const loaded = store.get(PRIMARY, context.api.FRESH);
  assert.equal(loaded.status, 'missing');
  assert.equal(loaded.value.alex.coins, 80);
  assert.equal(loaded.value.katya.coins, 110);
  assert.equal(calls.length, 0);
  assert.equal(store.set(PRIMARY, loaded.value).ok, true);
  assert.equal(calls.length, 1);
}

// Missing or malformed whole child structures are uncertain and never silently promoted.
for (const who of ['alex','katya']) {
  const unsafe = fixture();
  delete unsafe[who];
  const normalized = normalizeLoadedState(unsafe);
  assert.equal(normalized.safe, false, `missing ${who} must be unsafe`);
  const other = who === 'alex' ? 'katya' : 'alex';
  assert.equal(normalized.state[other][`${other}Only`], 'kept', `${other} remains isolated`);
}

// Invalid child scalar repair is conservative; valid high finite values survive.
{
  const high = fixture();
  high.alex.totalXP = 987654321;
  high.alex.coins = 7654321;
  assert.equal(normalizeLoadedState(high).state.alex.totalXP, 987654321);
  const bad = fixture();
  bad.katya.coins = -1;
  assert.equal(normalizeLoadedState(bad).safe, false);
  assert.equal(normalizeLoadedState(bad).state.katya.coins, 110);
  const badPlayer = fixture({ activePlayer:'parent' });
  assert.equal(normalizeLoadedState(badPlayer).safe, false);
}

// Non-finite runtime values are rejected before JSON serialization can turn them into null.
{
  const storage = new MockStorage({ [PRIMARY]:JSON.stringify(fixture()) });
  const calls = [];
  const { store } = makeStore(storage, calls);
  store.get(PRIMARY, context.api.FRESH);
  const bad = fixture(); bad.alex.xp = Number.NaN;
  assert.equal(store.set(PRIMARY, bad).reason, 'validation');
  assert.equal(JSON.parse(storage.getItem(PRIMARY)).alex.xp, 50);
  assert.equal(calls.length, 0);
}

// Malformed primary + valid backup recovers, preserves exact corrupt raw, and never queues a cloud write on load.
{
  const raw = '{"alex":';
  const good = fixture();
  const storage = new MockStorage({ [PRIMARY]:raw, [BACKUP]:JSON.stringify(good) });
  const calls = [];
  const { store, host } = makeStore(storage, calls);
  const loaded = store.get(PRIMARY, context.api.FRESH);
  assert.equal(loaded.status, 'recovered');
  assert.equal(loaded.value.alex.totalXP, 500);
  assert.equal(storage.getItem(CORRUPT), raw);
  assert.equal(JSON.parse(storage.getItem(PRIMARY)).katya.totalXP, 275);
  assert.equal(calls.length, 0);
  assert.equal(host.__storageStatus.reason, 'recovered');
  assert.equal(store.cloudSafe(), true);
  assert.equal(store.set(PRIMARY, loaded.value).ok, true);
  assert.equal(calls.length, 1, 'a later verified save follows normal cloud queue policy');
}

// Malformed primary without backup remains untouched, falls back only in memory, and cannot push defaults.
{
  const raw = 'not-json';
  const storage = new MockStorage({ [PRIMARY]:raw });
  const calls = [];
  const { store } = makeStore(storage, calls);
  const loaded = store.get(PRIMARY, context.api.FRESH);
  assert.equal(loaded.status, 'corrupt-json');
  assert.equal(storage.getItem(PRIMARY), raw);
  assert.equal(storage.getItem(CORRUPT), raw);
  assert.equal(store.cloudSafe(), false);
  assert.equal(store.set(PRIMARY, loaded.value).ok, false);
  assert.equal(calls.length, 0);
}

// Parseable but structurally unsafe primary also remains untouched and read-only.
{
  const unsafe = fixture({ alex:null });
  const raw = JSON.stringify(unsafe);
  const storage = new MockStorage({ [PRIMARY]:raw });
  const { store } = makeStore(storage);
  const loaded = store.get(PRIMARY, context.api.FRESH);
  assert.equal(loaded.status, 'invalid-shape');
  assert.equal(loaded.source, 'repaired-memory');
  assert.equal(storage.getItem(PRIMARY), raw);
  assert.equal(store.set(PRIMARY, loaded.value).reason, 'recovery-readonly');
}

// Storage unavailable and read failures are non-persistent and cloud-ineligible.
{
  const unavailable = new MockStorage({}, false);
  const calls = [];
  const { store } = makeStore(unavailable, calls);
  assert.equal(store.get(PRIMARY, context.api.FRESH).status, 'unavailable');
  assert.equal(store.set(PRIMARY, fixture()).ok, false);
  assert.equal(calls.length, 0);
}
{
  const storage = new MockStorage({ [PRIMARY]:JSON.stringify(fixture()) });
  storage.failGet.add(PRIMARY);
  const { store } = makeStore(storage);
  assert.equal(store.get(PRIMARY, context.api.FRESH).status, 'read-failed');
  assert.equal(store.cloudSafe(), false);
}

// Failed write and failed read-back keep the previous backup usable and never queue cloud.
{
  const original = fixture();
  const storage = new MockStorage({ [PRIMARY]:JSON.stringify(original) });
  const calls = [];
  const { store } = makeStore(storage, calls);
  store.get(PRIMARY, context.api.FRESH);
  storage.failSet.add(PRIMARY);
  const changed = fixture(); changed.alex.coins = 999;
  assert.equal(store.set(PRIMARY, changed).reason, 'write');
  assert.equal(JSON.parse(storage.getItem(BACKUP)).alex.coins, 82);
  assert.equal(calls.length, 0);
}
{
  const original = fixture();
  const storage = new MockStorage({ [PRIMARY]:JSON.stringify(original) });
  const calls = [];
  const { store } = makeStore(storage, calls);
  store.get(PRIMARY, context.api.FRESH);
  storage.readOverride.set(PRIMARY, '{mismatch');
  const changed = fixture(); changed.alex.coins = 999;
  assert.equal(store.set(PRIMARY, changed).reason, 'readback');
  assert.equal(JSON.parse(storage.getItem(BACKUP)).alex.coins, 82);
  assert.equal(calls.length, 0);
}

// Backup failure does not destroy a successful verified primary save or suppress its normal cloud queue.
{
  const storage = new MockStorage({ [PRIMARY]:JSON.stringify(fixture()) });
  const calls = [];
  const { store, host } = makeStore(storage, calls);
  store.get(PRIMARY, context.api.FRESH);
  storage.failSet.add(BACKUP);
  const changed = fixture(); changed.katya.coins = 777;
  const result = store.set(PRIMARY, changed);
  assert.equal(result.ok, true);
  assert.equal(result.backupOk, false);
  assert.equal(JSON.parse(storage.getItem(PRIMARY)).katya.coins, 777);
  assert.equal(host.__storageStatus.reason, 'backup-write-failed');
  assert.equal(calls.length, 1);
}

// Unknown and future fields survive a verified load-save round trip without cross-child movement.
{
  const original = fixture();
  const storage = new MockStorage({ [PRIMARY]:JSON.stringify(original) });
  const { store } = makeStore(storage);
  const loaded = store.get(PRIMARY, context.api.FRESH).value;
  assert.equal(store.set(PRIMARY, loaded).ok, true);
  const saved = JSON.parse(storage.getItem(PRIMARY));
  assert.deepEqual(saved.futureTop, original.futureTop);
  assert.equal(saved.alex.alexOnly, 'kept');
  assert.equal(saved.katya.katyaOnly, 'kept');
  assert.equal(saved.alex.katyaOnly, undefined);
  assert.deepEqual(saved.evidence, original.evidence);
  assert.deepEqual(saved.moneyLabDaily, original.moneyLabDaily);
  assert.deepEqual(saved.pausedDaily, original.pausedDaily);
}

// Import validation uses the same normalizer and preserves main-only/unknown data.
vm.runInContext(
  `${extractFunction('validateImportedProgress')}\n` +
  `globalThis.validateImportedProgress=validateImportedProgress;`,
  context
);
const envelope = state => ({ format:'summer-math-battle-state', formatVersion:1, storageKey:PRIMARY, familySync:{ code:'ABCDEFGH' }, state });
{
  const checked = context.validateImportedProgress(envelope(fixture()));
  assert.equal(checked.ok, true, checked.error);
  assert.deepEqual(JSON.parse(JSON.stringify(checked.state.mathThinking)), fixture().mathThinking);
  assert.deepEqual(JSON.parse(JSON.stringify(checked.state.futureTop)), { enabled:true });
}
{
  const invalid = fixture(); delete invalid.katya;
  const calls = [];
  const storage = new MockStorage({ [PRIMARY]:JSON.stringify(fixture()) });
  const { store } = makeStore(storage, calls);
  store.get(PRIMARY, context.api.FRESH);
  const checked = context.validateImportedProgress(envelope(invalid));
  assert.equal(checked.ok, false);
  if (checked.ok) store.set(PRIMARY, checked.state);
  assert.equal(calls.length, 0, 'invalid import cannot reach any cloud queue');
}
// A valid sanitized export reaches the real preview renderer, escapes the
// filename, and remains pending until the parent explicitly confirms import.
vm.runInContext(
  `${extractFunction('escapeHtml')}\n` +
  `${extractFunction('summarizeImportDifferences')}\n` +
  `${extractFunction('prepareProgressImport')}\n` +
  `globalThis.prepareProgressImport=prepareProgressImport; globalThis.escapeHtml=escapeHtml; ` +
  `globalThis.pendingProgressImport=null; globalThis.previewToastMessages=[]; ` +
  `globalThis.previewImportCalls=0; globalThis.previewElement={style:{display:'none'},innerHTML:''}; ` +
  `globalThis.requireUnlockedParent=()=>true; ` +
  `globalThis.$=(id)=>id==='progress-import-preview'?previewElement:null; ` +
  `globalThis.toast=(message)=>previewToastMessages.push(message); ` +
  `globalThis.confirmProgressImport=()=>{previewImportCalls++;};`,
  context
);
{
  const payload = envelope(fixture());
  payload.familySync = null;
  const valid = context.validateImportedProgress(payload);
  assert.equal(valid.ok, true, valid.error);
  const originalState = JSON.stringify(fixture());
  context.state = JSON.parse(originalState);
  const fileName = 'test<backup>&".json';
  await context.prepareProgressImport({
    target:{ files:[{ name:fileName, size:256, text:async()=>JSON.stringify(payload) }] }
  });
  assert.equal(context.previewElement.style.display, 'block', 'valid export shows preview');
  assert.match(context.previewElement.innerHTML, /test&lt;backup&gt;&amp;&quot;\.json/, 'filename is HTML-escaped');
  assert.doesNotMatch(context.previewElement.innerHTML, /test<backup>|<backup>/, 'filename cannot inject markup');
  assert.match(context.previewElement.innerHTML,
    /Alex: Level 4 → 4, XP 500 → 500, coins 82 → 82, keys 1 → 1, streak 3 → 3/,
    'preview includes the expected sanitized child summary');
  assert.equal(context.previewToastMessages.length, 0, 'preview completes without a read/parse error');
  assert.ok(context.pendingProgressImport, 'validated import remains pending for confirmation');
  assert.equal(context.previewImportCalls, 0, 'preview rendering does not confirm/import');
  assert.equal(JSON.stringify(context.state), originalState, 'preview does not mutate current progress');
  assert.equal(context.escapeHtml(fileName), 'test&lt;backup&gt;&amp;&quot;.json');
  assert.equal(context.escapeHtml(`<'"&>`), '&lt;&#39;&quot;&amp;&gt;');
}
// The original malformed-JSON feedback remains intact and never opens a preview.
{
  context.pendingProgressImport = null;
  context.previewElement.style.display = 'none';
  context.previewElement.innerHTML = '';
  context.previewToastMessages.length = 0;
  await context.prepareProgressImport({
    target:{ files:[{ name:'malformed.json', size:20, text:async()=>'{not-json' }] }
  });
  assert.equal(context.previewElement.style.display, 'none');
  assert.equal(context.pendingProgressImport, null);
  assert.equal(context.previewToastMessages.length, 1);
  assert.equal(context.previewToastMessages[0], 'Could not read that JSON file.');
  assert.equal(context.previewImportCalls, 0);
}
assert.match(extractFunction('confirmProgressImport'), /Store\.writeAuxiliary\('smbt-state-v2-backup-before-import-'/);
assert.match(extractFunction('confirmProgressImport'), /Store\.set\(PRIMARY_STATE_KEY, imported, \{ allowRecovery:true, queueCloud:false \}\)/);

// Reviewed imports accept an older valid backup even when a fresh local profile
// has a newer timestamp. The real confirmation, Store, and unlinked Cloud
// scheduler are exercised with synthetic local-only state.
vm.runInContext(
  `const APP_VERSION='test';` +
  `${extractFunction('buildProgressExportEnvelope')}` +
  `${extractFunction('scheduleDebouncedPush')}` +
  `${extractFunction('confirmProgressImport')}` +
  `globalThis.buildProgressExportEnvelope=buildProgressExportEnvelope;` +
  `globalThis.scheduleDebouncedPush=scheduleDebouncedPush;` +
  `globalThis.confirmProgressImport=confirmProgressImport;`,
  context
);
{
  let timerCalls = 0;
  let pushCalls = 0;
  context.familyCode = null;
  context.applyingCloudState = false;
  context.debounceTimer = null;
  context.setTimeout = () => { timerCalls++; return 1; };
  context.clearTimeout = () => {};
  context.pushNow = () => { pushCalls++; };
  const toasts = [];
  const downloads = [];
  context.Cloud = {
    getFamilyCode:() => null,
    getLastSynced:() => null,
    scheduleDebouncedPush:context.scheduleDebouncedPush
  };
  context.requireUnlockedParent = () => true;
  context.toast = message => toasts.push(message);
  context.paint = () => {};
  context.renderParent = () => {};
  context.downloadJSONFile = (name, value) => {
    downloads.push({ name, value:JSON.parse(JSON.stringify(value)) });
    storageForImport.operations.push('download');
  };
  context.$ = () => null;

  function prepareImportHarness(failure = '') {
    const current = JSON.parse(JSON.stringify(context.api.FRESH));
    current.alex.updatedAt = 9999999999;
    current.katya.updatedAt = 9999999999;
    const initial = JSON.stringify(current);
    const storage = new MockStorage({ [PRIMARY]:initial });
    const store = createSafeStore(storage, { __storageUiReady:false }, () => context.Cloud);
    const loaded = store.get(PRIMARY, context.api.FRESH);
    assert.equal(loaded.status, 'ok');
    const before = JSON.stringify(loaded.value);
    context.state = JSON.parse(before);
    const progressed = fixture();
    progressed.alex.updatedAt = 1000;
    progressed.katya.updatedAt = 900;
    const validated = context.validateImportedProgress(envelope(progressed));
    assert.equal(validated.ok, true, validated.error);
    context.pendingProgressImport = {
      state:validated.state,
      familySync:null,
      sourceName:'synthetic-older-backup.json'
    };
    if (failure === 'backup') storage.failSet.add('smbt-state-v2-backup-before-import-*');
    if (failure === 'primary') storage.failSet.add(PRIMARY);
    storage.operations.length = 0;
    context.Store = store;
    const realSet = store.set.bind(store);
    store.set = (...args) => {
      assert.equal(JSON.stringify(context.state), before, 'in-memory state is unchanged while Store verifies the import');
      const result = realSet(...args);
      assert.equal(JSON.stringify(context.state), before, 'in-memory replacement waits until Store.set succeeds');
      return result;
    };
    return { storage, store, before, current };
  }

  let storageForImport;
  let harness = prepareImportHarness();
  storageForImport = harness.storage;
  await context.confirmProgressImport();
  assert.equal(context.state.alex.lvl, 4, 'older progressed Alex profile is imported');
  assert.equal(context.state.katya.lvl, 3, 'older progressed Katya profile is imported');
  assert.equal(context.state.alex.coins, 82);
  assert.equal(context.state.katya.coins, 55);
  assert.equal(context.state.mastery.alex.fractions.seen, 12);
  assert.deepEqual(JSON.parse(JSON.stringify(context.state.mathThinking)), fixture().mathThinking);
  assert.deepEqual(JSON.parse(JSON.stringify(context.state.evidence)), fixture().evidence);
  assert.equal(context.state.log[0].msg, 'Mission complete');
  assert.equal(context.pendingProgressImport, null, 'pending import clears only after verified save');
  assert.equal(downloads.length, 1, 'pre-import recovery copy is downloaded');
  assert.equal(downloads[0].value.state.alex.lvl, 1, 'downloaded backup contains the prior fresh state');
  const auxBackupKey = [...harness.storage.map.keys()].find(key => key.startsWith('smbt-state-v2-backup-before-import-'));
  assert.ok(auxBackupKey, 'automatic pre-import backup is written');
  assert.equal(JSON.parse(harness.storage.getItem(auxBackupKey)).state.katya.lvl, 1);
  const ops = harness.storage.operations;
  const auxiliaryWrite = ops.findIndex(item => item === `set:${auxBackupKey}`);
  const downloadIndex = ops.indexOf('download');
  const primaryWrite = ops.lastIndexOf(`set:${PRIMARY}`);
  assert.ok(auxiliaryWrite >= 0 && auxiliaryWrite < downloadIndex && downloadIndex < primaryWrite,
    'recovery backup and download both happen before the primary state replacement');
  assert.equal(timerCalls, 0, 'unlinked import does not schedule a cloud write');
  assert.equal(pushCalls, 0, 'unlinked import cannot push to Firebase');
  assert.equal(harness.storage.getItem(PRIMARY), JSON.stringify(context.state), 'verified imported state persists locally');

  toasts.length = 0;
  downloads.length = 0;
  harness = prepareImportHarness('backup');
  storageForImport = harness.storage;
  await context.confirmProgressImport();
  assert.equal(JSON.stringify(context.state), harness.before, 'backup failure preserves in-memory state');
  assert.equal(context.pendingProgressImport.sourceName, 'synthetic-older-backup.json');
  assert.equal(downloads.length, 0, 'failed backup stops before download');
  assert.equal(harness.storage.operations.some(item => item === `set:${PRIMARY}`), false,
    'failed backup stops before primary write');
  assert.match(toasts.at(-1), /safety backup could not be saved/i);

  toasts.length = 0;
  downloads.length = 0;
  harness = prepareImportHarness('primary');
  storageForImport = harness.storage;
  await context.confirmProgressImport();
  assert.equal(JSON.stringify(context.state), harness.before, 'failed Store write does not replace in-memory progress');
  assert.equal(context.pendingProgressImport.sourceName, 'synthetic-older-backup.json');
  assert.equal(downloads.length, 1, 'pre-import backup exists before the failed primary write');
  assert.equal(JSON.parse(harness.storage.getItem(PRIMARY)).alex.lvl, 1, 'failed write preserves old primary');
  assert.match(toasts.at(-1), /new progress could not be saved safely/i);

  toasts.length = 0;
  downloads.length = 0;
  harness = prepareImportHarness();
  storageForImport = harness.storage;
  context.pendingProgressImport.state.alex.coins = -1;
  await context.confirmProgressImport();
  assert.equal(JSON.stringify(context.state), harness.before, 'invalid reviewed data preserves current state');
  assert.equal(downloads.length, 0, 'invalid data aborts before backup/download');
  assert.equal(harness.storage.operations.some(item => item === `set:${PRIMARY}`), false);
  assert.match(toasts.at(-1), /no longer valid/i);
}
// Reset creates a final valid backup before removal; unsafe state cannot replace an existing good backup.
{
  const current = fixture();
  const storage = new MockStorage({ [PRIMARY]:JSON.stringify(current) });
  const { store } = makeStore(storage);
  store.get(PRIMARY, context.api.FRESH);
  assert.equal(store.resetPrimary(current).ok, true);
  assert.equal(storage.getItem(PRIMARY), null);
  assert.equal(JSON.parse(storage.getItem(BACKUP)).alex.totalXP, 500);
}
{
  const good = fixture();
  const storage = new MockStorage({ [PRIMARY]:'bad', [BACKUP]:JSON.stringify(good) });
  const { store } = makeStore(storage);
  const unsafe = fixture({ alex:null });
  assert.equal(store.resetPrimary(unsafe).ok, true);
  assert.equal(JSON.parse(storage.getItem(BACKUP)).alex.totalXP, 500);
}
const resetSource = extractFunction('doResetProgress');
assert.match(resetSource, /resetInProgress = true/);
assert.match(resetSource, /Store\.resetPrimary\(state\)/);
assert.match(resetSource, /Cloud\.unlinkForLocalReset\(\)/);
assert.match(resetSource, /Store\.set\(PRIMARY_STATE_KEY, state, \{ allowRecovery:true, queueCloud:false \}\)/);
assert.match(extractFunction('savePausedMission'), /resetInProgress/);
assert.match(extractFunction('unlinkForLocalReset'), /localStorage\.getItem\(FAMILY_CODE_KEY\)/);

// Cloud merge preserves child ownership, current merge policy, Math Thinking, requests, and remote unknown fields.
vm.runInContext(
  `${extractFunction('isFreshLikeProfile')}\n${extractFunction('hasChildProgress')}\n${extractFunction('mergeState')}\nglobalThis.mergeState=mergeState;`,
  context
);
{
  const local = fixture();
  local.localOnly = { preserved:true };
  local.alex.updatedAt = 5000;
  local.alex.totalXP = 700;
  local.katya.updatedAt = 100;
  local.katya.localKatyaOnly = 'retained';
  const remote = fixture({ remoteOnly:{ token:'kept' } });
  remote.alex.updatedAt = 100;
  remote.alex.totalXP = 100;
  remote.alex.remoteAlexOnly = 'retained';
  remote.katya.updatedAt = 6000;
  remote.katya.totalXP = 900;
  remote.katya.coins = 444;
  remote.requests = [{ id:'cloud-request', who:'katya' }];
  const merged = context.mergeState(local, remote);
  assert.equal(merged.alex.totalXP, 700, 'newer Alex stays Alex');
  assert.equal(merged.katya.totalXP, 900, 'newer Katya stays Katya');
  assert.equal(merged.alex.remoteAlexOnly, 'retained', 'non-conflicting remote Alex extension survives a local win');
  assert.equal(merged.katya.localKatyaOnly, 'retained', 'non-conflicting local Katya extension survives a cloud win');
  assert.equal(merged.katya.coins, 444);
  assert.equal(merged.remoteOnly.token, 'kept');
  assert.equal(merged.localOnly.preserved, true);
  assert.equal(merged.requests.some(r => r.id === 'cloud-request' && r.who === 'katya'), true);
  assert.equal(merged.requests.some(r => r.id === 'r1' && r.who === 'alex'), true);
  assert.ok(merged.mathThinking.alex.unlocked.includes('fractions.equal-pieces'));
}

// Source-level gates ensure Firebase paths cannot bypass verified local persistence.
assert.match(extractFunction('snapshotForCloud'), /if \(!Store\.cloudSafe\(\)\) return null/);
assert.match(extractFunction('pushNow'), /!Store\.cloudSafe\(\)/);
assert.match(extractFunction('scheduleDebouncedPush'), /!Store\.cloudSafe\(\)/);
assert.match(extractFunction('scheduleDebouncedPush'), /applyingCloudState/);
assert.match(extractFunction('applyMergedState'), /allowRecovery:true, queueCloud:false/);
assert.match(extractFunction('pullAndMergeNow'), /validatedCloudState\(docData\.state\)/);
assert.match(extractFunction('linkFamily'), /unsafe-local-state/);
assert.match(extractFunction('syncNow'), /if \(!await pullAndMergeNow\(\)\) return false/, 'a failed/invalid pull cannot be followed by a push');

// No direct progress-primary write remains outside the Store implementation.
const outsideStore = source.slice(storageEnd);
assert.doesNotMatch(outsideStore, /localStorage\.(?:setItem|removeItem)\(['"]smbt-state-v2['"]/, 'primary progress access must stay inside Store');

console.log('Integration Stage 2 persistence, recovery, import, reset, and cloud-gating checks passed');
