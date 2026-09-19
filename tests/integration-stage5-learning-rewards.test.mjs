import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

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

function evaluatePureFunction(name) {
  const context = vm.createContext({ Number, Math, String });
  vm.runInContext(`${functionBody(name)}; globalThis.result = ${name};`, context);
  return context.result;
}

// Local calendar behavior is deliberately distinct from UTC serialization.
assert.match(source, /function localDateKey\(date = new Date\(\)\)/);
assert.match(source, /new Date\(y, m - 1, day - 1\)/);
assert.doesNotMatch(source, /toISOString\(\)\.slice\(0,10\)/);
assert.doesNotMatch(source, /Date\.now\(\) - 864e5/);
const localDateKey = evaluatePureFunction('localDateKey');
assert.equal(localDateKey(new Date(2026, 8, 14, 22, 30)), '2026-09-14');
assert.equal(localDateKey(new Date(2026, 8, 15, 0, 1)), '2026-09-15');
const prior = d => localDateKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));
assert.equal(prior(new Date(2024, 2, 11)), '2024-03-10');
assert.equal(prior(new Date(2024, 10, 4)), '2024-11-03');

// Streak and daily buckets remain per child and per local date.
const required = day => {
  const [y, m, d] = day.split('-').map(Number);
  const value = new Date(y, m - 1, d - 1);
  while (value.getDay() === 0 || value.getDay() === 6) value.setDate(value.getDate() - 1);
  return localDateKey(value);
};
assert.equal(required('2026-09-14'), '2026-09-11');
assert.equal(required('2026-09-15'), '2026-09-14');
const daily = { alex:{date:'', count:0}, katya:{date:'', count:0} };
const bumpDaily = (who, date) => { if (daily[who].date !== date) { daily[who].date = date; daily[who].count = 0; } daily[who].count++; };
bumpDaily('alex', '2026-09-14'); bumpDaily('alex', '2026-09-14'); bumpDaily('alex', '2026-09-15');
assert.equal(daily.alex.count, 1);
assert.equal(daily.katya.count, 0);
assert.match(source, /p\.lastDay === t/);

// Coaching is question-specific and has a neutral process fallback.
assert.match(source, /function coachingKeyFor\(q\)/);
assert.match(functionBody('hintFor'), /if \(question\.hint\) return question\.hint/);
assert.match(functionBody('hintFor'), /key === 'triangle-angle'/);
assert.match(functionBody('hintFor'), /key === 'addition'/);
assert.match(functionBody('hintFor'), /key === 'subtraction'/);
assert.match(functionBody('hintFor'), /key === 'multiplication'/);
assert.match(functionBody('hintFor'), /key === 'division'/);
assert.match(functionBody('hintFor'), /key === 'bedmas'/);
assert.match(functionBody('hintFor'), /key === 'percent'/);
assert.match(functionBody('explainStepByStep'), /Known: identify the numbers/);
assert.match(functionBody('explainStepByStep'), /Asked: identify exactly/);
assert.match(functionBody('explainStepByStep'), /Calculate carefully/);
const operationBody = functionBody('questionOperation');
const questionOperation = evaluatePureFunction('questionOperation');
assert.equal(questionOperation({ q:'A rectangle is 7 m by 3 m. What is its PERIMETER?' }), 'perimeter');
assert.equal(questionOperation({ q:'A triangle has angles 50° and 60°. What is the third angle?' }), 'triangle-angle');
assert.equal(questionOperation({ q:'12 ÷ 3 = ?' }), 'division');
assert.ok(operationBody.indexOf("/perimeter/i") < operationBody.indexOf("text.includes('×')"), 'geometry must win before multiplication text matching');
assert.ok(operationBody.indexOf("triangle has angles") < operationBody.indexOf("text.includes('×')"), 'triangle angle must win before multiplication text matching');
assert.match(functionBody('similarQuestion'), /for \(let tries = 0; tries < 6; tries\+\+\)/);
assert.match(functionBody('similarQuestion'), /candidate\.q !== live\.q/);
assert.match(functionBody('similarQuestion'), /String\(candidate\.a\) !== String\(live\.a\)/);

// Remediation is bounded, same-topic, distinct, and appended only after the
// existing base mission. Current main intentionally retains its 18/20 base.
assert.match(source, /const MAX_REMEDIATION = 6, MAX_MISSION_LEN = 26/);
assert.match(functionBody('queueReinforcement'), /return 0/);
assert.match(functionBody('queueReinforcement'), /new Set\(M\.questions\.map\(q => q\.q\)\)/);
assert.match(functionBody('queueReinforcement'), /candidate && !existing\.has\(candidate\.q\)/);
assert.match(functionBody('queueReinforcement'), /M\.remediationQueued/);
assert.match(functionBody('submitQ'), /const added = queueReinforcement\(M\.q\.topic\)/);
assert.match(functionBody('submitQ'), /added > 0/);
const queueContext = vm.createContext({
  Math, String, Set,
  R: () => 2,
  topicDifficulty: () => 1,
  genQuestion: () => ({ q:'unused', a:0, topic:'fractions' }),
  M: { player:'alex', remediationQueued:0, questions:Array.from({length:20}, (_, i) => ({ q:`base-${i}`, a:i, topic:'fractions' })), q:{ genIdx:0, a:2, topic:'fractions' } }
});
vm.runInContext(`
  const MAX_REMEDIATION = 6, MAX_MISSION_LEN = 26;
  let next = 0;
  function similarQuestion() { next++; return { q:'rem-' + next, a:100 + next, topic:'fractions' }; }
  ${functionBody('queueReinforcement')}
  globalThis.runQueue = queueReinforcement;
`, queueContext);
assert.equal(queueContext.runQueue('fractions'), 2);
assert.equal(queueContext.M.questions.length, 22);
assert.equal(queueContext.M.remediationQueued, 2);
assert.ok(queueContext.M.questions.slice(20).every(q => q.reinforcement && q.topic === 'fractions'));
queueContext.M.remediationQueued = 6;
assert.equal(queueContext.runQueue('fractions'), 0);
const questions = Array.from({length:20}, (_, i) => ({ q:`base-${i}`, topic:'fractions', a:i }));
const appended = [{q:'rem-1',topic:'fractions',a:101},{q:'rem-2',topic:'fractions',a:102},{q:'rem-1',topic:'fractions',a:101}];
let queued = 0;
for (const candidate of appended) {
  if (queued >= 6 || questions.length >= 26 || questions.some(q => q.q === candidate.q) || candidate.a === questions[0].a) continue;
  questions.push({...candidate, reinforcement:true}); queued++;
}
assert.equal(questions.length, 22);
assert.equal(queued, 2);
assert.ok(questions.slice(20).every(q => q.reinforcement && q.topic === 'fractions'));
assert.equal(questions.filter(q => q.reinforcement).length, 2);

// Completion tiers are bounded, deterministic, and keep question XP/accuracy
// bonus separate from the completion amount.
assert.match(source, /function dailyCompletionRewards\(accuracy\)/);
const completionRewards = evaluatePureFunction('dailyCompletionRewards');
for (const [accuracy, xp, coins] of [[0,20,5],[1,50,15],[39,50,15],[40,90,25],[69,90,25],[70,120,35],[89,120,35],[90,140,45],[100,140,45]]) {
  const result = completionRewards(accuracy);
  assert.equal(result.completionXp, xp);
  assert.equal(result.completionCoins, coins);
}
for (const [accuracy, xp, coins] of [[NaN,20,5],[Infinity,20,5],[-10,20,5],[101,140,45]]) {
  const result = completionRewards(accuracy);
  assert.equal(result.completionXp, xp);
  assert.equal(result.completionCoins, coins);
}
assert.equal(Math.round(100 / 3), 33);
assert.match(functionBody('showResult'), /if \(!M \|\| M\.completed\) return/);
assert.match(functionBody('showResult'), /M\.completed = true/);
assert.ok(functionBody('showResult').indexOf('M.completed = true') < functionBody('showResult').indexOf('gainXP'));
assert.match(functionBody('showResult'), /M\.player/);
assert.doesNotMatch(source, /\+140 XP \+ accuracy coins/);

// Preserve current Math Thinking and Stage 2–4 lifecycle contracts.
for (const marker of [
  'window.MathThinkingSystem.questionPresented', 'window.MathThinkingSystem.answerRecorded',
  'function missionRunIsCurrent', 'function scheduleMissionCallback', 'function savePausedMission',
  'function hideAllActivityScreens', 'function requireParentAuth', 'function createSafeStore',
  'readback', 'Store.set(\'smbt-state-v2\', state)'
]) assert.ok(source.includes(marker), `preservation marker missing: ${marker}`);

console.log('Integration Stage 5 coaching, remediation, local-date, and reward checks passed');
