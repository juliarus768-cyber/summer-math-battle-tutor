import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('..', import.meta.url);
const src = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const body = src.match(/function mathTrickFor\(q\) \{[\s\S]*?\n\}/)?.[0];
if (!body) throw new Error('mathTrickFor missing');
if (/\b(?:M|state)\s*\.|record(?:Answer|LearningEvent)|award(?:XP|Coins?)/.test(body)) throw new Error('mathTrickFor must remain side-effect free');
const ctx = {};
vm.runInNewContext(`${body}; this.mathTrickFor = mathTrickFor;`, ctx);
const trick = ctx.mathTrickFor;

const positiveCases = [
  { q: '47 × 5 = ?', a: 235, expected: 'Multiply by 10, then take half.' },
  { q: '23 × 9 = ?', a: 207, expected: 'Multiply by 10, then subtract one group.' },
  { q: '8 × 25 = ?', a: 200, expected: 'Multiply by 100, then divide by 4.' },
  { q: '23 × 2 = ?', a: 46, expected: 'Double the other factor.' },
  { q: '5 × 47 = ?', a: 235, expected: 'Multiply by 10, then take half.' },
  { q: '7 × 10 = ?', a: 70, expected: 'Multiplying by 10 shifts the digits one place left.' },
  { q: '3 × 100 = ?', a: 300, expected: 'Multiplying by 100 shifts the digits two places left.' },
  { q: '2 × 1000 = ?', a: 2000, expected: 'Multiplying by 1000 shifts the digits three places left.' },
  { q: '120 ÷ 2 = ?', a: 60, expected: 'Divide by 2: find half.' },
  { q: '1230 ÷ 10 = ?', a: 123, expected: 'Dividing by 10 shifts the digits one place right.' },
  { q: '1200 ÷ 100 = ?', a: 12, expected: 'Dividing by 100 shifts the digits two places right.' },
  { q: '12000 ÷ 1000 = ?', a: 12, expected: 'Dividing by 1000 shifts the digits three places right.' },
  { q: '1% of 300 = ?', a: 3, expected: 'For 1%, divide the number by 100.' },
  { q: '5% of 80 = ?', a: 4, expected: 'For 5%, find 10% first, then take half.' },
  { q: '10% of 80 = ?', a: 8, expected: 'For 10%, divide the number by 10.' },
  { q: '15% of 80 = ?', a: 12, expected: 'For 15%, add 10% and 5% together.' },
  { q: '20% of $80 = ?', a: 16, expected: 'For 20%, find 10% first, then double it.' },
  { q: '25% of 80 = ?', a: 20, expected: '25% means one quarter — divide by 4.' },
  { q: '50% of $80 = ?', a: 40, expected: '50% means half — divide by 2.' },
  { q: '75% of 80 = ?', a: 60, expected: '75% = half plus one quarter.' },
  { q: '1/2 of 80 = ?', a: 40, expected: '1/2 means half — divide by 2.' },
  { q: '1/4 of 80 = ?', a: 20, expected: '1/4 means one quarter — divide by 4.' },
  { q: '3/5 of 100 = ?', a: 60, expected: 'Divide by the denominator, then multiply by the numerator.' },
  { q: 'A treat costs $7. How much change from $20?', a: 13, expected: 'Count up from the price to $20.' },
  { q: '98 + 47 = ?', a: 145, expected: 'Make a friendly ten or hundred, then compensate.' },
  { q: 'A recipe uses 2 cups flour for 4 pancakes. How many cups for 8 pancakes?', a: 4, expected: 'Scale both quantities by the same factor.' },
  { q: 'Solve for x:   3x + 4 = 19', a: 5, expected: 'Keep both sides balanced while you undo operations to isolate x.' },
  { q: 'A rectangle is 6 m by 4 m. What is its AREA?', a: 24, expected: 'Area measures the space inside a shape.' },
  { q: 'A rectangle is 6 m by 4 m. What is its PERIMETER?', a: 20, expected: 'Perimeter means the distance around the outside.' },
  { q: 'A square has side length 5 cm. What is its PERIMETER in centimetres?', a: 20, expected: 'Perimeter means the distance around the outside.' },
  { q: 'A triangle has angles 60° and 70°. What is the third angle?', a: 50, expected: 'The angles in a triangle total 180°.' },
  { q: 'A box is 3 m long, 2 m wide, 4 m tall. What is its VOLUME?', a: 24, expected: 'Volume measures the space inside a 3-D shape.' },
  { q: '2 + 3 × 4 = ?', a: 14, expected: 'Do brackets first, then × and ÷ left to right, then + and − left to right.' },
  { q: '(2 + 3) × 4 = ?', a: 20, expected: 'Do brackets first, then × and ÷ left to right, then + and − left to right.' },
  { q: '20 ÷ 2 × 3 = ?', a: 30, expected: 'Evaluate × and ÷ left to right.' },
  { q: '20 − 2 + 3 = ?', a: 21, expected: 'Evaluate + and − left to right.' },
];

for (const { q, a, expected } of positiveCases) {
  const question = { q, a };
  const before = JSON.stringify(question);
  const out = trick(question);
  if (out !== expected) throw new Error(`unexpected trick for ${q}: ${out}`);
  if (!out || /undefined|NaN|Infinity/.test(out)) throw new Error(`malformed trick for ${q}`);
  if (out.includes(String(a))) throw new Error(`trick leaks live answer for ${q}`);
  if (JSON.stringify(question) !== before) throw new Error(`trick mutated question data for ${q}`);
}

for (const q of [
  { q: '56 ÷ 8 = ?', a: 7 },
  { q: '47 × -5 = ?', a: -235 },
  { q: '-47 × -5 = ?', a: 235 },
  { q: '1,234 ÷ 7 = ?', a: 176 },
  { q: 'A rectangle has base 6 cm and height 4 cm. What is its AREA?', a: 12 },
  { q: 'A circle has radius 4 cm. What is its CIRCUMFERENCE?', a: 25.1 },
  { q: 'Solve for x: x² = 25', a: 5 },
  { q: '30% of 80 = ?', a: 24 },
  { q: 'A $100 item is 25% off. What is the SALE price?', a: 75 },
  { q: 'A treat costs $25. How much change from $20?', a: 5 },
  { q: 'A question mentions change from $20?', a: 4 },
  { q: 'A recipe uses 2 cups flour for 0 pancakes. How many cups for 8 pancakes?', a: 16 },
  { q: 'Solve for x: 0x + 4 = 19', a: 5 },
  { q: 'Solve for x: 0(x + 4) = 19', a: 5 },
  { q: 'A triangle has angles 100° and 90°. What is the third angle?', a: -10 },
  { q: '1/3 = ?', a: 0.333 },
  { q: 'Which fraction is equivalent to 1/2?', choices: ['1/2', '2/4', '3/4'], a: '2/4' },
  { q: '47 × 5 = ?', options: ['235', '240', '250'], a: '235' },
  { q: '47 × 5 = ?', choices: ['235', '240', '250'], a: '235' },
  { q: 'A class has 5 cats and 7 dogs. What is the probability of cats?', choices: ['5/12', '1/2', '7/12'], a: '5/12' },
  { q: 'Three boxes hold 4 clues each. How many clues?', a: 12 },
  { q: '3 × 4 = ?', a: 12 },
  { q: '3 + 4 = ?', a: 7 },
  { q: '2++3 = ?', a: 5 },
  { q: '2 ×× 3 = ?', a: 6 },
]) if (trick(q) !== null) throw new Error(`inappropriate trick for ${q.q}`);

if (!fs.existsSync(new URL('../public/img/alex-hero.jpg', import.meta.url)) || !fs.existsSync(new URL('../public/img/katya-hero.jpg', import.meta.url))) throw new Error('profile assets missing');
for (const path of ['/img/alex-hero.jpg', '/img/katya-hero.jpg']) if (!src.includes(`src="${path}"`)) throw new Error(`missing active asset reference ${path}`);
if (!src.includes('id="ms-trick"') || !src.includes('mathTrickFor(M.q)')) throw new Error('Daily Mission trick rendering missing');
if (!src.includes("M.bbLevel > 0")) throw new Error('Brain Boost path changed');
console.log(`Phase 18 proactive trick and avatar regression checks passed (${positiveCases.length} behavioral trick cases)`);
