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

// RC Hotfix 2: broader, still question-local reminders. The reminders name
// the method only; they must not calculate or reveal the live answer.
const decimalMixed = trick({ q: '5.9 + 5 = ?', topic: 'decimals' });
assert.match(decimalMixed, /5\.0/);
assert.match(decimalMixed, /decimal points/);
assert.doesNotMatch(decimalMixed, /10\.9/);
assert.match(trick({ q: '7 − 2.4 = ?', topic: 'decimals' }), /7\.0/);
assert.match(trick({ q: '3.6 + 1.27 = ?', topic: 'decimals' }), /Line up the decimal points/);
assert.match(trick({ q: '4.8 × 3 = ?', topic: 'decimals' }), /decimal places/);
assert.match(trick({ q: '4.8 ÷ 4 = ?', topic: 'decimals' }), /decimal point/);
assert.match(trick({ q: '23 × 6 = ?', topic: 'multiplication' }), /tens and ones/);
assert.match(trick({ q: '864 ÷ 8 = ?', topic: 'longdivision' }), /long-division loop/);
assert.match(trick({ q: '56 ÷ 8 = ?', topic: 'division' }), /times the divisor/);
assert.match(trick({ q: '-3 × 4 = ?', topic: 'integers' }), /signs/);
assert.match(trick({ q: 'Convert 1/4 to a decimal.', topic: 'fractions' }), /exact decimal/);
assert.equal(trick({ q: 'Convert 1/0 to a decimal.', topic: 'fractions' }), null, 'invalid fraction denominators remain reactive-only');
assert.match(trick({ q: '1/3 + 1/4 = ?', topic: 'fractions' }), /common denominator/);
assert.match(trick({ q: '3/4 × 2/5 = ?', topic: 'fractions' }), /Multiply numerators/);
assert.match(trick({ q: 'Convert 3/4 to a percent.', topic: 'fractions' }), /multiply by 100/);
assert.match(trick({ q: 'A $60 item is 20% off. What is the SALE price?', topic: 'percent' }), /discount amount/);
assert.match(trick({ q: 'A $60 item plus 13% tax. TOTAL cost?', topic: 'percent' }), /tax amount/);
assert.match(trick({ q: 'A car travels 180 km in 3 hours. Speed in km/h?', topic: 'ratios' }), /one hour/);
assert.match(trick({ q: 'A triangle has base 8 cm and height 5 cm. What is its AREA?', topic: 'geometry' }), /half/);
assert.match(trick({ q: 'A circle has radius 4 cm. What is its CIRCUMFERENCE? Use π ≈ 3.14, round to 1 decimal.', topic: 'geometry' }), /distance around/);
assert.match(trick({ q: '3 meters = how many centimeters?', topic: 'measurement' }), /multiplying by 100/);
assert.match(trick({ q: 'A chart shows 12 students chose soccer and 8 chose hockey. How many more chose the larger group?', topic: 'data' }), /Subtract the smaller/);
assert.match(trick({ q: 'A bag has 3 red and 2 blue marbles. What is the probability of drawing RED?', topic: 'probability' }), /favorable outcomes/);
assert.match(trick({ q: 'Pattern: 2, 5, 8, 11, ... What is number 5?', topic: 'patterns' }), /rule between terms/);
assert.match(trick({ q: 'Round 1,245 to the nearest 100.', topic: 'numbersense' }), /digit immediately/);
assert.match(trick({ q: '9 + ? = 16. What is the missing number?', topic: 'patterns' }), /opposite operation/);
assert.match(trick({ q: '7² = ?', topic: 'bedmas' }), /exponent/);
assert.equal(trick({ q: 'How many hits to defeat it? (round up)', topic: 'wordproblems' }), null);
assert.equal(trick({ q: '7² = ?', topic: 'geometry' }), null, 'topic metadata prevents a Grade 8-only trick crossing into another family');
for (const [q, answer] of [
  ['5.9 + 5 = ?', '10.9'],
  ['23 × 6 = ?', '138'],
  ['864 ÷ 8 = ?', '108'],
  ['A triangle has base 8 cm and height 5 cm. What is its AREA?', '20'],
  ['A car travels 180 km in 3 hours. Speed in km/h?', '60']
]) {
  const message = trick({ q });
  assert.equal(typeof message, 'string');
  assert.equal(message.includes(answer), false, `proactive trick must not reveal the live answer for ${q}`);
}

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

// Grade progression uses non-sensitive school-year anchors. Exact birth dates
// and unused family-profile metadata must not ship in the public client.
assert.match(source, /const GRADE_REFERENCE = \{ schoolYearStart: 2025, alex: 7, katya: 4 \}/);
assert.doesNotMatch(source, /\b(?:19|20)\d{2}-\d{2}-\d{2}\b/, 'public client source must not contain exact birth dates');
assert.doesNotMatch(source, /BIRTHDAYS|ageFromBirthday|\.birthday\b/);
assert.doesNotMatch(source, /const PERSONALIZATION\s*=/);
assert.match(source, /const FRIENDS = \['a friend', 'a teammate', 'a classmate'\]/);
const gradeHarness = vm.createContext({ Date, state:{ alex:{ gradeOverride:null }, katya:{ gradeOverride:null } } });
vm.runInContext(`
  const GRADE_ADVANCE_MONTH = 9;
  const GRADE_REFERENCE = { schoolYearStart: 2025, alex: 7, katya: 4 };
  ${functionBody('schoolYearStartFor')}
  ${functionBody('getCurrentGrade')}
  globalThis.gradeAt = (who, year, month, day) => getCurrentGrade(who, new Date(year, month, day));
`, gradeHarness);
assert.equal(vm.runInContext("gradeAt('alex', 2026, 7, 31)", gradeHarness), 7);
assert.equal(vm.runInContext("gradeAt('katya', 2026, 7, 31)", gradeHarness), 4);
assert.equal(vm.runInContext("gradeAt('alex', 2026, 8, 1)", gradeHarness), 8);
assert.equal(vm.runInContext("gradeAt('katya', 2026, 8, 1)", gradeHarness), 5);
assert.equal(vm.runInContext("gradeAt('alex', 2027, 8, 1)", gradeHarness), 9);
assert.equal(vm.runInContext("gradeAt('katya', 2027, 8, 1)", gradeHarness), 6);

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
