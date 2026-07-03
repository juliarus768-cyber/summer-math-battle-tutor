import { useEffect, useMemo, useState } from 'react';
import './styles.css';

const STORAGE_KEY = 'justDoItBeDone.game.v2';
const todayKey = () => new Date().toISOString().slice(0, 10);
const now = () => new Date();
const childProfiles = {
  alex: { id: 'alex', name: 'Alex', age: 12, grade: 'Grade 8 Prep', avatar: '🧢', archetype: 'Strategy Captain', accent: 'cyan', weakAreas: ['fractions', 'integers', 'algebra readiness', 'paragraph evidence'] },
  katya: { id: 'katya', name: 'Katya', age: 10, grade: 'Grade 5 Prep', avatar: '🌸', archetype: 'Mystery Explorer', accent: 'pink', weakAreas: ['multiplication', 'division', 'French vocabulary', 'reading details'] }
};
const categoryMeta = {
  'Mission Map': { icon: '🗺️', label: 'Today’s Mission Map' },
  'Morning Launch': { icon: '🚀', label: 'Morning Launch' },
  'Brain Missions': { icon: '🧠', label: 'Brain Missions' },
  'Home Missions': { icon: '🏠', label: 'Home Missions' },
  'Life Missions': { icon: '💬', label: 'Life Missions' },
  'Outside Missions': { icon: '🌲', label: 'Outside Missions' },
  'Bonus Missions': { icon: '⭐', label: 'Bonus Missions' },
  'Boss Battle': { icon: '👾', label: 'Boss Battle' },
  'Reward Shop': { icon: '🛒', label: 'Reward Shop' },
  'Weekly Freedom': { icon: '🏆', label: 'Weekly Freedom' }
};
const requiredCategories = ['Morning Launch', 'Brain Missions', 'Home Missions', 'Life Missions', 'Outside Missions'];
const rewardCatalog = [
  { id: 'gaming', icon: '🎮', title: 'Gaming Time', story: 'Unlock a focused 30-minute game session.', cost: 60, tokens: 0, rarity: 'Common' },
  { id: 'bedtime', icon: '🌙', title: 'Bedtime Extension', story: 'Stay up a little later on an approved night.', cost: 160, tokens: 1, rarity: 'Rare' },
  { id: 'cash', icon: '💵', title: '$2', story: 'Convert earned responsibility into real money.', cost: 120, tokens: 0, rarity: 'Rare' },
  { id: 'bubble', icon: '🧋', title: 'Bubble Tea', story: 'A sweet victory drink after a strong week.', cost: 220, tokens: 0, rarity: 'Epic' },
  { id: 'doordash', icon: '🚚', title: 'DoorDash', story: 'Big convenience reward. Spend wisely.', cost: 520, tokens: 2, rarity: 'Epic' },
  { id: 'starbucks', icon: '☕', title: 'Starbucks', story: 'Pick a drink or snack with parent approval.', cost: 260, tokens: 0, rarity: 'Rare' },
  { id: 'ps', icon: '🕹️', title: 'PlayStation Credit', story: 'Save up for a serious gamer reward.', cost: 850, tokens: 3, rarity: 'Legendary' },
  { id: 'apple', icon: '🍎', title: 'Apple Credit', story: 'A high-value tech reward for long-term saving.', cost: 850, tokens: 3, rarity: 'Legendary' },
  { id: 'friday', icon: '🍕', title: 'Choose Friday Takeout', story: 'Become the family food captain for Friday.', cost: 430, tokens: 1, rarity: 'Epic' },
  { id: 'breakfast', icon: '🥞', title: 'Pick Breakfast', story: 'Choose a special breakfast at home.', cost: 80, tokens: 0, rarity: 'Common' },
  { id: 'lunch-home', icon: '🥪', title: 'Pick Lunch at Home', story: 'Design the lunch menu from approved options.', cost: 90, tokens: 0, rarity: 'Common' },
  { id: 'skip', icon: '🏖️', title: 'Skip Day', story: 'Very expensive. One approved recovery day off.', cost: 1500, tokens: 6, rarity: 'Mythic' }
];
const dayIndex = () => now().getDay();
const uid = (prefix = 'm') => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
const clone = value => structuredClone(value);

function mission({ category, title, story, instruction, success, verify, minutes, xp, coins, required = true, choices, bestAnswer, explanation, phrase, link = '' }) {
  return { id: uid('task'), category, title, story, instruction, success, verify, minutes, xp, coins, required, choices, bestAnswer, explanation, phrase, link, status: 'open', answer: '', parentNote: '' };
}
function morningMissions() {
  const items = [
    ['Launch Pad Bed Reset', 'Your room is the first base of the day. A made bed tells your brain the mission has started.', 'Pull up blanket, fix pillow, and clear anything that does not belong on the bed.', 'Bed is made and floor beside bed is clear.'],
    ['Fresh Start Tooth Shield', 'Activate clean-breath mode before school prep begins.', 'Brush teeth for two minutes. Rinse sink after.', 'Teeth brushed and sink left clean.'],
    ['Hair Ready Checkpoint', 'Get camera-ready for the day without a parent reminder.', 'Brush hair or style it neatly.', 'Hair is brushed and ready to go.'],
    ['Outfit Armor Equipped', 'Choose clothes that match weather and the day plan.', 'Get dressed and put pajamas/laundry away.', 'Dressed, pajamas away, dirty clothes in hamper.'],
    ['Breakfast Dock Clear', 'Finish the launch sequence by clearing the food station.', 'Bring dishes to kitchen and wipe your spot if needed.', 'Dishes cleared and eating space reset.']
  ];
  return items.map(([title, story, instruction, success]) => mission({ category: 'Morning Launch', title, story, instruction, success, verify: 'parent approval', minutes: 3, xp: 8, coins: 2 }));
}
function alexBrain(day) {
  const set = [
    mission({ category: 'Brain Missions', title: 'Fraction Boss Battle: Pizza Party', story: 'The team ordered 3 pizzas. Alex ate 3/8 of one pizza, Katya ate 1/4, and Mom saved 2/8 for later. Who ate more?', instruction: 'Compare 3/8 and 1/4. Show your thinking using equivalent fractions.', success: 'Answer names who ate more and explains why.', verify: 'AI check', minutes: 8, xp: 40, coins: 10 }),
    mission({ category: 'Brain Missions', title: 'Integer Arena: Temperature Drop', story: 'A winter game level starts at -3°C. Overnight it drops 7°C, then warms by 4°C.', instruction: 'Calculate the final temperature and show the integer steps.', success: 'Correct final temperature with signed-number reasoning.', verify: 'AI check', minutes: 7, xp: 35, coins: 9 }),
    mission({ category: 'Brain Missions', title: 'Algebra Unlock: Solve the Gate', story: 'A locked door shows 3x + 5 = 26. Only the cleanest steps open it.', instruction: 'Solve for x and write each inverse operation.', success: 'x is correct and steps undo +5 then ×3.', verify: 'AI check', minutes: 8, xp: 40, coins: 10 }),
    mission({ category: 'Brain Missions', title: 'Percent Power-Up: Discount Code', story: 'A $40 controller skin is 25% off. The shop tries to distract you with flashy ads.', instruction: 'Find the sale price and explain whether it is worth buying now or saving.', success: 'Discount and sale price are correct with one money choice.', verify: 'AI check', minutes: 8, xp: 38, coins: 10 }),
    mission({ category: 'Brain Missions', title: 'Evidence Sniper: Reading Comprehension', story: 'Good readers do not just guess; they collect proof like clues.', instruction: 'Read a short article or chapter page. Write the main idea and one detail that proves it.', success: 'Includes a main idea and a specific supporting detail.', verify: 'AI check', minutes: 10, xp: 36, coins: 9 }),
    mission({ category: 'Brain Missions', title: 'Paragraph Builder: Claim + Proof', story: 'Build a paragraph like a base: claim, evidence, explanation, closing.', instruction: 'Write 5 sentences answering: Should screen time be earned after responsibilities?', success: 'Has a clear opinion, at least one reason, and a closing sentence.', verify: 'AI check', minutes: 12, xp: 42, coins: 11 })
  ];
  return [set[day % set.length], set[(day + 2) % set.length], scienceMission('alex', day), financeMission('alex', day)];
}
function katyaBrain(day) {
  const set = [
    mission({ category: 'Brain Missions', title: 'Multiplication Mystery: Gem Vaults', story: 'Six Roblox vaults each hold 8 gems. The code opens only if the total is right.', instruction: 'Solve 6 × 8 and write a related division fact.', success: 'Correct product and one matching division fact.', verify: 'AI check', minutes: 7, xp: 34, coins: 8 }),
    mission({ category: 'Brain Missions', title: 'Division Detective: Sticker Packs', story: 'A mystery box has 45 stickers split equally into 5 packs.', instruction: 'Find stickers per pack and explain how multiplication can check it.', success: 'Correct division answer and multiplication check.', verify: 'AI check', minutes: 7, xp: 34, coins: 8 }),
    mission({ category: 'Brain Missions', title: 'Fraction Quest: Cake Slices', story: 'A cake is cut into 8 slices. Katya eats 2/8 and saves 3/8 for later.', instruction: 'How much cake is eaten and saved together? Simplify if you can.', success: 'Adds fractions with same denominator and simplifies if possible.', verify: 'AI check', minutes: 8, xp: 36, coins: 9 }),
    mission({ category: 'Brain Missions', title: 'Elapsed Time Portal', story: 'The portal opens at 3:20 PM and closes at 4:05 PM.', instruction: 'Calculate how long the portal stays open.', success: 'Correct elapsed time with a number line or counting strategy.', verify: 'AI check', minutes: 7, xp: 35, coins: 9 }),
    mission({ category: 'Brain Missions', title: 'French Café Code', story: 'A tiny Paris café needs polite words before it serves hot chocolate.', instruction: 'Write hello, please, thank you, and goodbye in French. Add one sentence if you can.', success: 'At least 4 correct French words.', verify: 'AI check', minutes: 8, xp: 36, coins: 9 }),
    mission({ category: 'Brain Missions', title: 'Reading Clue Collector', story: 'Every paragraph hides a clue. Your job is to catch the important one.', instruction: 'Read one page. Write the main character, problem, and one clue/detail.', success: 'Includes character, problem, and a real detail from reading.', verify: 'AI check', minutes: 10, xp: 36, coins: 9 })
  ];
  return [set[day % set.length], set[(day + 3) % set.length], scienceMission('katya', day), financeMission('katya', day)];
}
function scienceMission(child, day) {
  const topics = child === 'alex'
    ? ['Forces and motion in sports', 'Cells and body systems', 'Heat transfer in real life', 'Ecosystems and food webs']
    : ['Simple machines around home', 'Animal habitats', 'States of matter', 'Weather and clouds'];
  return mission({ category: 'Brain Missions', title: `Science Video Lab: ${topics[day % topics.length]}`, story: 'Watch like a scientist, not like a zombie. Your mission is to collect proof.', instruction: 'Watch a parent-approved 6–10 minute YouTube-style science video. Answer: 1) What was the main idea? 2) Name two facts. 3) What is one question you still have?', success: 'Three thoughtful answers after watching.', verify: 'AI check', minutes: 12, xp: 38, coins: 10, link: 'Parent adds safe link in dashboard' });
}
function financeMission(child, day) {
  const alex = [
    ['DoorDash vs Homemade Lunch', 'A DoorDash lunch costs $18 + $3 delivery + $2 tip. Homemade lunch costs $5.', 'Find both totals and how much money homemade lunch saves.', 'Correct totals and savings amount.'],
    ['Gift Card Budget Grind', 'You want a $25 PlayStation card. You have $11 saved and earn $4 per bonus chore.', 'How many bonus chores do you need? Explain.', 'Correct remaining amount and chores needed.'],
    ['Tax and Tip Mini-Boss', 'A snack is $12. Tax is about 13% and tip is $2.', 'Estimate the final cost and decide if it fits a $16 budget.', 'Reasonable estimate and budget decision.']
  ];
  const katya = [
    ['Bubble Tea Budget', 'Bubble tea costs $7. You have $10 and want to save some coins too.', 'How much is left after buying one? Is it a need or a want?', 'Correct change and need/want choice.'],
    ['Compare the Cute Deals', 'Sticker pack A costs $6 for 12 stickers. Pack B costs $4 for 6 stickers.', 'Which pack gives more stickers for each dollar?', 'Correct comparison with simple reasoning.'],
    ['Save or Spend Choice', 'You can spend $5 now on candy or save it toward a $20 gift card.', 'How much more would you need if you save the $5?', 'Correct remaining amount and a saving choice.']
  ];
  const [title, story, instruction, success] = (child === 'alex' ? alex : katya)[day % 3];
  return mission({ category: 'Brain Missions', title: `Finance Mission: ${title}`, story, instruction, success, verify: 'AI check', minutes: 8, xp: 36, coins: 10 });
}
function homeMissions(child, day) {
  const daily = [
    mission({ category: 'Home Missions', title: '10-Minute Room Reset', story: 'Your room is a mini base. Reset it before it becomes a boss fight.', instruction: 'Set a 10-minute timer. Clothes to laundry, garbage to garbage, dishes to kitchen, desk cleared.', success: 'Room visibly reset; before/after photo or Mom approval.', verify: 'parent approval', minutes: 10, xp: 25, coins: 5 }),
    mission({ category: 'Home Missions', title: 'Dish Dock Assist', story: 'The kitchen dock gets overloaded unless the crew clears it fast.', instruction: 'Clear your dishes and help load or unload 5 dishwasher items.', success: 'Dishes cleared and dishwasher help completed.', verify: 'parent approval', minutes: 6, xp: 18, coins: 4 }),
    mission({ category: 'Home Missions', title: child === 'alex' ? 'Vacuum Zone Patrol' : 'Front Entrance Shoe Sort', story: 'A clean path gives the whole family more calm.', instruction: child === 'alex' ? 'Vacuum one assigned area carefully.' : 'Line up shoes, move extras, and clear the entrance path.', success: 'Assigned zone looks clean and walkable.', verify: 'parent approval', minutes: 8, xp: 22, coins: 5 })
  ];
  return [daily[day % daily.length], daily[(day + 1) % daily.length]];
}
function lifeMission(child, day) {
  const scenarios = [
    ['Charger Conflict', 'Your sibling took the charger you were using. You feel angry. What do you do first?', ['Yell and grab it back', 'Take a breath and ask when they will be done', 'Hide their tablet', 'Complain for 20 minutes'], 'Take a breath and ask when they will be done', 'You can stand up for yourself without starting a fight.', 'Can I have it back in 10 minutes? I was using it.'],
    ['Friend Ignores You', 'You say hi and your friend does not answer. Your brain says, “They hate me.” What is the best next move?', ['Send 10 angry messages', 'Assume there may be another reason and ask later', 'Tell everyone they are mean', 'Ignore them forever'], 'Assume there may be another reason and ask later', 'One moment does not prove the whole story.', 'Hey, I said hi earlier. Are we okay?'],
    ['Lost the Game', 'You lose a close game and feel like throwing the controller.', ['Throw it', 'Call everyone cheaters', 'Put it down, breathe, and say good game', 'Quit every game forever'], 'Put it down, breathe, and say good game', 'Calm control is a gamer skill too.', 'I’m frustrated, but good game. I need a minute.'],
    ['Corrected by Parent', 'Mom corrects your chore. You feel embarrassed and annoyed.', ['Argue immediately', 'Say “fine” and stomp away', 'Ask what needs fixing and finish it', 'Pretend you did not hear'], 'Ask what needs fixing and finish it', 'Fixing the last 10% earns trust faster.', 'What part should I fix first?'],
    ['More Screen Time', 'Your timer ends but you want one more round.', ['Sneak extra time', 'Ask for the rule and accept the answer', 'Beg for 30 minutes', 'Say chores are pointless'], 'Ask for the rule and accept the answer', 'Accepting no calmly builds future trust.', 'Can I finish this round, or should I stop now?']
  ];
  const [title, story, choices, bestAnswer, explanation, phrase] = scenarios[(day + (child === 'alex' ? 0 : 2)) % scenarios.length];
  return mission({ category: 'Life Missions', title: `Real-Life Choice: ${title}`, story, instruction: 'Pick the best answer. Then type the practical phrase once.', success: 'Best choice selected and phrase practiced.', verify: 'quiz', minutes: 4, xp: 24, coins: 7, choices, bestAnswer, explanation, phrase });
}
function outsideMission(child, day) {
  const ideas = [
    ['Nature Photo Quest', 'Go outside and collect proof that the world is bigger than a screen.', 'Spend 25–30 minutes outside and take 3 nature photos or describe 3 things you noticed.', 'Outside time completed with 3 observations.'],
    ['Energy Walk Loop', 'Your body battery charges by moving, not scrolling.', 'Take a 30-minute walk, bike ride, playground session, or family walk.', 'Parent confirms time outside.'],
    ['Sport Skill Rep', 'Practice makes the next game less stressful.', 'Do 20 minutes of a sport skill: shooting, passing, biking, running, or stretching.', 'Parent confirms practice or child records what skill improved.']
  ];
  const [title, story, instruction, success] = ideas[(day + (child === 'alex' ? 1 : 0)) % ideas.length];
  return mission({ category: 'Outside Missions', title, story, instruction, success, verify: 'parent approval', minutes: 30, xp: 30, coins: 8 });
}
function bonusMissions(child, day) {
  return [
    mission({ category: 'Bonus Missions', title: 'Mom Needs Help: Surprise Assist', story: 'A rare bonus mission appears when the household needs a teammate.', instruction: ['Fold laundry together', 'Help make dinner', 'Organize pantry shelf', 'Carry groceries', 'Clean balcony'][day % 5], success: 'Mom confirms helpful attitude and completed job.', verify: 'parent approval', minutes: 15, xp: 45, coins: 15, required: false }),
    mission({ category: 'Bonus Missions', title: 'Cooking Skill Unlock', story: 'Life simulator upgrade: make something useful with your own hands.', instruction: child === 'alex' ? 'Make eggs, a sandwich, salad, or help with dinner. Clean your station after.' : 'Make breakfast, a sandwich, pancakes with help, or help wash fruit. Clean your station after.', success: 'Food made safely and kitchen reset.', verify: 'parent approval', minutes: 20, xp: 35, coins: 12, required: false })
  ];
}
function bossBattle(child) {
  return mission({ category: 'Boss Battle', title: child === 'alex' ? 'Weekly Boss: Algebra + Responsibility Gauntlet' : 'Weekly Boss: Math Mystery + Responsibility Gauntlet', story: 'The weekend Freedom Gate opens only when the weekly boss is defeated.', instruction: child === 'alex' ? 'Complete one algebra problem, one reading proof, and one major home reset by Friday 8:30 PM.' : 'Complete one multiplication/division puzzle, one reading clue, and one major home reset by Friday 8:30 PM.', success: 'All boss parts are complete before Friday 8:30 PM.', verify: 'parent approval', minutes: 30, xp: 90, coins: 25, required: false });
}
function dailyPlan(child) {
  const day = dayIndex();
  return [...morningMissions(), ...(child === 'alex' ? alexBrain(day) : katyaBrain(day)), ...homeMissions(child, day), lifeMission(child, day), outsideMission(child, day), ...bonusMissions(child, day), bossBattle(child)];
}
function initialState() {
  return { date: todayKey(), screen: 'profiles', activeChild: 'alex', activeCategory: 'Mission Map', rewards: rewardCatalog, weeklyReports: [], children: Object.fromEntries(Object.keys(childProfiles).map(id => [id, { level: 1, xp: 0, coins: 0, tokens: 0, streak: 0, history: {}, plans: { [todayKey()]: dailyPlan(id) }, purchases: [] }])) };
}
function normalize(saved) {
  const base = initialState();
  if (!saved || saved.date !== todayKey()) return base;
  return { ...base, ...saved, rewards: saved.rewards?.length ? saved.rewards : rewardCatalog, children: { ...base.children, ...saved.children } };
}
const required = tasks => tasks.filter(t => t.required);
const done = tasks => tasks.filter(t => t.status === 'done');
const requiredRemaining = tasks => required(tasks).filter(t => t.status !== 'done').length;
const freedomPercent = tasks => Math.round((done(required(tasks)).length / Math.max(1, required(tasks).length)) * 100);
const isBefore830 = () => now().getHours() < 20 || (now().getHours() === 20 && now().getMinutes() <= 30);
const perfectWeek = child => {
  const weekdays = Object.values(child.history || {}).filter(d => d.weekday >= 1 && d.weekday <= 5);
  return weekdays.length >= Math.min(5, Math.max(1, dayIndex())) && weekdays.every(d => d.requiredDone && d.doneBefore830);
};

export default function App() {
  const [state, setState] = useState(() => normalize(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')));
  const [draftReward, setDraftReward] = useState('');
  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(state)), [state]);
  const profile = childProfiles[state.activeChild];
  const child = state.children[state.activeChild];
  const tasks = child.plans[state.date] || [];
  const percent = freedomPercent(tasks);
  const unlocked = percent >= 100;
  const todayEarned = tasks.filter(t => t.status === 'done').reduce((acc, t) => ({ xp: acc.xp + t.xp, coins: acc.coins + t.coins }), { xp: 0, coins: 0 });
  const bonusCount = tasks.filter(t => !t.required && t.status !== 'done').length;
  const mutate = fn => setState(s => { const n = clone(s); fn(n); return n; });
  const switchChild = id => mutate(n => { n.activeChild = id; n.screen = 'child'; n.activeCategory = 'Mission Map'; });
  const updateHistory = (n, id) => { const plan = n.children[id].plans[n.date] || []; n.children[id].history[n.date] = { requiredDone: requiredRemaining(plan) === 0, doneBefore830: requiredRemaining(plan) === 0 && isBefore830(), weekday: dayIndex() }; };
  const completeTask = (taskId, id = state.activeChild) => mutate(n => { const c = n.children[id]; const task = c.plans[n.date].find(t => t.id === taskId); if (!task || task.status === 'done') return; task.status = 'done'; c.xp += task.xp; c.coins += task.coins; c.level = 1 + Math.floor(c.xp / 300); if (!task.required && task.category === 'Boss Battle') c.tokens += 2; if (!task.required && task.category === 'Bonus Missions') c.tokens += 1; updateHistory(n, id); });
  const setAnswer = (taskId, value) => mutate(n => { const task = n.children[n.activeChild].plans[n.date].find(t => t.id === taskId); if (task) task.answer = value; });
  const quizPick = (task, choice) => { setAnswer(task.id, choice); if (choice === task.bestAnswer) completeTask(task.id); else alert('Not the strongest move yet. Try the calm, responsible choice.'); };
  async function aiCheck(task) {
    if (!String(task.answer || '').trim()) return alert('Type your answer first.');
    try { const r = await fetch('/api/ai/check-answer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ child: profile, task, answer: task.answer }) }); const data = await r.json(); if (data.correct) completeTask(task.id); else alert(data.feedback || 'Add one more detail and try again.'); }
    catch { if (task.answer.trim().length > 8) completeTask(task.id); else alert('Mock checker: add a fuller answer.'); }
  }
  const spend = reward => mutate(n => { const c = n.children[n.activeChild]; if (c.coins < reward.cost || c.tokens < reward.tokens) return; c.coins -= reward.cost; c.tokens -= reward.tokens; c.purchases.unshift({ reward: reward.title, date: n.date }); alert(`${reward.title} requested. Parent approval still applies.`); });
  const resetDay = () => setState(initialState());
  const addReward = () => { if (!draftReward.trim()) return; mutate(n => n.rewards.push({ id: uid('reward'), icon: '✨', title: draftReward.trim(), story: 'Custom family reward.', cost: 100, tokens: 0, rarity: 'Custom' })); setDraftReward(''); };
  async function weeklyReport() { let summary = 'Strong week summary: celebrate completed missions, recover missed responsibilities, and keep freedom tied to responsibility.'; try { const r = await fetch('/api/ai/weekly-report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state.children) }); summary = (await r.json()).summary || summary; } catch {} mutate(n => n.weeklyReports.unshift({ date: n.date, summary })); }

  if (state.screen === 'profiles') return <ProfileSelect switchChild={switchChild} openParent={() => mutate(n => n.screen = 'parent')} />;
  return <main className="game-shell">
    <TopBar state={state} mutate={mutate} unlocked={unlocked} />
    {state.screen === 'parent'
      ? <ParentDashboard state={state} mutate={mutate} completeTask={completeTask} resetDay={resetDay} weeklyReport={weeklyReport} draftReward={draftReward} setDraftReward={setDraftReward} addReward={addReward} />
      : <><Hero profile={profile} child={child} percent={percent} unlocked={unlocked} todayEarned={todayEarned} remaining={requiredRemaining(tasks)} bonusCount={bonusCount} mutate={mutate} />
        <CategoryNav active={state.activeCategory} setActive={cat => mutate(n => n.activeCategory = cat)} />
        {unlocked && <FreedomCelebration />}
        {state.activeCategory === 'Reward Shop' ? <RewardShop rewards={state.rewards} child={child} spend={spend} /> : state.activeCategory === 'Weekly Freedom' ? <WeeklyFreedom state={state} /> : <MissionBoard active={state.activeCategory} tasks={tasks} completeTask={completeTask} aiCheck={aiCheck} quizPick={quizPick} setAnswer={setAnswer} />}
      </>}
  </main>;
}
function ProfileSelect({ switchChild, openParent }) { return <main className="profile-screen"><section className="profile-hero"><div className="logo-orb">⚡</div><p className="eyebrow">Family Mission Control</p><h1>Just Do It<br/>and Be Done</h1><p>Freedom is earned through responsibility.</p><strong>Сделал дело — гуляй смело.</strong></section><section className="profile-grid">{Object.values(childProfiles).map(c => <button key={c.id} className={`profile-card ${c.accent}`} onClick={() => switchChild(c.id)}><span className="avatar">{c.avatar}</span><span className="badge">{c.archetype}</span><h2>{c.name}</h2><p>{c.age} • {c.grade}</p><i>Open mission dashboard →</i></button>)}<button className="profile-card parent-card" onClick={openParent}><span className="avatar">🛡️</span><span className="badge">Command Center</span><h2>Parent Dashboard</h2><p>Approvals, weekly freedom, rewards, resets.</p><i>Open controls →</i></button></section></main>; }
function TopBar({ state, mutate, unlocked }) { return <nav className="topbar"><button onClick={() => mutate(n => n.screen = 'profiles')}>⌂ Profiles</button><strong>⚡ Just Do It and Be Done</strong><button onClick={() => mutate(n => n.screen = 'parent')}>Parent</button><span className={unlocked ? 'state-chip open' : 'state-chip'}>{unlocked ? 'Freedom Unlocked' : 'Freedom Locked'}</span></nav>; }
function Hero({ profile, child, percent, unlocked, todayEarned, remaining, bonusCount, mutate }) { return <header className={`command-hero ${profile.accent}`}><div className="avatar-ring"><span>{profile.avatar}</span><b>LV {child.level}</b></div><div className="hero-copy"><p className="eyebrow">{profile.name} • {profile.grade} • {profile.archetype}</p><h1>{unlocked ? 'Freedom Unlocked!' : 'Today’s Freedom Gate'}</h1><p>{unlocked ? 'Сделал дело — гуляй смело. Just do it and be done.' : 'This is not punishment. It is the challenge map that unlocks screens, rewards, and calmer evenings.'}</p><button onClick={() => mutate(n => n.activeCategory = 'Reward Shop')}>🛒 Reward Shop Shortcut</button></div><div className="freedom-console"><div className="meter" style={{ '--pct': `${percent}%` }}><span>{percent}%</span></div><div className="stat-grid"><Stat label="XP today" value={todayEarned.xp} /><Stat label="Coins today" value={`🪙 ${todayEarned.coins}`} /><Stat label="Streak" value={`🔥 ${child.streak}`} /><Stat label="Required left" value={remaining} /><Stat label="Bonus live" value={bonusCount} /><Stat label="Tokens" value={`🎟️ ${child.tokens}`} /></div></div></header>; }
function Stat({ label, value }) { return <article className="mini-stat"><b>{value}</b><span>{label}</span></article>; }
function CategoryNav({ active, setActive }) { return <div className="category-nav">{Object.entries(categoryMeta).map(([key, meta]) => <button key={key} className={active === key ? 'active' : ''} onClick={() => setActive(key)}><span>{meta.icon}</span>{meta.label}</button>)}</div>; }
function FreedomCelebration() { return <section className="freedom-burst"><div>🎉</div><h2>Freedom Unlocked!</h2><p>Сделал дело — гуляй смело. Just do it and be done.</p></section>; }
function MissionBoard({ active, tasks, completeTask, aiCheck, quizPick, setAnswer }) { const visible = active === 'Mission Map' ? tasks : tasks.filter(t => t.category === active); return <section className="mission-board"><div className="board-title"><h2>{categoryMeta[active]?.icon} {categoryMeta[active]?.label || active}</h2><p>{done(visible).length}/{visible.length} missions cleared</p></div><div className="mission-grid">{visible.map(task => <MissionCard key={task.id} task={task} completeTask={completeTask} aiCheck={aiCheck} quizPick={quizPick} setAnswer={setAnswer} />)}</div></section>; }
function MissionCard({ task, completeTask, aiCheck, quizPick, setAnswer }) { const doneTask = task.status === 'done'; return <article className={`mission-card ${doneTask ? 'complete' : ''} ${task.required ? 'required' : 'bonus'}`}><div className="card-top"><span>{categoryMeta[task.category]?.icon}</span><b>{task.required ? 'Required' : 'Bonus'}</b></div><h3>{task.title}</h3><p className="story">{task.story}</p><div className="instruction"><strong>Mission:</strong> {task.instruction}</div><ul><li>⏱️ {task.minutes} min</li><li>⚡ {task.xp} XP</li><li>🪙 {task.coins} coins</li><li>✅ {task.verify}</li></ul><p className="success"><strong>Success:</strong> {task.success}</p>{task.link && <p className="link-note">🔗 {task.link}</p>}{task.choices ? <div className="choice-grid">{task.choices.map(choice => <button disabled={doneTask} className={task.answer === choice ? 'picked' : ''} onClick={() => quizPick(task, choice)} key={choice}>{choice}</button>)}</div> : task.verify === 'AI check' ? <textarea disabled={doneTask} placeholder="Type answer + thinking for AI coach..." value={task.answer} onChange={e => setAnswer(task.id, e.target.value)} /> : null}{task.phrase && <p className="phrase">Phrase to use: “{task.phrase}”</p>}{task.explanation && task.answer === task.bestAnswer && <p className="explain">{task.explanation}</p>}<div className="card-actions">{doneTask ? <span className="cleared">✓ Cleared</span> : task.verify === 'AI check' ? <button onClick={() => aiCheck(task)}>AI Check</button> : task.verify === 'quiz' ? <span className="quiz-hint">Pick the best move</span> : <button onClick={() => completeTask(task.id)}>Parent Approve</button>}</div></article>; }
function RewardShop({ rewards, child, spend }) { return <section className="shop"><div className="board-title"><h2>🛒 Reward Shop</h2><p>Wallet: 🪙 {child.coins} coins • 🎟️ {child.tokens} tokens</p></div><div className="shop-grid">{rewards.map(r => <article className={`shop-card ${child.coins >= r.cost && child.tokens >= r.tokens ? 'can-buy' : ''}`} key={r.id}><span>{r.icon}</span><b>{r.rarity}</b><h3>{r.title}</h3><p>{r.story}</p><strong>{r.cost} coins {r.tokens ? `+ ${r.tokens} tokens` : ''}</strong><button disabled={child.coins < r.cost || child.tokens < r.tokens} onClick={() => spend(r)}>Request Reward</button></article>)}</div></section>; }
function WeeklyFreedom({ state }) { return <section className="mission-board"><div className="board-title"><h2>🏆 Weekly Freedom Status</h2><p>Perfect Week = Monday–Friday required tasks complete before 8:30 PM.</p></div><div className="weekly-grid">{Object.entries(state.children).map(([id, child]) => <article key={id} className="weekly-card"><h3>{childProfiles[id].avatar} {childProfiles[id].name}</h3><b>{perfectWeek(child) ? '🏆 Perfect Week active: Saturday/Sunday Freedom Days' : '🔒 Recovery missions appear if the week is missed'}</b><p>If perfect: no mandatory learning/chores except hygiene, bedtime 11 PM. If not: finish recovery missions first.</p></article>)}</div></section>; }
function ParentDashboard({ state, mutate, completeTask, resetDay, weeklyReport, draftReward, setDraftReward, addReward }) { return <section className="parent-dashboard"><div className="board-title"><h1>🛡️ Parent Dashboard</h1><p>Approve real-world missions, manage rewards, generate summaries.</p></div><div className="parent-actions"><button onClick={resetDay}>Reset day/week</button><button onClick={weeklyReport}>Generate weekly summary</button><button onClick={() => mutate(n => n.screen = 'child')}>Back to child view</button></div>{Object.entries(state.children).map(([id, child]) => { const tasks = child.plans[state.date] || []; return <article className="parent-child" key={id}><h2>{childProfiles[id].avatar} {childProfiles[id].name}</h2><div className="parent-stats"><Stat label="Freedom Meter" value={`${freedomPercent(tasks)}%`} /><Stat label="Required left" value={requiredRemaining(tasks)} /><Stat label="Coins" value={`🪙 ${child.coins}`} /><Stat label="XP" value={child.xp} /></div><div className="approval-list">{tasks.filter(t => t.verify === 'parent approval' && t.status !== 'done').map(t => <button key={t.id} onClick={() => completeTask(t.id, id)}>Approve {t.title}</button>)}</div></article>; })}<section className="reward-admin"><h2>Reward controls</h2><input value={draftReward} onChange={e => setDraftReward(e.target.value)} placeholder="New reward name" /><button onClick={addReward}>Add reward</button>{state.rewards.map(r => <button key={r.id} onClick={() => mutate(n => n.rewards = n.rewards.filter(x => x.id !== r.id))}>Remove {r.title}</button>)}</section><section className="reports"><h2>Weekly Reports</h2>{state.weeklyReports.map(r => <p key={r.date}><b>{r.date}</b>: {r.summary}</p>)}</section></section>; }
