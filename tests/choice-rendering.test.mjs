import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

assert.match(source, /document\.createElement\('button'\)/);
assert.match(source, /button\.textContent = choice/);
assert.match(source, /button\.addEventListener\('click', \(\) => chooseMissionAnswer\(choice\)\)/);
assert.doesNotMatch(source, /onclick=\"chooseMissionAnswer/);

const values = ["don't", "Let's go to the park.", "s'il vous plaît", 'é', '3/4', '0.5', '42'];
assert.deepEqual(values, ["don't", "Let's go to the park.", "s'il vous plaît", 'é', '3/4', '0.5', '42']);
console.log('choice-rendering regression checks passed');

assert.match(source, /function parseAnswerNumber\(raw, currency=false\)/);
assert.match(source, /missionChoices\(correct/);
assert.match(source, /rounded to the nearest hundredth/);

const parseAnswerNumber = (raw, currency = false) => {
  let value = String(raw ?? '').trim();
  if (currency && value.startsWith('$')) value = value.slice(1).trim();
  if (!/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(value)) return null;
  const number = Number(value.replace(',', '.'));
  return Number.isFinite(number) ? number : null;
};
assert.equal(parseAnswerNumber('11'), 11);
assert.equal(parseAnswerNumber('11.5'), 11.5);
assert.equal(parseAnswerNumber('11,5'), 11.5);
assert.equal(parseAnswerNumber('$12.50', true), 12.5);
for (const invalid of ['11garbage', '11/2', '11+5']) assert.equal(parseAnswerNumber(invalid), null);

assert.equal((1 / 3).toFixed(2), '0.33');
assert.equal((2 / 3).toFixed(2), '0.67');
for (const [n, d] of [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [1, 10], [3, 10], [7, 10], [1, 20], [3, 20]]) {
  assert.equal(Number.isInteger((n / d) * 100), true, `${n}/${d} should terminate to hundredths`);
}
const uniqueChoices = (values) => [...new Set(values.map(String))];
const probabilityChoices = (correct, candidates) => uniqueChoices([correct, ...candidates]).concat(['0/1', '1/3', '2/3']).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3);
const equalCountChoices = probabilityChoices('1/2', ['1/2', '1']);
assert.equal(new Set(equalCountChoices).size, 3);
assert.equal(equalCountChoices.filter((v) => v === '1/2').length, 1);
console.log('mathematical validation regression checks passed');
