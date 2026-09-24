import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.match(source, /const ALEX_TOPICS = \['bedmas','fractions','decimals','percent','integers','longdivision'/);
assert.match(source, /const KATYA_TOPICS = \['numbersense','multiplication','division','longdivision'/);
assert.equal(source.includes("const KATYA_TOPICS = ['multiplication','division','longdivision','fractions','decimals','money','time','measurement','patterns','wordproblems','reading','grammar','french']"), false, 'language-only topics are not in Katya math rotation');
assert.match(source, /function missionChoices\(correct, distractors\)/);
assert.match(source, /function buildTopicSequence\(who, count\)/);

let seed = 0x6d2b79f5;
const math = {
  abs: Math.abs, ceil: Math.ceil, floor: Math.floor, max: Math.max, min: Math.min,
  round: Math.round, pow: Math.pow, PI: Math.PI,
  random() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0x100000000; }
};
const state = {
  mastery: { alex:{}, katya:{} },
  recentQ: { alex:[], katya:[] },
  strategy: {
    alex:{ viewed:{}, helped:{}, badges:[] },
    katya:{ viewed:{}, helped:{}, badges:[] }
  },
  daily: { alex:{ date:'', count:0 }, katya:{ date:'', count:0 } },
  log: []
};
const context = vm.createContext({
  Math: math, console, state,
  window: { MathThinkingSystem: null },
  FRIENDS: ['a friend', 'a teammate', 'a classmate'],
  globalThis: {}
});
const generatorsStart = source.indexOf('const R = ');
const generatorsEnd = source.indexOf('/* ============ HELPERS: dates, confetti, hints', generatorsStart);
assert.ok(generatorsStart >= 0 && generatorsEnd > generatorsStart, 'curriculum engine should be extractable');
const generatorCode = source.slice(generatorsStart, generatorsEnd) + `
globalThis.stage6 = {
  ALEX_TOPICS, KATYA_TOPICS, TOPIC_BANK, genQuestion, generateDailyMission,
  coachingKeyFor, questionOperation
};`;
vm.runInContext(generatorCode, context, { filename:'stage6-curriculum.inline.js' });
const api = context.globalThis.stage6;

const expectedTopics = {
  alex: ['bedmas','fractions','decimals','percent','integers','longdivision','ratios','algebra','geometry','probability','data','money','logic','wordproblems'],
  katya: ['numbersense','multiplication','division','longdivision','fractions','decimals','patterns','data','probability','geometry','measurement','money','wordproblems']
};
assert.deepEqual(Array.from(api.ALEX_TOPICS), expectedTopics.alex);
assert.deepEqual(Array.from(api.KATYA_TOPICS), expectedTopics.katya);

function assertCleanText(q, who, topic) {
  assert.equal(q.who, who, `${who}/${topic} ownership metadata`);
  assert.equal(q.topic, topic, `${who}/${topic} topic metadata`);
  assert.match(String(q.q), /\S/, `${who}/${topic} question text`);
  assert.equal(/undefined|NaN|Infinity/.test(`${q.q} ${q.a}`), false, `${who}/${topic} has no malformed values`);
  assert.notEqual(q.a, undefined, `${who}/${topic} answer exists`);
  if (typeof q.a === 'number') assert.ok(Number.isFinite(q.a), `${who}/${topic} answer is finite`);
  if (q.choices) {
    const choices = q.choices.map(String);
    assert.equal(new Set(choices).size, choices.length, `${who}/${topic} choices are unique`);
    assert.equal(choices.filter(choice => choice === String(q.a)).length, 1, `${who}/${topic} has exactly one correct choice`);
  }
  assert.equal(typeof api.coachingKeyFor(q), 'string', `${who}/${topic} has coaching metadata`);
}

function fractionValue(text) {
  const match = String(text).match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
  assert.ok(match && Number(match[2]) !== 0, `valid fraction answer: ${text}`);
  return Number(match[1]) / Number(match[2]);
}

function checkQuestionMath(q, topic) {
  const text = String(q.q);
  if (topic === 'bedmas') {
    const square = text.match(/^(\d+)²/);
    const bracketed = text.match(/^\((\d+) \+ (\d+)\) × (\d+)/);
    const doubleProduct = text.match(/^(\d+) × (\d+) \+ (\d+) × (\d+)/);
    const subtractProduct = text.match(/^(\d+) − (\d+) × (\d+)/);
    const addProduct = text.match(/^(\d+) \+ (\d+) × (\d+)/);
    if (square) assert.equal(Number(q.a), Number(square[1]) ** 2, 'square expression is correct');
    else if (bracketed) assert.equal(Number(q.a), (Number(bracketed[1]) + Number(bracketed[2])) * Number(bracketed[3]), 'bracketed BEDMAS expression is correct');
    else if (doubleProduct) assert.equal(Number(q.a), Number(doubleProduct[1]) * Number(doubleProduct[2]) + Number(doubleProduct[3]) * Number(doubleProduct[4]), 'two-product BEDMAS expression is correct');
    else if (subtractProduct) assert.equal(Number(q.a), Number(subtractProduct[1]) - Number(subtractProduct[2]) * Number(subtractProduct[3]), 'subtraction BEDMAS expression is correct');
    else if (addProduct) assert.equal(Number(q.a), Number(addProduct[1]) + Number(addProduct[2]) * Number(addProduct[3]), 'addition BEDMAS expression is correct');
  }
  if (topic === 'longdivision') {
    const shown = text.match(/(\d+)\s*÷\s*(\d+)/);
    assert.ok(shown, 'long division displays dividend and divisor');
    const dividend = Number(shown[1]), divisor = Number(shown[2]);
    const answer = String(q.a).match(/^(\d+)\s+r\s+(\d+)$/);
    if (answer) {
      const quotient = Number(answer[1]), remainder = Number(answer[2]);
      assert.equal(dividend, divisor * quotient + remainder, 'long division identity holds');
      assert.ok(remainder >= 0 && remainder < divisor, 'long division remainder is in range');
    } else {
      assert.ok(Number.isFinite(Number(q.a)), 'exact long division answer is numeric');
      assert.equal(dividend, divisor * Number(q.a), 'exact long division identity holds');
    }
  }
  if (topic === 'fractions') {
    const of = text.match(/(\d+)\/(\d+) of (\d+)/);
    if (of) assert.equal(Number(q.a), Number(of[1]) * Number(of[3]) / Number(of[2]), 'fraction of quantity is correct');
    const conversion = text.match(/(?:equals|rounded to the nearest hundredth)\s*$/i) ? text.match(/(\d+)\/(\d+)/) : null;
    if (conversion) {
      const exact = Number(conversion[1]) / Number(conversion[2]);
      if (/rounded/i.test(text)) assert.ok(Math.abs(Number(q.a) - Math.round(exact * 100) / 100) < 1e-9, 'rounded fraction conversion is correct');
      else assert.equal(Number(q.a), exact, 'terminating fraction conversion is exact');
    }
    const compare = text.match(/Which fraction is greater:\s*(\d+)\/(\d+) or (\d+)\/(\d+)/i);
    if (compare) {
      const left = Number(compare[1]) / Number(compare[2]);
      const right = Number(compare[3]) / Number(compare[4]);
      assert.equal(String(q.a), left > right ? `${compare[1]}/${compare[2]}` : `${compare[3]}/${compare[4]}`, 'fraction comparison answer is correct');
    }
    const mixed = text.match(/Write (\d+) (\d+)\/(\d+) as an improper fraction/);
    if (mixed) assert.equal(fractionValue(q.a), Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]), 'mixed fraction conversion is correct');
    const operation = text.match(/^(\d+)\/(\d+) ([+−]) (\d+)\/(\d+) = \?/);
    if (operation) {
      const left = Number(operation[1]) / Number(operation[2]);
      const right = Number(operation[4]) / Number(operation[5]);
      assert.ok(Math.abs(fractionValue(q.a) - (operation[3] === '+' ? left + right : left - right)) < 1e-9, 'fraction operation answer is correct');
    }
  }
  if (topic === 'fractions') {
    const percent = text.match(/^Convert (\d+)\/(\d+) to a percent/);
    if (percent) assert.equal(Number(q.a), Number(percent[1]) / Number(percent[2]) * 100, 'fraction-percent conversion is correct');
  }
  if (topic === 'percent') {
    const of = text.match(/(\d+)% of \$(\d+)/);
    if (of) assert.equal(Number(q.a), Number(of[1]) * Number(of[2]) / 100, 'percent-of answer is correct');
    const off = text.match(/A \$(\d+) item is (\d+)% off/i);
    if (off) assert.equal(Number(q.a), Number(off[1]) * (1 - Number(off[2]) / 100), 'sale price is correct');
  }
  if (topic === 'ratios') {
    const recipe = text.match(/uses (\d+) cups flour for (\d+) pancakes\. How many cups for (\d+) pancakes/);
    if (recipe) assert.equal(Number(q.a), Number(recipe[1]) * Number(recipe[3]) / Number(recipe[2]), 'recipe scaling preserves ratio');
    const rate = text.match(/travels (\d+) km in (\d+) hours/);
    if (rate) assert.equal(Number(q.a), Number(rate[1]) / Number(rate[2]), 'rate answer is correct');
  }
  if (topic === 'algebra') {
    const linear = text.match(/Solve for x:\s+(\d+)x\s*([+−])\s*(\d+)\s*=\s*(-?\d+)/);
    const plain = text.match(/Solve for x:\s+(\d+)x\s*=\s*(-?\d+)/);
    const bracket = text.match(/Solve for x:\s+(\d+)\(x \+ (\d+)\)\s*=\s*(-?\d+)/);
    if (linear) {
      const m=Number(linear[1]), c=Number(linear[3]), rhs=Number(linear[4]);
      assert.equal(Number(q.a), linear[2] === '+' ? (rhs-c)/m : (rhs+c)/m, 'linear equation answer satisfies equation');
    } else if (plain) assert.equal(Number(q.a), Number(plain[2]) / Number(plain[1]), 'one-step equation answer satisfies equation');
    else if (bracket) assert.equal(Number(q.a), Number(bracket[3]) / Number(bracket[1]) - Number(bracket[2]), 'bracket equation answer satisfies equation');
  }
  if (topic === 'geometry') {
    const rectArea = text.match(/rectangle is (\d+) m by (\d+) m\. What is its AREA/i);
    if (rectArea) assert.equal(Number(q.a), Number(rectArea[1]) * Number(rectArea[2]), 'rectangle area is correct');
    const perimeter = text.match(/rectangle is (\d+) m by (\d+) m\. What is its PERIMETER/i);
    if (perimeter) assert.equal(Number(q.a), 2 * (Number(perimeter[1]) + Number(perimeter[2])), 'rectangle perimeter is correct');
    const volume = text.match(/box is (\d+) m long, (\d+) m wide, (\d+) m tall/i);
    if (volume) assert.equal(Number(q.a), Number(volume[1]) * Number(volume[2]) * Number(volume[3]), 'box volume is correct');
    const angle = text.match(/triangle has angles (\d+)° and (\d+)°/i);
    if (angle) assert.equal(Number(q.a), 180 - Number(angle[1]) - Number(angle[2]), 'triangle angle total is correct');
  }
  if (topic === 'data' && q.data) {
    const values = Object.values(q.data).filter(value => typeof value === 'number');
    if (/How many votes were recorded|How many votes altogether/i.test(text)) assert.equal(Number(q.a), values.reduce((sum, value) => sum + value, 0), 'data total matches values');
    if (/How many more/i.test(text)) assert.equal(Number(q.a), Math.abs(values[0] - values[1]), 'data difference matches values');
  }
  if (topic === 'probability') {
    const marble = text.match(/(\d+) red and (\d+) blue/);
    const spinner = text.match(/(\d+) green and (\d+) yellow/);
    if (marble) assert.ok(Math.abs(fractionValue(q.a) - Number(marble[1]) / (Number(marble[1]) + Number(marble[2]))) < 1e-9, 'marble probability is correct');
    if (spinner) assert.ok(Math.abs(fractionValue(q.a) - Number(spinner[1]) / (Number(spinner[1]) + Number(spinner[2]))) < 1e-9, 'spinner probability is correct');
  }
}

let exercised = 0;
for (const who of ['alex','katya']) {
  for (const topic of expectedTopics[who]) {
    assert.ok(api.TOPIC_BANK[who][topic]?.length, `${who}/${topic} generator pool exists`);
    for (let i = 0; i < 20; i++) {
      const question = api.genQuestion(who, topic, (i % 3) + 1);
      assertCleanText(question, who, topic);
      checkQuestionMath(question, topic);
      exercised++;
    }
  }
}
assert.ok(exercised >= 500, `at least 250 questions per child were exercised (got ${exercised})`);

const missionCounts = { alex:30, katya:30 };
const missionPlans = {
  alex: { integers:4, bedmas:3, fractions:4, decimals:2, percent:1, ratios:3, algebra:4, geometry:3, data:2, probability:1, money:2, wordproblems:1 },
  katya: { numbersense:4, multiplication:4, division:2, longdivision:2, fractions:4, decimals:3, patterns:2, data:1, probability:1, geometry:2, measurement:1, money:2, wordproblems:2 }
};
for (const who of ['alex','katya']) {
  for (let run = 0; run < 30; run++) {
    const mission = api.generateDailyMission(who);
    assert.equal(mission.length, missionCounts[who], `${who} base mission length remains exact`);
    assert.equal(mission.filter(q => q.basic).length, 0, `${who} planned base mission has no repeated arithmetic warm-up block`);
    const counts = Object.fromEntries(Object.keys(missionPlans[who]).map(topic => [topic, 0]));
    for (const question of mission) {
      assert.equal(question.who, who, `${who} mission ownership metadata`);
      assert.ok(Object.hasOwn(missionPlans[who], question.topic), `${who} mission topic is in the reviewed plan`);
      counts[question.topic]++;
    }
    assert.deepEqual(counts, missionPlans[who], `${who} mission follows the reviewed broad family composition`);
  }
}

// Same-topic remediation remains available for every active family without
// changing the Stage 5 reward/evidence paths.
const queueStart = source.indexOf('function queueReinforcement(');
const queueEnd = source.indexOf('/* ============ ACTIVE MISSION FLOW', queueStart);
assert.ok(queueStart >= 0 && queueEnd > queueStart, 'remediation helper should remain present');
const queueContext = vm.createContext({
  Math, String, Set, R: () => 2,
  topicDifficulty: () => 1,
  genQuestion: () => ({ q:'unused', a:0, topic:'fractions' }),
  M: { player:'katya', remediationQueued:0, questions:Array.from({length:30}, (_, i) => ({ q:`base-${i}`, a:i, topic:'fractions' })), q:{ genIdx:0, a:2, topic:'fractions' } }
});
vm.runInContext(`const MAX_REMEDIATION=6, MAX_MISSION_LEN=36; let next=0; function similarQuestion(){ next++; return {q:'rem-'+next,a:100+next,topic:'fractions'}; } ${source.slice(queueStart, queueEnd)} globalThis.runQueue=queueReinforcement;`, queueContext);
assert.equal(queueContext.runQueue('fractions'), 2, 'same-topic remediation can still append safely');
assert.ok(queueContext.M.questions.slice(30).every(q => q.reinforcement && q.topic === 'fractions'));
assert.equal(queueContext.M.remediationQueued, 2);
queueContext.M.questions = Array.from({length:36}, (_, i) => ({ q:`full-${i}`, a:i, topic:'fractions' }));
queueContext.M.remediationQueued = 6;
assert.equal(queueContext.runQueue('fractions'), 0, 'the 36-question total cap prevents further remediation');

// Lifecycle completion remains based on the actual mission array length, so
// both 30-question base missions and 31-36-question remediated missions can
// finish without a hard-coded legacy length.
assert.match(source, /const MAX_REMEDIATION = 6, MAX_MISSION_LEN = 36/);
assert.match(source, /if \(M\.i >= M\.questions\.length\) return showResult\(\);/);
assert.match(source, /const total = M\.questions\.length;/);

console.log(`Integration Stage 6 curriculum checks passed (${exercised} generated questions exercised)`);
