import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function extractFunction(name) {
  const start = source.indexOf(`function ${name}(`);
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

const freshStart = source.indexOf('const FRESH = {');
const freshEnd = source.indexOf('\nfunction cloneFresh()', freshStart);
assert.ok(freshStart >= 0 && freshEnd > freshStart, 'actual FRESH defaults must be extractable');
const freshDeclaration = source.slice(freshStart, freshEnd);
const context = vm.createContext({ JSON, Number, Object, Array, Map, Set, Math });
vm.runInContext(
  `${freshDeclaration}\n${extractFunction('isFreshLikeProfile')}\n${extractFunction('hasChildProgress')}\n${extractFunction('mergeState')}\nglobalThis.api={FRESH,mergeState};`,
  context
);
const { FRESH, mergeState } = context.api;

function freshSnapshot(updatedAt = 0) {
  const state = JSON.parse(JSON.stringify(FRESH));
  for (const who of ['alex', 'katya']) {
    state[who].updatedAt = updatedAt;
    state[who].lastDay = '';
    state[who].gradeOverride = null;
  }
  state.activity = { alex:{ missions:0, battles:0, money:0 }, katya:{ missions:0, battles:0, money:0 } };
  state.daily = { alex:{ date:'', count:0 }, katya:{ date:'', count:0 } };
  state.mastery = { alex:{}, katya:{} };
  state.mathThinking = {
    version: 8,
    migratedAt: 'sanitized-fixture-metadata',
    alex: { unlocked:[], events:[], seen:{}, review:{}, topic:{}, errors:{}, updatedAt, strategyViews:0, usefulSelections:0, patternAttempts:0, patternUseful:0, hintsUsed:0 },
    katya: { unlocked:[], events:[], seen:{}, review:{}, topic:{}, errors:{}, updatedAt, strategyViews:0, usefulSelections:0, patternAttempts:0, patternUseful:0, hintsUsed:0 }
  };
  state.strategy = {
    alex:{ viewed:{}, helped:{}, badges:[] },
    katya:{ viewed:{}, helped:{}, badges:[] }
  };
  state.recentQ = { alex:[], katya:[] };
  state.evidence = { alex:[], katya:[] };
  state.pausedDaily = { alex:null, katya:null };
  state.moneyLabDaily = { alex:{ date:'', rewarded:0 }, katya:{ date:'', rewarded:0 } };
  state.goals = {};
  state.requests = [];
  state.rewards = [{ id:'default-prize', coins:10, enabled:true }];
  state.log = [];
  state.settings = { muted:false };
  return state;
}

function progressedSnapshot({ alex = true, katya = true, updatedAt = 1000 } = {}) {
  const state = freshSnapshot(updatedAt);
  for (const who of ['alex', 'katya']) {
    if (!(who === 'alex' ? alex : katya)) continue;
    Object.assign(state[who], who === 'alex'
      ? { lvl:24, xp:236, xpMax:2500, totalXP:15000, coins:1200, streak:4, keys:1, lastKeyMilestone:4, lastDay:'2026-09-20' }
      : { lvl:27, xp:101, xpMax:2800, totalXP:20000, coins:900, streak:1, keys:0, lastKeyMilestone:0, lastDay:'2026-09-20' });
    state.activity[who] = { missions:17, battles:3, money:5 };
    state.daily[who] = { date:'2026-09-20', count:2 };
    state.mastery[who] = { fractions:{ seen:20, correct:16, recent:[1,0,1] } };
    state.mathThinking[who] = {
      unlocked:['fractions.equal-pieces'], events:[{ t:900, questionKey:`${who}-q1`, correct:true }],
      seen:{ fractions:3 }, review:{ 'fractions.equal-pieces':{ stage:1, due:3000 } },
      topic:{ fractions:{ seen:3, correct:2, recent:[1,0,1] } }, errors:{}, updatedAt,
      strategyViews:2, usefulSelections:1, patternAttempts:0, patternUseful:0, hintsUsed:1
    };
    state.strategy[who] = { viewed:{ fractions:4 }, helped:{ fractions:2 }, badges:['fraction-helper'] };
    state.recentQ[who] = [{ q:`${who} past question`, topic:'fractions' }];
    state.evidence[who] = [{ at:900, outcome:'retry', topic:'fractions' }];
    state.pausedDaily[who] = { player:who, i:8, questions:[{ q:'sanitized paused question', a:12 }] };
    state.moneyLabDaily[who] = { date:'2026-09-20', rewarded:5 };
    state.goals[who] = 'default-prize';
  }
  state.log = [
    ...(alex ? [{ t:800, who:'alex', icon:'🎯', text:'Sanitized mission event' }] : []),
    ...(katya ? [{ t:810, who:'katya', icon:'⭐', text:'Sanitized reward event' }] : [])
  ];
  state.requests = [
    ...(alex ? [{ id:'sanitized-alex-request', who:'alex', status:'approved' }] : []),
    ...(katya ? [{ id:'sanitized-katya-request', who:'katya', status:'pending' }] : [])
  ];
  state.rewards = [{ id:'custom-prize', coins:75, enabled:true }];
  state.settings = { muted:true, sanitizedPreference:true };
  state.progressExtension = { retained:true };
  return state;
}

function assertProgressSnapshot(actual, expected, who) {
  for (const field of ['lvl', 'totalXP', 'xp', 'xpMax', 'coins', 'streak', 'keys']) {
    assert.equal(actual[who][field], expected[who][field], `${who}.${field} must come from the progressed snapshot`);
  }
  for (const field of ['activity', 'daily', 'mastery', 'strategy', 'evidence', 'recentQ', 'pausedDaily', 'moneyLabDaily', 'goals']) {
    assert.deepEqual(JSON.parse(JSON.stringify(actual[field][who])), JSON.parse(JSON.stringify(expected[field][who])), `${field}.${who} history must survive`);
  }
  assert.deepEqual(JSON.parse(JSON.stringify(actual.mathThinking[who].unlocked)), expected.mathThinking[who].unlocked, `${who} Math Thinking unlocks must survive`);
  assert.deepEqual(JSON.parse(JSON.stringify(actual.mathThinking[who].events)), expected.mathThinking[who].events, `${who} Math Thinking events must survive`);
  assert.deepEqual(JSON.parse(JSON.stringify(actual.mathThinking[who].review)), expected.mathThinking[who].review, `${who} Math Thinking review state must survive`);
  assert.deepEqual(JSON.parse(JSON.stringify(actual.mathThinking[who].topic.fractions.recent)), expected.mathThinking[who].topic.fractions.recent, `${who} Math Thinking topic evidence must survive`);
}

// A freshly initialized snapshot with later timestamps must not replace either
// progressed child's stats, histories, or family-level configuration.
for (const [local, cloud] of [
  [progressedSnapshot({ updatedAt:1000 }), freshSnapshot(9000)],
  [freshSnapshot(9000), progressedSnapshot({ updatedAt:1000 })]
]) {
  const progressed = local.alex.lvl > 1 ? local : cloud;
  const merged = mergeState(local, cloud);
  assertProgressSnapshot(merged, progressed, 'alex');
  assertProgressSnapshot(merged, progressed, 'katya');
  assert.equal(merged.log.length, 2, 'both child log events are retained');
  assert.equal(merged.requests.length, 2, 'request history is retained');
  assert.equal(merged.settings.sanitizedPreference, true, 'progressed-family settings survive a fresh snapshot');
  assert.equal(merged.rewards[0].id, 'custom-prize', 'custom reward configuration survives a fresh snapshot');
  assert.equal(merged.progressExtension.retained, true, 'unknown progressed top-level fields survive');
}

// Same event in both snapshots is kept once while distinct history is retained.
{
  const local = progressedSnapshot();
  const cloud = progressedSnapshot({ updatedAt:2000 });
  const duplicate = { t:900, who:'alex', icon:'🎯', text:'Same event' };
  local.log.push(duplicate);
  cloud.log.push({ ...duplicate });
  cloud.log.push({ t:2100, who:'katya', icon:'⭐', text:'Later event' });
  const merged = mergeState(local, cloud);
  assert.equal(merged.log.filter(row => row.text === 'Same event').length, 1, 'duplicate log events are removed');
  assert.ok(merged.log.some(row => row.text === 'Later event'), 'distinct log events remain');
}

// Alex and Katya choose their source independently; fresh defaults are child-specific.
{
  const local = progressedSnapshot({ alex:true, katya:false, updatedAt:1000 });
  const cloud = progressedSnapshot({ alex:false, katya:true, updatedAt:9000 });
  local.katya.coins = FRESH.katya.coins;
  local.katya.updatedAt = 1000;
  cloud.alex.coins = FRESH.alex.coins;
  cloud.alex.updatedAt = 9000;
  const merged = mergeState(local, cloud);
  assertProgressSnapshot(merged, local, 'alex');
  assertProgressSnapshot(merged, cloud, 'katya');
  assert.equal(merged.activity.alex.missions, 17);
  assert.equal(merged.activity.katya.missions, 17);
}

// Different fresh coin defaults and a newer timestamp do not count as progress.
{
  const local = freshSnapshot(1000);
  const cloud = freshSnapshot(9000);
  local.alex.lvl = 2;
  local.alex.totalXP = 101;
  local.alex.xp = 1;
  local.alex.xpMax = 200;
  local.alex.coins = 80;
  local.alex.updatedAt = 1000;
  local.settings = { muted:true, retainedByProgressedFamily:true };
  assert.equal(local.katya.coins, 110);
  assert.equal(cloud.katya.coins, 110);
  const merged = mergeState(local, cloud);
  assert.equal(merged.settings.retainedByProgressedFamily, true,
    'Katya’s distinct FRESH coin default does not falsely increase cloud progress rank');
}

// Newer genuinely progressed state keeps legitimate spending and key deductions.
{
  const older = progressedSnapshot({ updatedAt:1000 });
  const newer = progressedSnapshot({ updatedAt:2000 });
  older.alex.coins = 700;
  newer.alex.coins = 500;
  older.alex.keys = 3;
  newer.alex.keys = 2;
  const merged = mergeState(older, newer);
  assert.equal(merged.alex.coins, 500, 'newer progressed snapshot retains legitimate coin spending');
  assert.equal(merged.alex.keys, 2, 'newer progressed snapshot retains legitimate key spending');
}

// Unknown legacy metadata is not progress evidence and remains forward-compatible.
{
  const local = progressedSnapshot({ alex:true, katya:false, updatedAt:1000 });
  const cloud = freshSnapshot(9000);
  local.katya.coins = FRESH.katya.coins;
  local.katya.legacyMetadata = 'unknown legacy field';
  local.katya.updatedAt = 1000;
  cloud.katya.legacyMetadata = 'different cloud metadata';
  const merged = mergeState(local, cloud);
  assert.equal(merged.katya.coins, FRESH.katya.coins);
  assert.equal(merged.katya.updatedAt, 9000, 'fresh profile timestamp follows normal fresh/fresh conflict behavior');
  assert.equal(merged.katya.legacyMetadata, 'different cloud metadata');
}

// Linking and automatic sync retain Store-first, direct-read, and initial-pull guards.
const linkSource = extractFunction('linkFamily');
assert.ok(linkSource.indexOf('ref.get()') < linkSource.indexOf('applyMergedState(mergedState)'),
  'linking reads and merges the existing document before replacing local state');
assert.ok(linkSource.indexOf('applyMergedState(mergedState)') < linkSource.indexOf('ref.set('),
  'linking verifies local persistence before seeding or repairing cloud state');
assert.match(linkSource, /mergeState\(localState, cloudState\)/);
const pushSource = extractFunction('pushNow');
assert.match(pushSource, /!Store\.cloudSafe\(\)/);
assert.ok(pushSource.indexOf('await initialPullPromise') < pushSource.indexOf('snapshotForCloud()'));
assert.match(pushSource, /if \(!initialPullComplete\) return false/);
assert.match(extractFunction('syncNow'), /if \(!await pullAndMergeNow\(\)\) return false/);
assert.match(extractFunction('scheduleDebouncedPush'), /!Store\.cloudSafe\(\)/);
assert.match(extractFunction('boot'), /initialPullPromise = pullAndMergeNow\(\)/);

console.log('Integration Stage 8 Family Sync non-destructive merge checks passed');
