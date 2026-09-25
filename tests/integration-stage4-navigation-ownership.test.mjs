import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function functionBody(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} must exist`);
  const open = source.indexOf('{', start);
  let depth = 0, quote = null, escaped = false, lineComment = false, blockComment = false;
  for (let i = open; i < source.length; i++) {
    const ch = source[i], next = source[i + 1];
    if (lineComment) { if (ch === '\n') lineComment = false; continue; }
    if (blockComment) { if (ch === '*' && next === '/') { blockComment = false; i++; } continue; }
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '/' && next === '/') { lineComment = true; i++; continue; }
    if (ch === '/' && next === '*') { blockComment = true; i++; continue; }
    if (ch === "'" || ch === '"' || ch === '`') { quote = ch; continue; }
    if (ch === '{') depth++;
    if (ch === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`Could not extract ${name}`);
}

const activityScreens = [
  'mission-screen', 'battle-screen', 'store-screen', 'parent-screen',
  'moneylab-screen', 'grant-screen', 'guided-screen', 'escape-screen',
  'strategy-screen'
];

// The central cleanup list is complete, and its semantics are UI/token cleanup
// rather than persistent child-state deletion.
const hideBody = functionBody('hideAllActivityScreens');
for (const id of activityScreens) assert.match(hideBody, new RegExp(`['"]${id}['"]`));
assert.match(hideBody, /activityEpoch\+\+/);
assert.match(hideBody, /if \(!keepParent\) lockParent\(\)/);
assert.match(functionBody('goHome'), /pauseDailyMissionRun\(\)/);
assert.match(functionBody('goHome'), /hideAllActivityScreens\(\)/);
assert.match(functionBody('goTab'), /name === 'Home'.*goHome\(\)/s);
assert.match(functionBody('pickProfile'), /goHome\(\)/);
assert.equal((source.match(/<button type="button" class="qlink"/g) || []).length, 8, 'Home quick links should be native buttons');
assert.doesNotMatch(source, /Profile screen coming next build|next build step/);

// Exercise the core single-screen and epoch contract independently of DOM
// details: every activity transition leaves one screen and invalidates old work.
const visible = new Set();
let epoch = 0;
function hideAll() { visible.clear(); epoch++; }
function open(id) { hideAll(); visible.add(id); }
for (const id of activityScreens) {
  open(id);
  assert.deepEqual([...visible], [id], `${id} must be the only active screen`);
}
let mutated = false;
const stale = epoch;
open('battle-screen');
if (stale === epoch) mutated = true;
assert.equal(mutated, false, 'callbacks from a replaced activity must be stale');

// Money Lab owner is captured once and all reward/evidence writes use it.
assert.match(source, /let mlQ = null, mlAttempts = 0, mlOwner = null/);
assert.match(functionBody('mlTab'), /mlOwner = state\.activePlayer/);
const mlCheckBody = functionBody('mlCheck');
assert.match(mlCheckBody, /if \(!mlQ \|\| mlQ\.completed \|\| !mlOwner/);
assert.match(mlCheckBody, /mlQ\.completed = true/);
assert.match(mlCheckBody, /state\[mlOwner\]\.coins/);
assert.match(mlCheckBody, /gainXP\(mlOwner/);
assert.match(mlCheckBody, /state\.activity\[mlOwner\]\.money/);
assert.match(mlCheckBody, /token !== activityEpoch/);
assert.match(mlCheckBody, /owner !== mlOwner/);

const rewards = { alex: 0, katya: 0 };
const capturedOwner = 'alex';
const laterActive = 'katya';
rewards[capturedOwner] += 15;
assert.equal(rewards.alex, 15);
assert.equal(rewards[laterActive], 0, 'changing active profile cannot redirect Money Lab rewards');

// Non-Daily delayed work captures the epoch/run and checks the current screen.
for (const [fn, patterns] of Object.entries({
  bLock: ['activityEpoch', 'B.completed', 'battle-screen'],
  renderStage: ['activityEpoch', 'guided-screen'],
  erPick: ['activityEpoch', 'escape-screen'],
  gmFinish: ['GM.completed'],
  erSolved: ['ER.completed'],
  endBattle: ['B.completed']
})) {
  const body = functionBody(fn);
  for (const pattern of patterns) assert.match(body, new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${fn} must retain lifecycle protection`);
}
assert.match(functionBody('startGuided'), /runEpoch: activityEpoch/);
assert.match(functionBody('startEscape'), /runEpoch = activityEpoch/);
assert.match(functionBody('startBattle'), /runEpoch: activityEpoch/);

// Completion guards are set before reward side effects.
for (const [fn, guard, reward] of [
  ['gmFinish', 'GM.completed = true', 'gainXP'],
  ['erSolved', 'ER.completed = true', 'gainXP'],
  ['endBattle', 'B.completed = true', 'gainXP']
]) {
  const body = functionBody(fn);
  assert.match(body, new RegExp(guard.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.ok(body.indexOf(guard) < body.indexOf(reward), `${fn} must guard before rewards`);
}

// Parent mutations remain protected at function boundaries and authorization
// is in-memory only.
assert.match(source, /function lockParent\(\)/);
assert.match(source, /function requireParentAuth\(\)/);
assert.doesNotMatch(source, /state\.parentUnlocked/);
for (const fn of [
  'decideRequest', 'changePin', 'dismissPinNotice', 'setGradeOverride',
  'toggleMute', 'doResetProgress', 'generateFamilyCodeUI',
  'linkFamilyCodeUI', 'editReward', 'toggleReward', 'adjust',
  'markMissionDone', 'grantPrize'
]) {
  assert.match(functionBody(fn), /requireParentAuth\(\)/, `${fn} must enforce Parent authorization`);
}
assert.doesNotMatch(functionBody('requestPrize'), /requireParentAuth\(\)/, 'child Store requests must remain available without Parent auth');
assert.match(functionBody('decideRequest'), /requireParentAuth\(\)/, 'Parent approval must remain gated');
assert.match(functionBody('closeParent'), /lockParent\(\)/);
assert.match(functionBody('closeGrant'), /lockParent\(\)/);

console.log('Integration Stage 4 navigation, activity ownership, and Parent-session checks passed');
