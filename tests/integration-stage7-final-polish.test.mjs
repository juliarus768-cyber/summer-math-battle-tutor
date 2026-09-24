import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

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

const mathTrickFor = vm.runInNewContext(`(${functionBody('mathTrickFor')})`);
const trick = q => mathTrickFor({ ...q });

// Execute representative supported generators behaviorally. Choices are
// intentionally excluded before any matching, so a proactive trick cannot
// reveal an answer choice or operation selection.
assert.match(trick({ q: '2 × 7 = ?' }), /Double/);
assert.match(trick({ q: '35 ÷ 10 = ?' }), /shifts the digits one place right/);
assert.match(trick({ q: '25% of $80 = ?' }), /one quarter/);
assert.match(trick({ q: '1/2 of 20 = ?' }), /half/);
assert.match(trick({ q: 'A treat costs $13. How much change from $20?' }), /Count up/);
assert.match(trick({ q: 'A recipe uses 2 cups flour for 8 pancakes. How many cups for 16 pancakes?' }), /Scale both/);
assert.match(trick({ q: 'Solve for x: 3x + 4 = 19' }), /balanced/);
assert.match(trick({ q: 'A rectangle is 4 m by 7 m. What is its AREA?' }), /space inside/);
assert.match(trick({ q: 'A rectangle is 4 m by 7 m. What is its PERIMETER?' }), /distance around/);
assert.match(trick({ q: 'A triangle has angles 50° and 60°. What is the third angle?' }), /180/);
assert.match(trick({ q: 'A box is 2 m long, 3 m wide, 4 m tall. What is its VOLUME?' }), /space inside/);
assert.match(trick({ q: '3 × 4 + 5 ÷ 2 = ?' }), /left to right/);
assert.match(trick({ q: '18 + 29 = ?' }), /friendly/);

// Narrow matching and answer-safety checks.
for (const q of [
  { q: '2 × 7 = ?', choices: ['14', '16'] },
  { q: '50% of 80 = ?', choices: ['40', '50'] },
  { q: 'Which operation solves this word problem?', choices: ['+', '×'] },
  { q: 'What is 12 ÷ 3?', a: 4 },
  { q: 'A recipe uses 2 cups flour. How many cups for 16 pancakes?' },
  { q: 'What is 1/3 as a decimal?' }
]) assert.equal(trick(q), null, `unsafe or incomplete shape should not get a proactive trick: ${q.q}`);
assert.equal(trick({ q: 'A treat costs $25. How much change from $20?' }), null);
assert.equal(trick({ q: '2 × 7 = 14' }), null, 'a displayed answer must never get a trick');
assert.equal(trick({ q: 'What is 4 × 9?' }), null, 'unmatched wording remains reactive-only');

// The helper is pure and has no access to app state, rewards, evidence, or
// Brain Boost. A frozen question must remain untouched.
const frozen = Object.freeze({ q: '5 × 12 = ?', topic: 'multiplication', reinforcement: true });
const before = JSON.stringify(frozen);
assert.match(mathTrickFor(frozen), /10/);
assert.equal(JSON.stringify(frozen), before);
assert.doesNotMatch(functionBody('mathTrickFor'), /M\.|state\.|Store\.|recordAnswer|markStrategy|gainXP|coins|evidence|bbLevel/);

const nextQBody = functionBody('nextQ');
assert.match(nextQBody, /mathTrickFor\(M\.q\)/);
assert.match(nextQBody, /ms-trick/);
assert.match(nextQBody, /trick\.style\.display = trickText \? 'block' : 'none'/);
assert.match(nextQBody, /trick\.textContent = trickText/);
assert.match(nextQBody, /resetBrainBoost\('ms'\)/);
assert.doesNotMatch(nextQBody, /markStrategyViewed|markStrategyHelped|recordLearningEvent|Store\.set/);

// Parent PIN setup is first-run only, does not disclose a universal PIN, and
// the existing authorization/persistence protections remain in place.
assert.match(source, /function isValidParentPin\(pin\) \{ return typeof pin === 'string' && \/\^\\d\{4\}\$\//);
assert.match(source, /function setupParentPin\(\)/);
assert.match(functionBody('setupParentPin'), /if \(isValidParentPin\(state\.parentPin\)\) return/);
assert.match(functionBody('setupParentPin'), /const saved = Store\.set\('smbt-state-v2', state\)/);
assert.match(functionBody('setupParentPin'), /state\.parentPin = previous/);
assert.doesNotMatch(source, /Default PIN is <b>1234<\/b>/);
assert.doesNotMatch(source, /default PIN \(1234\)/i);
assert.doesNotMatch(source, /if \(!state\.parentPin\) state\.parentPin\s*=/);
assert.match(functionBody('checkPin'), /isValidParentPin\(state\.parentPin\)/);
assert.match(source, /let parentUnlocked = false/);
assert.doesNotMatch(source, /state\.parentUnlocked/);
assert.match(functionBody('requireParentAuth'), /parentUnlocked/);

const pinHarness = vm.createContext({ console });
vm.runInContext(`
  let parentUnlocked = false;
  const state = { parentPin: undefined, alex: { coins: 7 }, katya: { coins: 9 } };
  const elements = {
    'pin-new': { value: '' }, 'pin-confirm': { value: '' },
    'pin-err': { textContent: '' }, 'pin-gate': { style: {} },
    'parent-content': { style: {} }
  };
  const $ = id => elements[id];
  let writes = 0;
  const Store = { set() { writes++; return { ok: true }; } };
  function renderParent() {}
  ${functionBody('isValidParentPin')}
  ${functionBody('setupParentPin')}
`, pinHarness);
assert.equal(vm.runInContext('isValidParentPin("1234")', pinHarness), true);
assert.equal(vm.runInContext('isValidParentPin(1234)', pinHarness), false);
assert.equal(vm.runInContext('isValidParentPin("123")', pinHarness), false);
assert.equal(vm.runInContext('isValidParentPin("12a4")', pinHarness), false);
vm.runInContext("elements['pin-new'].value='2468'; elements['pin-confirm'].value='2468'; setupParentPin()", pinHarness);
assert.equal(vm.runInContext('state.parentPin', pinHarness), '2468');
assert.equal(vm.runInContext('parentUnlocked', pinHarness), true);
const writesAfterSetup = vm.runInContext('writes', pinHarness);
vm.runInContext("state.parentPin='9876'; elements['pin-new'].value='1111'; elements['pin-confirm'].value='1111'; setupParentPin()", pinHarness);
assert.equal(vm.runInContext('state.parentPin', pinHarness), '9876', 'stale setup call cannot replace a valid PIN');
assert.equal(vm.runInContext('writes', pinHarness), writesAfterSetup, 'stale setup call must not persist');
vm.runInContext("state.parentPin=undefined; parentUnlocked=false; Store.set=()=>({ok:false}); elements['pin-new'].value='1357'; elements['pin-confirm'].value='1357'; setupParentPin()", pinHarness);
assert.equal(vm.runInContext('state.parentPin', pinHarness), undefined, 'failed first-run setup rolls back the attempted PIN');
assert.equal(vm.runInContext('parentUnlocked', pinHarness), false, 'failed setup leaves Parent locked');
assert.equal(vm.runInContext('JSON.stringify({ alex: state.alex, katya: state.katya })', pinHarness), JSON.stringify({ alex: { coins: 7 }, katya: { coins: 9 } }), 'failed setup leaves child data unchanged');

// Historical child-facing activities are reachable through the existing
// native quick-link styling without changing their engines or ownership.
assert.match(source, /onclick="goTab\('Money Lab'\)"/);
assert.match(source, /onclick="goTab\('Equation Escape'\)"/);
assert.match(functionBody('goTab'), /name === 'Money Lab'.*openMoneyLab\(\)/s);
assert.match(functionBody('goTab'), /name === 'Equation Escape'.*openEscape\(\)/s);
assert.match(source, /\/img\/alex-hero\.jpg/);
assert.match(source, /\/img\/katya-hero\.jpg/);
assert.ok(fs.existsSync(path.join(root, 'public', 'img', 'alex-hero.jpg')));
assert.ok(fs.existsSync(path.join(root, 'public', 'img', 'katya-hero.jpg')));

assert.match(source, /30 adaptive questions across your grade-level math families/);
assert.doesNotMatch(source, /10 basic math|10 basic arithmetic|10 warm-ups/i);
assert.match(source, /MAX_REMEDIATION\s*=\s*6/);
assert.match(source, /MAX_MISSION_LEN\s*=\s*36/);

console.log('Integration Stage 7 final polish checks passed');
