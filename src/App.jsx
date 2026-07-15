import { useMemo, useState } from 'react';
import Particles from './components/Particles';

const STORAGE_KEY = 'summerMathBattleTutorStateV2';
const todayKey = () => new Date().toISOString().slice(0, 10);
const tabs = ['Home', 'Daily Mission', 'Battle', 'Store', 'Grant Prize', 'Parent'];
const missionNames = ['Speed Round', 'Logic Battle', 'Money Lab', 'Mystery Case', 'Boss Battle', 'Streak Saver'];
const alexQuestNames = ['🚀 Speed Run', '🥷 Ninja Precision', '💰 Money Boss', '🎯 Accuracy Trial', '🏆 Champion Quest', '🔥 Streak Protector'];
const katyaQuestNames = ['🗝 Secret Code Breaker', '🔍 Mystery File', '💄 Sephora Shopping Mystery', '📺 Portal Investigation', '🎮 Roblox Signal', '🌙 Midnight Puzzle'];

const normalizeMissionName = (missionName = '') => {
  if (missionName.includes('Speed') || missionName.includes('Speed Run') || missionName.includes('Secret Code')) return 'Speed Round';
  if (missionName.includes('Logic') || missionName.includes('Ninja') || missionName.includes('Mystery File')) return 'Logic Battle';
  if (missionName.includes('Money') || missionName.includes('Sephora')) return 'Money Lab';
  if (missionName.includes('Mystery') || missionName.includes('Portal') || missionName.includes('Accuracy')) return 'Mystery Case';
  if (missionName.includes('Boss') || missionName.includes('Champion') || missionName.includes('Roblox')) return 'Boss Battle';
  if (missionName.includes('Streak') || missionName.includes('Midnight')) return 'Streak Saver';
  return missionName;
};

const missionTheme = (child, missionName = '', index = 0) => {
  const key = normalizeMissionName(missionName || missionNames[index] || 'Speed Round');
  const idx = Math.max(0, missionNames.indexOf(key));
  if (child === 'alex') {
    const titles = alexQuestNames;
    const stories = [
      'Alex enters a battle-pass speed run where every clean answer keeps the combo alive.',
      'Shadow Ninja training: check the step before striking so the combo does not break.',
      'A gaming setup budget is under attack by impulse buys. Protect the coins.',
      'Arena accuracy trial: one careful shot beats five rushed misses.',
      'Champion quest: unlock the next rank with strategy, not panic clicking.',
      'Streak shield online. Defend the daily run and keep the fire alive.'
    ];
    return { title: titles[idx] || titles[0], icon: ['🚀','🥷','💰','🎯','🏆','🔥'][idx] || '⚔', story: stories[idx] || stories[0], objective: 'Clear 5 tactical challenges to earn rank XP, coins, and progress toward rewards.', skill: ['Speed combo recall','Precision strategy','Money boss budgeting','Accuracy control','Champion reasoning','Streak defense'][idx] || 'Battle prep' };
  }
  const titles = katyaQuestNames;
  const stories = [
    'Leila found a locked clue box and needs Katya to decode the number key.',
    'Arina sent a mystery file with glowing clues that only a lead investigator can solve.',
    'A Sephora and bubble tea shopping clue trail needs smart coin choices.',
    'Emily found portal coordinates on a walkie talkie. Decode them before the fog moves.',
    'A Roblox signal is scrambled inside the arcade lights. Restore the code.',
    'Tolik the elf left a November clue near Grandma Olga’s accounting notes.'
  ];
  return { title: titles[idx] || titles[0], icon: ['🗝','🔍','💄','📺','🎮','🌙'][idx] || '🔦', story: stories[idx] || stories[0], objective: 'Solve 5 clues to collect XP, coins, and mystery progress.', skill: ['Secret code fluency','Clue pattern logic','Shopping choices','Portal coordinate decoding','Roblox signal decoding','Midnight clue focus'][idx] || 'Mystery solving' };
};

const safeClone = (v) => JSON.parse(JSON.stringify(v));
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const DAILY_QUESTION_TOTAL = 30;

const rewards = [
  ['🎮', 'Small digital reward', 90, 'Common'], ['🎵', 'Pick music in the car', 140, 'Common'], ['🍫', 'Chocolate or small treat', 220, 'Rare'],
  ['🧋', 'Bubble tea', 360, 'Rare'], ['☕', 'Starbucks card', 850, 'Epic'], ['🎲', 'Roblox card', 950, 'Epic'],
  ['🎮', 'PlayStation card', 1200, 'Legendary'], ['🍎', 'Apple gift card', 1300, 'Legendary'], ['🍽️', 'Restaurant with mom', 1500, 'Mythic'],
  ['🍔', 'Restaurant with dad', 1500, 'Mythic'], ['🚚', 'DoorDash delivery', 1800, 'Ultra'], ['📱', 'Device day with no classes', 2200, 'Ultra']
];

const legacyRewards = [
  ['🍫', 'Chocolate', 40, 'Common'], ['🎵', 'Pick music in the car', 55, 'Common'], ['🧋', 'Bubble tea', 80, 'Rare'],
  ['🍜', 'Pick takeout', 120, 'Rare'], ['🚚', 'DoorDash delivery', 140, 'Epic'], ['🍽️', 'Restaurant with mom', 180, 'Epic'],
  ['🍔', 'Restaurant with dad', 180, 'Epic'], ['🎬', 'Movie', 220, 'Legendary'], ['🧗', 'Rock climbing', 260, 'Legendary'],
  ['☕', 'Starbucks card', 300, 'Mythic'], ['🍎', 'Apple gift card', 450, 'Mythic'], ['🎮', 'PlayStation card', 500, 'Ultra'], ['📱', 'Device day with no classes', 650, 'Ultra']
];

const missionQuestionSets = {
  katya: [
    { q: '8 + 2 = ?', a: 10, hint: 'Count 2 more after 8.', skill: 'Basic addition', inputMode: 'numeric', category: 'basic-arithmetic' },
    { q: '3 + 7 = ?', a: 10, hint: 'Count 7 more after 3.', skill: 'Basic addition', inputMode: 'numeric', category: 'basic-arithmetic' },
    { q: '14 - 6 = ?', a: 8, hint: 'Count back 6 from 14.', skill: 'Basic subtraction', inputMode: 'numeric', category: 'basic-arithmetic' },
    { q: '20 - 9 = ?', a: 11, hint: 'Subtract 10, then add 1.', skill: 'Basic subtraction', inputMode: 'numeric', category: 'basic-arithmetic' },
    { q: '4 x 3 = ?', a: 12, hint: 'Think 4 groups of 3.', skill: 'Basic multiplication', inputMode: 'numeric', category: 'basic-arithmetic' },
    { q: '5 x 6 = ?', a: 30, hint: 'Skip-count by 5 six times.', skill: 'Basic multiplication', inputMode: 'numeric', category: 'basic-arithmetic' },
    { q: '7 x 4 = ?', a: 28, hint: 'Think 7 + 7 + 7 + 7.', skill: 'Basic multiplication', inputMode: 'numeric', category: 'basic-arithmetic' },
    { q: '18 / 3 = ?', a: 6, hint: '3 times what equals 18?', skill: 'Basic division', inputMode: 'numeric', category: 'basic-arithmetic' },
    { q: '24 / 6 = ?', a: 4, hint: '6 times what equals 24?', skill: 'Basic division', inputMode: 'numeric', category: 'basic-arithmetic' },
    { q: '35 / 5 = ?', a: 7, hint: '5 times what equals 35?', skill: 'Basic division', inputMode: 'numeric', category: 'basic-arithmetic' },
    { q: '6 x 7 = ?', a: 42, hint: 'Think 6 groups of 7.', skill: 'Multiplication facts', inputMode: 'numeric' },
    { q: '56 / 8 = ?', a: 7, hint: 'Ask: 8 times what makes 56?', skill: 'Division facts', inputMode: 'numeric' },
    { q: '84 / 4 = ?', a: 21, hint: 'Split 80, then split 4.', skill: 'Long division basics', inputMode: 'numeric' },
    { q: '23 x 14 = ?', a: 322, hint: '23 x 10 plus 23 x 4.', skill: 'Multi-digit multiplication', inputMode: 'numeric' },
    { q: 'What is 1/4 of 20?', a: 5, hint: 'Divide 20 into 4 equal parts.', skill: 'Fractions basics', inputMode: 'numeric' },
    { q: 'Which is equal to 1/2?', type: 'choice', options: ['0.25', '0.5', '0.75'], a: '0.5', hint: 'Half is two equal parts.', skill: 'Decimals introduction' },
    { q: 'Katya has $12.50 and spends $3.25. How much is left?', a: 9.25, hint: 'Subtract dollars and cents carefully.', skill: 'Money math', inputMode: 'decimal' },
    { q: 'Pattern: 4, 8, 12, 16, __', a: 20, hint: 'The pattern adds 4 each time.', skill: 'Patterns', inputMode: 'numeric' },
    { q: 'A rectangle has 4 sides. How many sides do 3 rectangles have?', a: 12, hint: '3 groups of 4 sides.', skill: 'Geometry basics', inputMode: 'numeric' },
    { q: 'How many centimeters are in 1 meter?', a: 100, hint: '1 meter equals 100 centimeters.', skill: 'Measurement', inputMode: 'numeric' },
    { q: '9 x 8 = ?', a: 72, hint: 'Try 10 x 8, then subtract 8.', skill: 'Multiplication facts', inputMode: 'numeric' },
    { q: '63 / 9 = ?', a: 7, hint: '9 times what makes 63?', skill: 'Division facts', inputMode: 'numeric' },
    { q: '126 / 3 = ?', a: 42, hint: 'Split 120 and 6 into 3 groups.', skill: 'Long division basics', inputMode: 'numeric' },
    { q: '34 x 12 = ?', a: 408, hint: '34 x 10 plus 34 x 2.', skill: 'Multi-digit multiplication', inputMode: 'numeric' },
    { q: 'Which fraction means 3 out of 4 equal parts?', type: 'choice', options: ['1/4', '3/4', '4/3'], a: '3/4', hint: 'The top number counts the parts you have.', skill: 'Fractions basics' },
    { q: 'Write four and six tenths as a decimal.', a: 4.6, hint: 'Tenths go one place after the decimal.', skill: 'Decimals introduction', inputMode: 'decimal' },
    { q: 'A toy costs $7. Katya buys 3. What is the total cost?', a: 21, hint: 'Cost each times number bought.', skill: 'Word problems', inputMode: 'numeric' },
    { q: 'A square has side length 5 cm. What is its perimeter?', a: 20, hint: 'Add all 4 equal sides.', skill: 'Geometry basics', inputMode: 'numeric' },
    { q: '2 liters = how many milliliters?', a: 2000, hint: '1 liter is 1000 milliliters.', skill: 'Measurement', inputMode: 'numeric' },
    { q: 'Katya has $20. She saves $6 and earns $4 more. How much money now?', a: 30, hint: 'Start with 20, add 6, add 4.', skill: 'Money math', inputMode: 'numeric' }
  ],
  alex: [
    { q: '8 + 2 = ?', a: 10, hint: 'Count 2 more after 8.', skill: 'Basic addition', inputMode: 'numeric', category: 'basic-arithmetic' },
    { q: '3 + 7 = ?', a: 10, hint: 'Count 7 more after 3.', skill: 'Basic addition', inputMode: 'numeric', category: 'basic-arithmetic' },
    { q: '16 - 7 = ?', a: 9, hint: 'Count back 7 from 16.', skill: 'Basic subtraction', inputMode: 'numeric', category: 'basic-arithmetic' },
    { q: '25 - 8 = ?', a: 17, hint: 'Subtract 10, then add 2.', skill: 'Basic subtraction', inputMode: 'numeric', category: 'basic-arithmetic' },
    { q: '6 x 4 = ?', a: 24, hint: 'Think 6 groups of 4.', skill: 'Basic multiplication', inputMode: 'numeric', category: 'basic-arithmetic' },
    { q: '7 x 5 = ?', a: 35, hint: 'Skip-count by 5 seven times.', skill: 'Basic multiplication', inputMode: 'numeric', category: 'basic-arithmetic' },
    { q: '8 x 3 = ?', a: 24, hint: 'Think 8 + 8 + 8.', skill: 'Basic multiplication', inputMode: 'numeric', category: 'basic-arithmetic' },
    { q: '21 / 3 = ?', a: 7, hint: '3 times what equals 21?', skill: 'Basic division', inputMode: 'numeric', category: 'basic-arithmetic' },
    { q: '32 / 4 = ?', a: 8, hint: '4 times what equals 32?', skill: 'Basic division', inputMode: 'numeric', category: 'basic-arithmetic' },
    { q: '45 / 5 = ?', a: 9, hint: '5 times what equals 45?', skill: 'Basic division', inputMode: 'numeric', category: 'basic-arithmetic' },
    { q: '3/4 + 1/8 = ?', type: 'choice', options: ['5/8', '7/8', '4/12'], a: '7/8', hint: 'Change 3/4 to 6/8 first.', skill: 'Fractions' },
    { q: '7.2 / 0.6 = ?', a: 12, hint: 'Think 72 divided by 6.', skill: 'Decimals', inputMode: 'decimal' },
    { q: 'What is 15% of 80?', a: 12, hint: '10% is 8 and 5% is 4.', skill: 'Percentages', inputMode: 'numeric' },
    { q: 'A recipe uses 2 cups flour for 5 pancakes. How many cups for 20 pancakes?', a: 8, hint: '20 is 4 times 5, so multiply cups by 4.', skill: 'Ratios and rates', inputMode: 'numeric' },
    { q: '-6 + 14 = ?', a: 8, hint: 'Move 14 steps right from -6.', skill: 'Integers', inputMode: 'numeric' },
    { q: 'If x + 7 = 19, what is x?', a: 12, hint: 'Undo plus 7 by subtracting 7.', skill: 'Equations', inputMode: 'numeric' },
    { q: '3 + 4 x 5 = ?', a: 23, hint: 'Multiply before adding.', skill: 'BEDMAS', inputMode: 'numeric' },
    { q: 'A triangle has angles 50 and 60 degrees. What is the third angle?', a: 70, hint: 'Triangle angles total 180 degrees.', skill: 'Geometry', inputMode: 'numeric' },
    { q: 'Area of a rectangle 9 cm by 6 cm?', a: 54, hint: 'Area equals length times width.', skill: 'Area', inputMode: 'numeric' },
    { q: 'Volume of a box 4 x 3 x 5?', a: 60, hint: 'Multiply length, width, and height.', skill: 'Volume', inputMode: 'numeric' },
    { q: 'A bag has 3 red and 2 blue marbles. Probability of red?', type: 'choice', options: ['2/5', '3/5', '3/2'], a: '3/5', hint: 'Red marbles over total marbles.', skill: 'Probability' },
    { q: 'A $48 hoodie is 25% off. What is the sale price?', a: 36, hint: '25% of 48 is 12, then subtract.', skill: 'Money math', inputMode: 'decimal' },
    { q: 'Solve: 2x = 18.', a: 9, hint: 'Divide both sides by 2.', skill: 'Algebra basics', inputMode: 'numeric' },
    { q: '(-4) x (-7) = ?', a: 28, hint: 'Negative times negative is positive.', skill: 'Integers', inputMode: 'numeric' },
    { q: '0.45 + 1.8 = ?', a: 2.25, hint: 'Line up the decimal points.', skill: 'Decimals', inputMode: 'decimal' },
    { q: 'Simplify the ratio 12:18.', type: 'choice', options: ['2:3', '3:2', '6:9'], a: '2:3', hint: 'Divide both numbers by 6.', skill: 'Ratios and rates' },
    { q: '5^2 + 3^2 = ?', a: 34, hint: '5 squared is 25 and 3 squared is 9.', skill: 'BEDMAS', inputMode: 'numeric' },
    { q: 'A car travels 180 km in 3 hours. Speed in km/h?', a: 60, hint: 'Speed equals distance divided by time.', skill: 'Rates', inputMode: 'numeric' },
    { q: 'A game card costs $25 plus 13% tax. Total cost?', a: 28.25, hint: '13% of 25 is 3.25.', skill: 'Financial math', inputMode: 'decimal' },
    { q: 'Speed check: 12 x 15 = ?', a: 180, hint: '12 x 10 plus 12 x 5.', skill: 'Speed and accuracy', inputMode: 'numeric' }
  ]
};

const getDailyQuestions = (childKey) => safeClone(missionQuestionSets[childKey] || []);
const missionTotal = (childKey) => missionQuestionSets[childKey]?.length || DAILY_QUESTION_TOTAL;

const makeChild = (name, grade, level, xp, xpMax, coins, focus, bonus) => ({
  name, gradeLevel: grade, level, xp, xpMax, coins, streak: 10,
  minutesToday: 0, missionsCompletedToday: 0, weakSkills: [], completedMissions: [], mistakesCorrected: 0,
  accuracy: 0, currentFocus: focus, badgesEarned: [], rewardsRequested: [], dailyHistory: [], weakFacts: [],
  statsToday: { xpEarned: 0, coinsEarned: 0, correct: 0, attempts: 0, strongestSkill: 'Warmup' }, bonus
});

const defaultState = {
  activeTab: 'Home', selectedChild: 'alex', weekendMode: false, notifications: 2, banner: 'Summer Math Battle Tutor Loaded',
  battleScore: { alex: 0, katya: 0 }, grant: { lastClaimDate: '', message: '' },
  ui: { message: '', levelUp: '', rewardMessage: '' },
  activeMission: null, // {child, missionId, questions, index, input, feedback, localCorrect, localAttempts, localCorrections, secondTry}
  rewardRequests: [],
  practice: { child: 'alex', mode: 'Multiplication', questions: [], index: 0, score: 0, mistakes: [] },
  moneyLab: { idx: 0, answer: '', feedback: '', done: [] },
  importText: '',
  children: {
    alex: makeChild('Alex', 'Age 12 • Grade 8 Prep', 7, 320, 500, 180, 'Shadow Ninja rank prep', 'Check Before Submit'),
    katya: makeChild('Katya', 'Age 10 • Mystery Path', 4, 250, 400, 150, 'Lead Investigator clue training', 'Clue Finder')
  },
  missions: { alex: [], katya: [] }
};

function genQuestion(child, missionName) {
  const missionKey = normalizeMissionName(missionName);
  if (child === 'alex') {
    if (missionKey === 'Speed Round') {
      const a = rand(2, 12), b = rand(2, 12);
      if (Math.random() < 0.5) return { q: `Fortnite speed run: ${a} squads each collect ${b} coins. Total coins?`, a: a * b, hint: `Use ${a} groups of ${b}.`, skill: 'Speed combo recall' };
      return { q: `Valorant loadout split: ${a * b} credits shared across ${a} buys. Credits each?`, a: b, hint: `Think: ${a} × ? = ${a * b}`, skill: 'Speed combo recall' };
    }
    if (missionKey === 'Logic Battle') {
      const a = rand(2, 8), b = rand(2, 5), c = rand(1, 9); return { q: `Shadow Ninja combo: bonus ${c} + ${a} power hits × ${b}. Final score?`, a: c + a * b, hint: 'Combo hits count before the bonus.', skill: 'Precision strategy' };
    }
    if (missionKey === 'Money Lab') { const price = rand(5, 15), qty = rand(2, 6); return { q: `MrBeast build budget: ${qty} parts cost $${price} each. Total spend?`, a: price * qty, hint: 'part cost × number of parts', skill: 'Money boss budgeting' }; }
    if (missionKey === 'Mystery Case') { const total = rand(2200, 3200), skin = rand(900, 1500), pickaxe = rand(300, 800); return { q: `Fortnite locker: ${total} V-Bucks. Skin ${skin}, pickaxe ${pickaxe}. V-Bucks left?`, a: total - skin - pickaxe, hint: 'Start with total, subtract both items.', skill: 'Accuracy control' }; }
    if (missionKey === 'Boss Battle') { const d = rand(2, 9), q = rand(12, 99); return { q: `Horizon resource boss: ${d * q} shards packed into ${d} equal pouches. Shards per pouch?`, a: q, hint: 'Split the shards into equal groups.', skill: 'Champion reasoning' }; }
    return { q: `PlayStation streak shield: (8 + 4) ÷ 2 energy cells. Cells charged?`, a: 6, hint: 'Charge the bracket first, then split.', skill: 'Streak defense' };
  }
  if (missionKey === 'Speed Round') { const a = rand(8, 20), b = rand(1, a - 1); return { q: `Leila found ${a} clue stickers. ${b} were decoys. Real clues left?`, a: a - b, hint: 'Real clues = total clues - decoys.', skill: 'Secret code fluency' }; }
  if (missionKey === 'Logic Battle') { const x = [2, 5, 10, 3, 4, 6][rand(0, 5)], y = rand(2, 9); return { q: `Arina has ${y} mystery bags with ${x} squishies each. Total squishies?`, a: x * y, hint: `Skip count by ${x}.`, skill: 'Clue pattern logic' }; }
  if (missionKey === 'Money Lab') { const total = [40, 50, 60][rand(0, 2)], cost = [5, 8, 10][rand(0, 2)], qty = rand(2, 4); return { q: `Sephora clue: Katya has $${total}. ${qty} lip glosses cost $${cost} each. Money left?`, a: total - cost * qty, hint: 'Find the shopping total first, then subtract.', skill: 'Shopping choices' }; }
  if (missionKey === 'Mystery Case') { const signals = rand(8, 16), decoded = rand(2, signals - 1); return { q: `Emily hears ${signals} portal signals. ${decoded} are decoded. Signals still hidden?`, a: signals - decoded, hint: 'Hidden = total - decoded.', skill: 'Portal coordinate decoding' }; }
  if (missionKey === 'Boss Battle') { const d = rand(2, 6), q = rand(4, 12); return { q: `Roblox signal: ${d * q} gems split into ${d} equal vaults. Gems per vault?`, a: q, hint: 'Division unlocks equal vaults.', skill: 'Roblox signal decoding' }; }
  return { q: `Tolik left 20 glowing clues in 5 envelopes. Clues per envelope?`, a: 4, hint: 'Think 5 × ? = 20.', skill: 'Midnight clue focus' };
}

const buildMissionsFor = (child) => {
  const total = missionTotal(child);
  const theme = child === 'alex'
    ? {
      title: 'Daily Grade 8 Prep Mission',
      icon: '⚡',
      story: 'Alex clears one focused arena run with fractions, decimals, percentages, ratios, integers, algebra, geometry, probability, money, and speed checks.',
      objective: `Complete ${total} mixed Grade 7 review and Grade 8 prep questions.`,
      skill: 'Grade 8 prep mix'
    }
    : {
      title: 'Daily Grade 5 Prep Mission',
      icon: '🔎',
      story: 'Katya solves one mystery path with facts, long division basics, multiplication, fractions, decimals, patterns, geometry, measurement, word problems, and money math.',
      objective: `Complete ${total} mixed Grade 4 refresh and Grade 5 prep questions.`,
      skill: 'Grade 5 prep mix'
    };
  return [{ id: `${child}-daily`, title: theme.title, story: theme.story, objective: theme.objective, icon: theme.icon, difficulty: 'Daily', skillFocus: theme.skill, progress: 0, total, xpReward: 110, coinReward: 55, completed: false, attempts: 0, correctAnswers: 0, mistakesCorrected: 0, lastScore: null }];
};

const buildMoneyLabMissions = (childKey) => {
  if (childKey === 'katya') {
    return [
      { id: 'needs-wants', title: 'Needs vs Wants', story: 'Leila asks Katya to sort a mystery reward box.', question: 'Is a mystery squishy reward a need or a want?', type: 'choice', options: ['Need', 'Want'], answer: 'Want', hint: 'Needs are required for living.', skill: 'Needs vs wants', xpReward: 10, coinReward: 6, completed: false, attempts: 0, corrected: false },
      { id: 'bubble-tea', title: 'Save for Bubble Tea', story: 'Katya and Arina stop for bubble tea before clue hunting. Katya has 10 coins and bubble tea costs 8.', question: 'How many coins are left?', type: 'number', answer: 2, hint: 'Coins left = 10 - 8.', skill: 'Subtraction budgeting', xpReward: 10, coinReward: 6, completed: false, attempts: 0, corrected: false },
      { id: 'compare-prices', title: 'Compare Prices', story: 'Emily spots two Roblox reward boxes in the arcade.', question: 'Which mystery box is cheaper: 9 coins or 12 coins?', type: 'choice', options: ['9 coins', '12 coins'], answer: '9 coins', hint: 'Smaller number is cheaper.', skill: 'Compare prices', xpReward: 12, coinReward: 7, completed: false, attempts: 0, corrected: false },
      { id: 'takeout-budget', title: 'Budget a Takeout Order', story: 'Grandfather Serezha gives Katya 20 coins for a Toca Boca mini-shop.', question: 'A cute outfit costs 15 and a tiny elf hat for Tolik costs 5. Total coins?', type: 'number', answer: 20, hint: 'Add 15 + 5.', skill: 'Addition budgeting', xpReward: 12, coinReward: 8, completed: false, attempts: 0, corrected: false },
      { id: 'doordash-total', title: 'DoorDash Total', story: 'Grandma Olga checks the receipt for a family snack delivery.', question: 'Snack box is 16 and delivery is 4. Total cost?', type: 'number', answer: 20, hint: 'Food + delivery.', skill: 'Total cost', xpReward: 14, coinReward: 8, completed: false, attempts: 0, corrected: false },
      { id: 'save-or-spend', title: 'Save or Spend Choice', story: 'Katya saves for a spooky movie night with Leila and Arina.', question: 'You save 5 coins Monday and 5 Tuesday. How many saved?', type: 'number', answer: 10, hint: 'Add saved amounts.', skill: 'Saving habit', xpReward: 14, coinReward: 9, completed: false, attempts: 0, corrected: false },
      { id: 'gift-card-goal', title: 'Gift Card Savings Goal', story: 'Katya wants a Sephora or Starbucks treat card after solving cases.', question: 'If card costs 300 and you have 50, how many more coins?', type: 'number', answer: 250, hint: 'Need = goal - current.', skill: 'Savings goal', xpReward: 16, coinReward: 10, completed: false, attempts: 0, corrected: false }
    ];
  }
  return [
    { id: 'needs-wants', title: 'Needs vs Wants', story: 'Alex plans upgrades for a gaming setup without wasting coins.', question: 'Is a PlayStation card a need or a want?', type: 'choice', options: ['Need', 'Want'], answer: 'Want', hint: 'Needs are essentials.', skill: 'Needs vs wants', xpReward: 12, coinReward: 7, completed: false, attempts: 0, corrected: false },
    { id: 'bubble-tea', title: 'Save for Bubble Tea', story: 'Alex tracks V-Bucks like a battle-pass champion.', question: 'You have 120 coins. Bubble tea costs 80. Coins left?', type: 'number', answer: 40, hint: 'Subtract cost from total.', skill: 'Budget subtraction', xpReward: 12, coinReward: 8, completed: false, attempts: 0, corrected: false },
    { id: 'compare-prices', title: 'Compare Prices', story: 'Alex compares prices for a build project before wasting money.', question: 'Item A is 34 coins, item B is 41 coins. Which is cheaper?', type: 'choice', options: ['Item A', 'Item B'], answer: 'Item A', hint: 'Lower price is cheaper.', skill: 'Compare prices', xpReward: 14, coinReward: 8, completed: false, attempts: 0, corrected: false },
    { id: 'takeout-budget', title: 'Budget a Takeout Order', story: 'Alex calculates takeout before spending the team budget.', question: 'Takeout is $18, delivery fee is $4, tax is $3. Total?', type: 'number', answer: 25, hint: 'Add all three costs.', skill: 'Budgeting totals', xpReward: 15, coinReward: 9, completed: false, attempts: 0, corrected: false },
    { id: 'doordash-total', title: 'DoorDash Total', story: 'Alex uses a discount code like a money boss.', question: 'Meal is 30, fee is 5, discount is 10. Final total?', type: 'number', answer: 25, hint: '30 + 5 - 10.', skill: 'Discount totals', xpReward: 16, coinReward: 10, completed: false, attempts: 0, corrected: false },
    { id: 'save-or-spend', title: 'Save or Spend Choice', story: 'Alex chooses between a small Roblox item now or saving for PlayStation later.', question: 'Best choice to reach PlayStation card faster?', type: 'choice', options: ['Spend on small reward now', 'Save coins for bigger reward'], answer: 'Save coins for bigger reward', hint: 'Saving increases future buying power.', skill: 'Saving choices', xpReward: 16, coinReward: 10, completed: false, attempts: 0, corrected: false },
    { id: 'gift-card-goal', title: 'Gift Card Savings Goal', story: 'Alex wants a PlayStation card and checks the remaining grind.', question: 'You have 120 coins. PlayStation card costs 500. How many more?', type: 'number', answer: 380, hint: 'Goal - current coins.', skill: 'Savings goal', xpReward: 18, coinReward: 12, completed: false, attempts: 0, corrected: false }
  ];
};

const normalize = (s) => {
  const base = safeClone(defaultState);
  const merged = { ...base, ...s, children: { ...base.children, ...(s?.children || {}) }, missions: { ...base.missions, ...(s?.missions || {}) }, battleScore: { ...base.battleScore, ...(s?.battleScore || {}) }, ui: { ...base.ui, ...(s?.ui || {}) }, grant: { ...base.grant, ...(s?.grant || {}) } };
  if (!tabs.includes(merged.activeTab)) merged.activeTab = 'Home';
  if (!merged.moneyLab || typeof merged.moneyLab !== 'object') merged.moneyLab = { activeChild: 'alex', answer: '', feedback: '', secondTry: false, byChild: {} };
  if (!merged.moneyLab.byChild || typeof merged.moneyLab.byChild !== 'object') merged.moneyLab.byChild = {};
  ['alex', 'katya'].forEach((k) => {
    const existing = merged.moneyLab.byChild[k] || {};
    if (!Array.isArray(existing.missions) || !existing.missions.length) existing.missions = buildMoneyLabMissions(k);
    existing.activeId = existing.activeId || existing.missions[0]?.id || '';
    existing.completedCount = existing.completedCount || 0;
    existing.xpEarned = existing.xpEarned || 0;
    existing.coinsEarned = existing.coinsEarned || 0;
    existing.skills = Array.isArray(existing.skills) ? existing.skills : [];
    existing.mistakesCorrected = existing.mistakesCorrected || 0;
    existing.savingChoices = Array.isArray(existing.savingChoices) ? existing.savingChoices : [];
    merged.moneyLab.byChild[k] = existing;
  });
  ['alex', 'katya'].forEach((childKey) => {
    if (!Array.isArray(merged.missions[childKey]) || merged.missions[childKey].length !== 1 || merged.missions[childKey][0]?.id !== `${childKey}-daily`) {
      merged.missions[childKey] = buildMissionsFor(childKey);
      return;
    }
    const freshMission = buildMissionsFor(childKey)[0];
    merged.missions[childKey][0] = {
      ...freshMission,
      ...merged.missions[childKey][0],
      title: freshMission.title,
      story: freshMission.story,
      objective: freshMission.objective,
      total: freshMission.total,
      progress: Math.min(merged.missions[childKey][0].progress || 0, freshMission.total)
    };
  });
  return merged;
};

const load = () => { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? normalize(JSON.parse(raw)) : normalize({}); } catch { return normalize({}); } };

export default function App() {
  const [state, setState] = useState(load);
  const persist = (next) => { setState(next); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {} };

  const setSelectedChild = (childKey) => {
    const next = safeClone(state);
    next.selectedChild = childKey;
    next.ui.message = `${next.children[childKey].name} selected. Ready for mission.`;
    persist(next);
  };

  const switchTab = (tab) => {
    const next = safeClone(state);
    next.activeTab = tab;
    next.ui.message = '';
    next.ui.rewardMessage = '';
    persist(next);
  };

  const addXpCoins = (next, childKey, xp, coins, skill) => {
    const c = next.children[childKey];
    c.xp += xp; c.coins += coins; c.statsToday.xpEarned += xp; c.statsToday.coinsEarned += coins;
    c.statsToday.strongestSkill = skill || c.statsToday.strongestSkill;
    while (c.xp >= c.xpMax) { c.xp -= c.xpMax; c.level += 1; c.xpMax += 100; c.coins += 25; next.ui.levelUp = `${c.name} leveled up to ${c.level}! +25 coins`; }
  };

  const scrollMissionInputIntoView = () => {
    window.setTimeout(() => {
      document.querySelector('.answer-input, .choice-answer')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
  };

  const isAnswerCorrect = (question, rawAnswer) => {
    const raw = String(rawAnswer ?? '').trim();
    if (!raw) return false;
    if (question.type === 'choice') return raw === String(question.a);
    const numericAnswer = Number(raw.replace(',', '.').replace(/^\$/, ''));
    const expected = Number(question.a);
    return !Number.isNaN(numericAnswer) && Math.abs(numericAnswer - expected) < 0.001;
  };

  const startMission = (childKey, missionId) => {
    const mission = state.missions[childKey].find((m) => m.id === missionId); if (!mission) return;
    const questions = getDailyQuestions(childKey);
    const next = safeClone(state); next.selectedChild = childKey; next.activeTab = 'Daily Mission'; next.activeMission = { childKey, missionId, questions, index: Math.min(mission.progress || 0, questions.length - 1), input: '', feedback: '', localCorrect: 0, localAttempts: 0, localCorrections: 0, secondTry: false }; next.battleScore[childKey] += 1; next.ui.message = `${next.children[childKey].name} daily mission started.`;
    persist(next);
    setTimeout(() => document.getElementById('active-mission')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  const submitMissionAnswer = () => {
    const next = safeClone(state); const m = next.activeMission; if (!m) return;
    const child = next.children[m.childKey]; const mission = next.missions[m.childKey].find((x) => x.id === m.missionId); const q = m.questions[m.index];
    m.localAttempts += 1; mission.attempts += 1; child.statsToday.attempts += 1;
    if (isAnswerCorrect(q, m.input)) {
      const corrected = m.secondTry; m.localCorrect += 1; mission.correctAnswers += 1; mission.progress = Math.max(mission.progress, m.index + 1); child.statsToday.correct += 1; m.feedback = corrected ? 'Nice fix. That step is stronger now.' : 'Correct! Great work.';
      addXpCoins(next, m.childKey, corrected ? 5 : 8, corrected ? 3 : 5, q.skill);
      if (corrected) { mission.mistakesCorrected += 1; child.mistakesCorrected += 1; child.statsToday.coinsEarned += 0; next.battleScore[m.childKey] += 1; }
      m.secondTry = false; m.input = '';
      if (m.index < m.questions.length - 1) m.index += 1;
      else {
        const score = m.localCorrect;
        const accuracy = Math.round((score / Math.max(1, m.questions.length)) * 100);
        const accuracyBonusXp = Math.round(accuracy / 4);
        const accuracyBonusCoins = Math.round(accuracy / 8);
        mission.completed = true; child.missionsCompletedToday += 1; child.completedMissions.push(mission.title); child.minutesToday += next.weekendMode ? 8 : 10;
        mission.lastScore = `${score}/${m.questions.length}`;
        child.dailyHistory.unshift({ date: todayKey(), mission: mission.title, score, total: m.questions.length, accuracy });
        addXpCoins(next, m.childKey, mission.xpReward + accuracyBonusXp, mission.coinReward + accuracyBonusCoins, mission.skillFocus); next.battleScore[m.childKey] += 2;
        if (accuracy >= 80) next.battleScore[m.childKey] += 1;
        if (m.childKey === 'alex') next.battleScore.alex += 1; else next.battleScore.katya += 1;
        if (child.missionsCompletedToday >= 1) child.streak += 0;
        next.ui.message = `${child.name} completed ${mission.title}! Score: ${score}/${m.questions.length} (${accuracy}%). XP and coins added.`;
        next.activeMission = null;
      }
    } else {
      m.feedback = 'Good try, fix the step. Hint: ' + q.hint; m.secondTry = true;
    }
    child.accuracy = Math.round((child.statsToday.correct / Math.max(1, child.statsToday.attempts)) * 100);
    persist(next);
  };

  const requestReward = (childKey, reward) => {
    const next = safeClone(state); const child = next.children[childKey];
    if (child.coins < reward[2]) { next.ui.rewardMessage = `Keep saving. You need ${reward[2] - child.coins} more coins.`; return persist(next); }
    const req = { id: Date.now() + Math.random(), childKey, child: child.name, reward: reward[1], cost: reward[2], status: 'Pending Parent Approval' };
    next.rewardRequests.unshift(req); child.rewardsRequested.push(req.reward); next.ui.rewardMessage = `${child.name} requested ${req.reward}.`;
    persist(next);
  };

  const parentDecision = (id, approve) => {
    const next = safeClone(state); const req = next.rewardRequests.find((r) => r.id === id); if (!req || req.status !== 'Pending Parent Approval') return;
    if (approve) { if (next.children[req.childKey].coins >= req.cost) next.children[req.childKey].coins -= req.cost; req.status = 'Approved'; }
    else req.status = 'Declined';
    persist(next);
  };

  const claimGrant = () => {
    const next = safeClone(state); if (next.grant.lastClaimDate === todayKey()) { next.grant.message = 'Already claimed today.'; return persist(next); }
    const childKey = Math.random() < 0.5 ? 'alex' : 'katya';
    const prizes = [() => addXpCoins(next, childKey, 0, 10, 'Grant'), () => addXpCoins(next, childKey, 0, 20, 'Grant'), () => addXpCoins(next, childKey, 5, 0, 'Grant'), () => next.children[childKey].badgesEarned.push('Grant Spark'), () => { addXpCoins(next, childKey, 8, 8, 'Mystery Bonus'); }];
    prizes[rand(0, prizes.length - 1)](); next.grant.lastClaimDate = todayKey(); next.grant.message = `Grant applied to ${next.children[childKey].name}`; persist(next);
  };

  const momBonus = (childKey) => { const next = safeClone(state); addXpCoins(next, childKey, 0, 25, 'Mom Bonus'); persist(next); };
  const resetToday = () => { const next = safeClone(state); ['alex', 'katya'].forEach((k) => { next.children[k].minutesToday = 0; next.children[k].missionsCompletedToday = 0; next.children[k].statsToday = { xpEarned: 0, coinsEarned: 0, correct: 0, attempts: 0, strongestSkill: 'Warmup' }; }); next.missions = { alex: buildMissionsFor('alex'), katya: buildMissionsFor('katya') }; next.activeMission = null; persist(next); };
  const resetAll = () => persist(normalize({}));

  const exportJson = () => navigator.clipboard.writeText(JSON.stringify(state, null, 2));
  const importJson = () => { try { const parsed = JSON.parse(state.importText); persist(normalize(parsed)); } catch { const n = safeClone(state); n.ui.message = 'Invalid import JSON'; persist(n); } };
  const setMoneyLabChild = (childKey) => {
    const next = safeClone(state);
    next.selectedChild = childKey;
    next.moneyLab.activeChild = childKey;
    next.moneyLab.answer = '';
    next.moneyLab.feedback = '';
    next.moneyLab.secondTry = false;
    next.ui.message = `${next.children[childKey].name} selected for Money Lab.`;
    persist(next);
  };
  const setMoneyLabMission = (childKey, missionId) => {
    const next = safeClone(state);
    next.moneyLab.activeChild = childKey;
    next.moneyLab.byChild[childKey].activeId = missionId;
    next.moneyLab.answer = '';
    next.moneyLab.feedback = '';
    next.moneyLab.secondTry = false;
    persist(next);
  };
  const submitMoneyLab = () => {
    const next = safeClone(state);
    const childKey = next.moneyLab.activeChild || next.selectedChild;
    const bucket = next.moneyLab.byChild[childKey];
    const mission = bucket.missions.find((m) => m.id === bucket.activeId);
    if (!mission || mission.completed) return;
    mission.attempts += 1;
    const raw = String(next.moneyLab.answer || '').trim();
    const ok = mission.type === 'choice' ? raw === mission.answer : Number(raw) === mission.answer;
    if (ok) {
      const corrected = next.moneyLab.secondTry;
      next.moneyLab.feedback = 'Correct! Smart money move.';
      mission.completed = true;
      mission.corrected = corrected;
      bucket.completedCount += 1;
      const gainXp = corrected ? 5 : mission.xpReward;
      const gainCoins = corrected ? 3 : mission.coinReward;
      addXpCoins(next, childKey, gainXp, gainCoins, mission.skill);
      bucket.xpEarned += gainXp;
      bucket.coinsEarned += gainCoins;
      if (!bucket.skills.includes(mission.skill)) bucket.skills.push(mission.skill);
      if (mission.title.includes('Save') || mission.title.includes('Goal')) bucket.savingChoices.push(mission.title);
      if (corrected) { bucket.mistakesCorrected += 1; next.children[childKey].mistakesCorrected += 1; }
      next.moneyLab.answer = '';
      next.moneyLab.secondTry = false;
    } else {
      next.moneyLab.feedback = `Good try. Let’s fix the step. Hint: ${mission.hint}`;
      next.moneyLab.secondTry = true;
    }
    persist(next);
  };

  const dailyReport = useMemo(() => {
    const a = state.children.alex, k = state.children.katya;
    return `Today Alex practiced ${a.completedMissions.join(', ') || 'warmups'} and earned ${a.statsToday.xpEarned} XP. Today Katya practiced ${k.completedMissions.join(', ') || 'warmups'} and earned ${k.statsToday.xpEarned} XP. Tomorrow focus: Alex arena precision, Katya mystery clues. Reward requests: ${state.rewardRequests.map((r) => `${r.child}:${r.reward}(${r.status})`).join('; ') || 'none'}.`;
  }, [state]);

  const winner = state.battleScore.alex === state.battleScore.katya ? 'Tie' : (state.battleScore.alex > state.battleScore.katya ? 'Alex leads' : 'Katya leads');

  const selected = state.selectedChild || 'alex';
  const selectedName = state.children[selected].name;
  const selectedMissions = Array.isArray(state.missions?.[selected]) ? state.missions[selected] : [];
  const nextMission = selectedMissions.find((m) => !m.completed);
  const moneyLabChild = state.moneyLab?.activeChild || selected;
  const moneyLabBucket = state.moneyLab?.byChild?.[moneyLabChild] || { missions: [], completedCount: 0, coinsEarned: 0 };
  const activeMissionRecord = state.activeMission
    ? state.missions[state.activeMission.childKey]?.find((x) => x.id === state.activeMission.missionId)
    : null;
  const activeQuestion = state.activeMission?.questions?.[state.activeMission.index];
  const activeFeedbackType = state.activeMission?.feedback?.startsWith('Correct') ? 'correct' : (state.activeMission?.feedback ? 'coach' : '');
  const activeTheme = state.activeMission ? missionTheme(state.activeMission.childKey, activeMissionRecord?.title, Number(state.activeMission.missionId?.split('-').pop() || 0)) : null;

  return <div className="app-shell"><div className="test-banner">Summer Math Battle Tutor Loaded</div><Particles color={selected === 'alex' ? '#00b4ff' : '#ff006e'} />
    <nav className="game-hud">
      <div className="hud-logo">⚔ SUMMER BATTLE QUEST 2026</div>
      <div className="hud-tabs">{tabs.map((t)=> <button className={state.activeTab===t ? 'active' : ''} key={t} onClick={()=>switchTab(t)}>{t}</button>)}</div>
      <div className="hud-counters"><span>🪙 {state.children.alex.coins + state.children.katya.coins}</span><span>⭐ {state.children.alex.xp + state.children.katya.xp} XP</span><span className="notification">🔔<b>{state.notifications}</b></span><span>⚙</span></div>
    </nav>
    <div className="actions child-switcher"><button className={selected === 'alex' ? 'active' : ''} onClick={() => setSelectedChild('alex')}>Alex</button><button className={selected === 'katya' ? 'active' : ''} onClick={() => setSelectedChild('katya')}>Katya</button><strong>Currently selected: {selectedName}</strong></div>
    <section className={`quest-command ${selected}`}>
      <div><span className="command-kicker">Today’s path</span><h2>{selectedName} is ready for {selected === 'alex' ? 'Shadow Ninja training' : 'a mystery investigation'}</h2><p>Next up: {nextMission?.title || 'All quests complete'} • {state.children[selected].xp}/{state.children[selected].xpMax} XP • {state.children[selected].coins} coins • 🔥 {state.children[selected].streak} streak</p></div>
      <div className="command-actions">{nextMission && <button onClick={() => startMission(selected, nextMission.id)}>Start Next Mission</button>}{state.activeMission && <button onClick={() => document.getElementById('active-mission')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Continue Mission</button>}</div>
    </section>
    {state.activeMission && <section id="active-mission" className={`learning-stage ${state.activeMission.childKey}-path ${activeFeedbackType}`}>
      <div className="mission-topline">
        <div>
          <span className="mission-kicker">{state.activeMission.childKey === 'alex' ? 'Shadow Ninja Arena' : 'Mystery Investigation'}</span>
          <h2>{activeMissionRecord?.title || activeTheme?.title || 'Active Mission'}</h2>
        </div>
        <div className="mission-rewards"><span>+{activeMissionRecord?.xpReward || 0} XP</span><span>+{activeMissionRecord?.coinReward || 0} 🪙</span></div>
        <button className="mission-exit" onClick={() => persist({ ...state, activeMission: null, ui: { ...state.ui, message: 'Mission closed.' } })}>Close</button>
      </div>
      <div className="mission-progress">
        <strong>Question {state.activeMission.index + 1} of {state.activeMission.questions.length}</strong>
        <div className="mission-progress-track"><span style={{ width: `${((state.activeMission.index + 1) / state.activeMission.questions.length) * 100}%` }} /></div>
      </div>
      <div className="learning-grid">
        <aside className={`solver-card ${state.activeMission.childKey}`}>
          <div className="solver-avatar">{state.activeMission.childKey === 'alex' ? '⚡' : '🔎'}</div>
          <h3>{state.children[state.activeMission.childKey].name}</h3>
          <p>{state.children[state.activeMission.childKey].bonus} bonus ready</p>
        </aside>
        <div className="question-arena">
          <p className="question-label">{activeMissionRecord?.objective || activeTheme?.objective}</p>
          <p className="mission-story">{activeMissionRecord?.story || activeTheme?.story}</p>
          <div className="question-text">{activeQuestion?.q || 'Loading question...'}</div>
          {activeQuestion?.type === 'choice' ? <div className="choice-grid">{activeQuestion.options.map((option) => <button className={`choice-answer ${state.activeMission.input === option ? 'selected' : ''}`} key={option} onClick={() => persist({ ...state, activeMission: { ...state.activeMission, input: option } })}>{option}</button>)}</div> : <input className="answer-input" aria-label="Answer" placeholder="Type your answer" inputMode={activeQuestion?.inputMode || 'numeric'} autoComplete="off" value={state.activeMission.input} onFocus={scrollMissionInputIntoView} onChange={(e) => persist({ ...state, activeMission: { ...state.activeMission, input: e.target.value } })} />}
          <button className="submit-answer" onClick={submitMissionAnswer}>Submit Answer</button>
          {state.activeMission.feedback && <div className={`feedback-box ${activeFeedbackType}`}>{state.activeMission.feedback}</div>}
        </div>
        <aside className="scratchpad-panel">
          <h3>Scratchpad</h3>
          <p>Work out steps here before submitting.</p>
          <textarea placeholder={state.activeMission.childKey === 'alex' ? 'Plan the move. Check before submit.' : 'Collect clues with Leila, Arina, and Emily...'} />
        </aside>
      </div>
    </section>}
    <main className="content fade-in">
      {state.ui.levelUp && <p>{state.ui.levelUp}</p>}
      {state.ui.message && <p>{state.ui.message}</p>}
      {state.ui.rewardMessage && <p>{state.ui.rewardMessage}</p>}
      {state.activeTab === 'Home' && <div className='home-game-layout'><aside className={`hero-side alex-side ${selected === 'alex' ? 'selected' : ''}`} onClick={()=>setSelectedChild('alex')}><div className='avatar-wrap avatar-alex'><svg width='200' height='220' viewBox='0 0 200 220'><rect width='200' height='220' fill='url(#aBg)' rx='10'/><defs><radialGradient id='aBg' cx='50%' cy='60%'><stop offset='0%' stopColor='#003366'/><stop offset='100%' stopColor='#000d1a'/></radialGradient></defs><polygon points='36,34 23,78 42,70 29,122 72,55 52,63' fill='#00b4ff' opacity='.6'/><circle cx='100' cy='118' r='32' fill='#f5c842'/><ellipse cx='100' cy='92' rx='36' ry='18' fill='#FFD700'/><circle cx='88' cy='118' r='5' fill='#00b4ff'/><circle cx='112' cy='118' r='5' fill='#00b4ff'/><rect x='60' y='150' width='80' height='62' rx='16' fill='#10264d'/></svg></div><h2>ALEX</h2><p>SHADOW NINJA • BATTLE ARENA CHAMPION</p><div className='hero-stats'><span>LVL {state.children.alex.level}</span><span>🪙 {state.children.alex.coins}</span><span>🔥 {state.children.alex.streak}</span></div><div className='xp'><span style={{width:`${Math.min(100,(state.children.alex.xp/state.children.alex.xpMax)*100)}%`}}/></div><button>Choose Alex</button></aside><main className='center-dashboard'><section className='event-banner'><span>Daily Event</span><h3>SUMMER BATTLE QUEST 2026</h3><p>Selected: {selectedName} • Next reward path is active</p></section><section className='status-grid'><div className='card'>🔥 <strong>{state.children[selected].streak}</strong><span>Day streak</span></div><div className='card'>🎯 <strong>{state.children[selected].missionsCompletedToday}/1</strong><span>Daily mission</span></div><div className='card'>🤝 <strong>+15%</strong><span>Team bonus</span></div></section><section className='dashboard-panel'><div className='section-title'><h3>TODAY'S DAILY MISSION</h3><button onClick={()=>nextMission && startMission(selected,nextMission.id)} disabled={!nextMission}>{nextMission ? 'Start Next Mission' : 'All Complete'}</button></div><div className='mission-grid'>{selectedMissions.map((m,i)=>{ const theme = missionTheme(selected, m.title, i); return <article key={m.id} className={`mission ${m.completed ? 'complete' : ''}`}><div className='mission-icon'>{m.icon || theme.icon}</div><h4>{m.title || theme.title}</h4><p>{m.story || theme.story}</p><p className='reward-line'>{m.progress}/{m.total || missionTotal(selected)} • +{m.xpReward} XP • +{m.coinReward} 🪙</p><button onClick={()=>startMission(selected,m.id)}>{m.completed ? 'Replay Quest' : 'Start Quest'}</button></article>; })}</div></section><section className='lower-grid'><article className='big-card'><h3>Summer Team Quest</h3><p>Combined XP: {state.battleScore.alex + state.battleScore.katya}</p></article><article className='big-card chest'><h3>Grant Prize Chest</h3><button onClick={claimGrant}>Claim Prize</button></article><article className='big-card'><h3>Next Reward</h3><p className='big-reward'>🧋 Bubble Tea</p></article></section></main><aside className={`hero-side katya-side ${selected === 'katya' ? 'selected' : ''}`} onClick={()=>setSelectedChild('katya')}><div className='avatar-wrap avatar-katya'><svg width='200' height='220' viewBox='0 0 200 220'><rect width='200' height='220' fill='url(#kBg)' rx='10'/><defs><radialGradient id='kBg' cx='50%' cy='60%'><stop offset='0%' stopColor='#330011'/><stop offset='100%' stopColor='#0d0008'/></radialGradient></defs><circle cx='40' cy='38' r='3' fill='#ff8fd6'/><circle cx='72' cy='22' r='3' fill='#ff4fbc'/><circle cx='132' cy='26' r='3' fill='#ff8fd6'/><ellipse cx='154' cy='128' rx='42' ry='16' fill='#fff6a0' opacity='.16'/><circle cx='100' cy='116' r='30' fill='#f5c842'/><ellipse cx='100' cy='90' rx='32' ry='16' fill='#FFD700'/><circle cx='88' cy='116' r='5' fill='#00b4ff'/><circle cx='112' cy='116' r='5' fill='#00b4ff'/><rect x='92' y='128' width='16' height='5' rx='2' fill='#fff'/><rect x='60' y='150' width='80' height='62' rx='16' fill='#321126'/></svg></div><h2>KATYA</h2><p>LEAD INVESTIGATOR • HAWKINS MYSTERY HUNTER</p><div className='hero-stats'><span>LVL {state.children.katya.level}</span><span>🪙 {state.children.katya.coins}</span><span>🔥 {state.children.katya.streak}</span></div><div className='xp'><span style={{width:`${Math.min(100,(state.children.katya.xp/state.children.katya.xpMax)*100)}%`,background:'linear-gradient(90deg,var(--katya-primary),var(--katya-secondary))'}}/></div><button>Choose Katya</button><div className='quote-card'>"Friends don't lie. Numbers don't either. Keep solving."</div></aside></div>}
      {state.activeTab === 'Daily Mission' && <section className='dashboard-panel'><div className='section-title'><h2>{selectedName}’s Daily Mission</h2><span>{selected === 'alex' ? 'One focused daily arena' : 'One focused daily mystery'}</span></div><div className="mission-grid">{selectedMissions.map((m, i) => { const theme = missionTheme(selected, m.title, i); return <article className={`mission ${m.completed ? 'complete' : ''} ${state.activeMission?.missionId === m.id ? 'selected-mission' : ''}`} key={m.id}><div className='mission-icon'>{m.icon || theme.icon}</div><h4>{m.title || theme.title}</h4><p>{m.story || theme.story}</p><p><strong>Objective:</strong> {m.objective || theme.objective}</p><p className='reward-line'>Progress {m.progress}/{m.total || missionTotal(selected)} • +{m.xpReward} XP • +{m.coinReward} 🪙</p><p className='status-pill'>{m.completed ? '✅ Quest Complete' : '⬜ Ready to play'}</p><button onClick={() => startMission(selected, m.id)}>{state.activeMission?.missionId === m.id ? 'Continue Mission' : 'Start Mission'}</button></article>; })}</div></section>}
      {state.activeTab === 'Battle' && <section className='battle-stage'><div className='battle-side alex-battle'><span>Alex path energy</span><strong>{state.battleScore.alex}</strong></div><div className='versus-core'><h2>Summer Team Quest</h2><p>Combined XP: {state.battleScore.alex + state.battleScore.katya}</p><b>VS = Victory by Solving</b><p>Compete by effort and improvement. Family rewards unlock through teamwork: pizza night, movie night, activity day, and bonus bubble tea.</p></div><div className='battle-side katya-battle'><span>Katya clue energy</span><strong>{state.battleScore.katya}</strong></div></section>}
      {state.activeTab === 'Store' && <section className='dashboard-panel'><div className='section-title'><h2>Reward Store</h2><span>{selectedName} selected • parent approval required</span></div><div className='store-grid'>{rewards.map((r,idx) => {const progress=Math.min(100,Math.round((state.children[selected].coins/r[2])*100)); const need=Math.max(0,r[2]-state.children[selected].coins); return <article className={`store-card ${need === 0 ? 'unlocked' : 'locked'}`} key={r[1]} style={{borderColor:'#'+((idx*123456)%0xffffff).toString(16).padStart(6,'0')+'88'}}><div className='reward-icon'>{r[0]}</div><h4>{r[1]}</h4><p className='cost'>{r[2]} coins</p><div className='xp'><span style={{width:`${progress}%`}}/></div><p>{need === 0 ? 'Ready to request' : `${need} coins to go`}</p><small>Requires parent approval</small><button onClick={() => requestReward(selected, r)}>Request Reward</button></article>;})}</div></section>}
      {state.activeTab === 'Grant Prize' && <section><h2>Grant Prize</h2><button onClick={claimGrant}>Claim Daily Grant Prize</button><p>{state.grant.message}</p></section>}
      {state.activeTab === 'Practice' && <section><h2>Practice Trainer</h2><p>Selected child: {selectedName}</p><div className="actions"><button onClick={() => setSelectedChild('alex')}>Alex</button><button onClick={() => setSelectedChild('katya')}>Katya</button></div><select value={state.practice.mode} onChange={(e)=>persist({...state,practice:{...state.practice,mode:e.target.value,child:selected}})}><option>Multiplication</option><option>Division</option><option>Mixed</option><option>Missing Number</option></select><button onClick={()=>{const qs=Array.from({length:10},()=>genQuestion(selected,'Speed Round'));persist({...state,practice:{...state.practice,child:selected,questions:qs,index:0,score:0}})}}>Generate 10 Questions</button>{state.practice.questions.length>0&&<article className="big-card"><p>{state.practice.index+1}/10: {state.practice.questions[state.practice.index]?.q}</p><input value={state.practice.answer||''} onChange={(e)=>persist({...state,practice:{...state.practice,answer:e.target.value}})} /><button onClick={()=>{const n=safeClone(state);const q=n.practice.questions[n.practice.index];if(Number((n.practice.answer||'').trim())===q.a)n.practice.score+=1;n.practice.index=Math.min(9,n.practice.index+1);n.practice.answer='';persist(n);}}>Submit</button><p>Score: {state.practice.score}</p></article>}</section>}
      {state.activeTab === 'Money Lab' && <section><h2>💰 Money Lab for {state.children[moneyLabChild].name}</h2><div className="actions"><button onClick={() => setMoneyLabChild('alex')}>Alex</button><button onClick={() => setMoneyLabChild('katya')}>Katya</button></div><article className="big-card"><h3>Selected Child Card</h3><p>{state.children[moneyLabChild].name} • Coins: {state.children[moneyLabChild].coins}</p><p>Piggy Bank: {moneyLabBucket.coinsEarned} coins earned in Money Lab</p><p>Completed badges: {moneyLabBucket.completedCount}/7</p></article><div className="mission-grid">{moneyLabBucket.missions.map((m) => <article className="mission" key={m.id}><h4>🐷 {m.title}</h4><p>{m.story}</p><p><strong>Question:</strong> {m.question}</p>{m.type === 'choice' ? <div>{(m.options || []).map((opt) => <button key={opt} onClick={() => persist({ ...state, moneyLab: { ...state.moneyLab, answer: opt, activeChild: moneyLabChild, byChild: { ...state.moneyLab.byChild, [moneyLabChild]: { ...moneyLabBucket, activeId: m.id } } } })}>{opt}</button>)}</div> : <input placeholder="Enter number" value={(moneyLabBucket.activeId === m.id) ? state.moneyLab.answer : ''} onChange={(e) => { persist({ ...state, moneyLab: { ...state.moneyLab, activeChild: moneyLabChild, answer: e.target.value, byChild: { ...state.moneyLab.byChild, [moneyLabChild]: { ...moneyLabBucket, activeId: m.id } } } }); }} />}<p>Rewards: +{m.xpReward} XP • +{m.coinReward} coins</p><p>Status: {m.completed ? '✅ Completed' : '⬜ Not completed'}</p><button disabled={m.completed} onClick={() => { setMoneyLabMission(moneyLabChild, m.id); submitMoneyLab(); }}>Submit</button></article>)}</div><article className="big-card"><h3>Savings Goal Card</h3><p>Goal rewards: Bubble tea, DoorDash, Movie, Restaurant with mom/dad, Starbucks card, Apple gift card, PlayStation card.</p><p>Feedback: {state.moneyLab.feedback}</p><p>Coin progress bar: {Math.min(100, Math.round((state.children[moneyLabChild].coins / 500) * 100))}% toward PlayStation card</p></article></section>}
      {state.activeTab === 'Parent' && <section><h2>Parent Dashboard</h2>{['alex', 'katya'].map((k) => <article key={k} className="big-card"><h3>{state.children[k].name}</h3><p>Minutes: {state.children[k].minutesToday} | Missions: {state.children[k].missionsCompletedToday}</p><p>XP today: {state.children[k].statsToday.xpEarned} | Coins today: {state.children[k].statsToday.coinsEarned}</p><p>Accuracy: {state.children[k].accuracy}% | Corrections: {state.children[k].mistakesCorrected}</p><button onClick={() => momBonus(k)}>Mom Bonus +25 coins</button></article>)}
        <h3>Money Lab Progress</h3><ul>{['alex', 'katya'].map((k) => <li key={k}>{state.children[k].name}: completed {state.moneyLab.byChild[k].completedCount}/7, skills: {state.moneyLab.byChild[k].skills.join(', ') || 'none'}, money choices: {state.moneyLab.byChild[k].savingChoices.join(', ') || 'none'}, next lesson: {state.moneyLab.byChild[k].completedCount < 3 ? 'Needs vs Wants + Saving basics' : 'Budgeting and delivery fees'}.</li>)}</ul>
        <h3>Reward Requests</h3><ul>{state.rewardRequests.map((r) => <li key={r.id}>{r.child} - {r.reward} ({r.cost}) [{r.status}] {r.status === 'Pending Parent Approval' && <><button onClick={() => parentDecision(r.id, true)}>Approve</button><button onClick={() => parentDecision(r.id, false)}>Decline</button></>}</li>)}</ul>
        <h3>Daily Report</h3><textarea value={dailyReport} readOnly rows={4} style={{ width: '100%' }} /><button onClick={() => navigator.clipboard.writeText(dailyReport)}>Copy Report</button>
        <div><button onClick={resetToday}>Reset Today</button><button onClick={() => window.confirm('Reset all progress?') && resetAll()}>Reset All Progress</button><button onClick={exportJson}>Export Progress JSON</button></div>
        <textarea value={state.importText} onChange={(e) => persist({ ...state, importText: e.target.value })} rows={4} placeholder="Paste progress JSON" style={{ width: '100%' }} /><button onClick={importJson}>Import Progress JSON</button>
      </section>}
    </main><div className="card">Selected child: {selected} | Active tab: {state.activeTab} | Active mission: {state.activeMission ? 'yes' : 'no'}</div></div>;
}

