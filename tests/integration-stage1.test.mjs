import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = path.join(root, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// Parse every executable inline script exactly as JavaScript. This catches
// application-wide syntax errors that source-marker tests cannot detect.
const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
assert.ok(inlineScripts.length > 0, 'active inline application script should exist');
for (const match of inlineScripts) new vm.Script(match[1], { filename: 'index.inline.js' });

assert.ok(html.includes('<script type="module" src="/math-secrets.js"></script>'), 'Math Thinking module remains loaded');
assert.ok(html.includes('<script type="module" src="/math-parent-report.js"></script>'), 'parent report module remains loaded');
assert.ok(!html.includes('build __BUILD_ID__'), 'visible build placeholder is removed');
assert.ok(fs.existsSync(path.join(root, 'public', 'img', 'alex-hero.jpg')), 'Alex avatar asset remains');
assert.ok(fs.existsSync(path.join(root, 'public', 'img', 'katya-hero.jpg')), 'Katya avatar asset remains');

const normalizeStart = html.indexOf('function normalizeChoices(');
const normalizeEnd = html.indexOf('function genQuestion', normalizeStart);
assert.ok(normalizeStart >= 0 && normalizeEnd > normalizeStart, 'normalizeChoices helper should be present');
const normalizeSource = html.slice(normalizeStart, normalizeEnd);
const answerStart = html.indexOf('function parseStrictNumber(');
const answerEnd = html.indexOf('function submitQ', answerStart);
assert.ok(answerStart >= 0 && answerEnd > answerStart, 'strict numeric validation helper should be present');
const answerSource = html.slice(answerStart, answerEnd);
const helperCtx = {};
vm.runInNewContext(`${normalizeSource};${answerSource};globalThis.normalizeChoices=normalizeChoices;globalThis.answerOk=answerOk;`, helperCtx);
for (const value of ['11.5', '11,5', '$11.50', ' $ 11.50 ']) assert.equal(helperCtx.answerOk({ a: 11.5 }, value), true, `valid numeric input ${value}`);
for (const value of ['11garbage', '11/2', '11+5', '', 'Infinity', 'NaN']) assert.equal(helperCtx.answerOk({ a: 11 }, value), false, `invalid numeric input ${value}`);
assert.equal(helperCtx.answerOk({ a: 11 }, '11'), true);
assert.equal(helperCtx.answerOk({ a: 11 }, '11.01'), false);
assert.equal(helperCtx.answerOk({ a: "don't", choices: ["don't", 'do not'] }, "don't"), true);

const sourceStart = html.indexOf('const PERSONALIZATION = {');
const sourceEnd = html.indexOf('/* ============ BRAIN BOOST STRATEGY LIBRARY', sourceStart);
assert.ok(sourceStart >= 0 && sourceEnd > sourceStart, 'current-main generator section should be extractable');
const generatorSource = html.slice(sourceStart, sourceEnd);
const genCtx = { Math, console, globalThis: {} };
genCtx.R = (a, b) => Math.floor((a + b) / 2);
genCtx.RNZ = (a, b) => { const value = genCtx.R(a, b); return value === 0 ? a || 1 : value; };
genCtx.pick = values => values[0];
genCtx.shuffle = values => values.slice();
genCtx.gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return Math.abs(a) || 1; };
vm.runInNewContext(`${generatorSource};globalThis.BANK=BANK;globalThis.TOPIC_BANK=TOPIC_BANK;`, genCtx);
const banks = genCtx.globalThis;
assert.ok(banks.TOPIC_BANK.alex && banks.TOPIC_BANK.katya, 'Alex and Katya topic banks remain available');
let exercised = 0;
for (const who of ['alex', 'katya']) {
  for (const [topic, pool] of Object.entries(banks.TOPIC_BANK[who])) {
    assert.ok(Array.isArray(pool) && pool.length, `${who}/${topic} has generators`);
    for (const generator of pool) {
      for (let i = 0; i < 3; i++) {
        const item = generator(1);
        assert.ok(item && typeof item.q === 'string' && item.q.length > 0, `${who}/${topic} question text`);
        assert.ok(item.a !== undefined && item.a !== null, `${who}/${topic} answer exists`);
        if (typeof item.a === 'number') assert.ok(Number.isFinite(item.a), `${who}/${topic} finite answer`);
        if (item.choices) {
          const normalized = helperCtx.normalizeChoices({ ...item, choices: item.choices.slice() });
          assert.equal(new Set(normalized.choices).size, normalized.choices.length, `${who}/${topic} unique choices`);
          assert.equal(normalized.choices.filter(choice => choice === String(normalized.a)).length, 1, `${who}/${topic} exactly one correct choice`);
        }
        exercised++;
      }
    }
  }
}
assert.ok(exercised >= 100, `controlled generator sample should exercise many questions (got ${exercised})`);
console.log(`Integration Stage 1 checks passed (${exercised} generator questions exercised)`);
assert.ok((html.match(/parseStrictNumber\(/g) || []).length >= 4, 'all numeric answer paths use strict parsing');
assert.equal(html.includes('parseFloat'), false, 'permissive numeric parsing is absent from active answer paths');
assert.match(html, /button\.textContent = String\(choice\)/, 'choices use textContent');
assert.match(html, /button\.addEventListener\('click'/, 'choices use event listeners');
assert.equal(html.includes("M.q.choices.map(c => '<button"), false, 'unsafe inline choice interpolation is absent');
