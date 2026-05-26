import React, { useMemo, useState } from 'react';

const STORAGE_KEY = 'summerMathBattleTutorStateV2';
const todayKey = () => new Date().toISOString().slice(0, 10);
const tabs = ['Home', 'Missions', 'Battle', 'Practice', 'Money Lab', 'Store', 'Grant Prize', 'Parent'];
const missionNames = ['Speed Round', 'Logic Battle', 'Money Lab', 'Mystery Case', 'Boss Battle', 'Streak Saver'];

const safeClone = (v) => JSON.parse(JSON.stringify(v));
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

const rewards = [
  ['🍫', 'Chocolate', 40, 'Common'], ['🎵', 'Pick music in the car', 55, 'Common'], ['🧋', 'Bubble tea', 80, 'Rare'],
  ['🍜', 'Pick takeout', 120, 'Rare'], ['🚚', 'DoorDash delivery', 140, 'Epic'], ['🍽️', 'Restaurant with mom', 180, 'Epic'],
  ['🍔', 'Restaurant with dad', 180, 'Epic'], ['🎬', 'Movie', 220, 'Legendary'], ['🧗', 'Rock climbing', 260, 'Legendary'],
  ['☕', 'Starbucks card', 300, 'Mythic'], ['🍎', 'Apple gift card', 450, 'Mythic'], ['🎮', 'PlayStation card', 500, 'Ultra'], ['📱', 'Device day with no classes', 650, 'Ultra']
];

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
    alex: makeChild('Alex', 'Grade 7->8', 7, 320, 500, 180, 'Fractions + BEDMAS', 'Check Before Submit'),
    katya: makeChild('Katya', 'Grade 4->5', 4, 250, 400, 150, 'Subtraction + Facts', 'Clue Finder')
  },
  missions: { alex: [], katya: [] }
};

function genQuestion(child, missionName) {
  if (child === 'alex') {
    if (missionName === 'Speed Round') {
      const a = rand(2, 12), b = rand(2, 12); if (Math.random() < 0.5) return { q: `${a} × ${b}`, a: a * b, hint: `Use ${a} groups of ${b}.`, skill: 'Multiplication recall' };
      return { q: `${a * b} ÷ ${a}`, a: b, hint: `Think: ${a} × ? = ${a * b}`, skill: 'Division recall' };
    }
    if (missionName === 'Logic Battle') {
      const a = rand(2, 8), b = rand(2, 5), c = rand(1, 9); return { q: `${c} + ${a} × ${b}`, a: c + a * b, hint: 'Multiply before adding (BEDMAS).', skill: 'BEDMAS' };
    }
    if (missionName === 'Money Lab') { const p = rand(5, 15), q = rand(2, 6); return { q: `If an item is $${p} and you buy ${q}, what is total?`, a: p * q, hint: 'price × quantity', skill: 'Money multiplication' }; }
    if (missionName === 'Mystery Case') { const n = rand(20, 80), d = rand(2, 9); return { q: `Simplify ${n}/${n * d}. Enter denominator only.`, a: d, hint: 'Divide top and bottom by numerator.', skill: 'Fractions' }; }
    if (missionName === 'Boss Battle') { const a = rand(12, 99), d = rand(2, 9); const n = a - (a % d); return { q: `${n} ÷ ${d}`, a: n / d, hint: 'Use long division.', skill: 'Long division' }; }
    return { q: `(8 + 4) ÷ 2`, a: 6, hint: 'Brackets first.', skill: 'BEDMAS brackets' };
  }
  if (missionName === 'Speed Round') { const a = rand(8, 20), b = rand(1, a - 1); return { q: `${a} - ${b}`, a: a - b, hint: 'Count back carefully.', skill: 'Subtraction within 20' }; }
  if (missionName === 'Logic Battle') { const x = [2, 5, 10, 3, 4, 6][rand(0, 5)], y = rand(2, 9); return { q: `${x} × ${y}`, a: x * y, hint: `Skip count by ${x}.`, skill: 'Multiplication facts' }; }
  if (missionName === 'Money Lab') { const t = rand(10, 30), d = [2, 5][rand(0, 1)]; return { q: `${t} ÷ ${d}`, a: t / d, hint: 'Split equally.', skill: 'Division facts' }; }
  if (missionName === 'Mystery Case') { const suspects = rand(8, 16), clues = rand(2, suspects - 1); return { q: `Mystery: ${suspects} clues found, ${clues} fake. Real clues?`, a: suspects - clues, hint: 'Real = total - fake', skill: 'Word problem' }; }
  if (missionName === 'Boss Battle') { const d = rand(2, 6), q = rand(4, 12); return { q: `${d * q} ÷ ${d}`, a: q, hint: 'Division undoes multiplication.', skill: 'Long division intro' }; }
  return { q: `20 ÷ 5`, a: 4, hint: 'Think 5 × ? = 20', skill: 'Division facts' };
}

const buildMissionsFor = (child) => missionNames.map((name, i) => ({ id: `${child}-${i}`, title: name, difficulty: child === 'alex' ? (i > 3 ? 'Hard' : 'Medium') : (i > 3 ? 'Medium' : 'Easy'), skillFocus: genQuestion(child, name).skill, progress: 0, xpReward: 25 + i * 5, coinReward: 12 + i * 3, completed: false, attempts: 0, correctAnswers: 0, mistakesCorrected: 0 }));

const normalize = (s) => {
  const base = safeClone(defaultState);
  const merged = { ...base, ...s, children: { ...base.children, ...(s?.children || {}) }, missions: { ...base.missions, ...(s?.missions || {}) }, battleScore: { ...base.battleScore, ...(s?.battleScore || {}) }, ui: { ...base.ui, ...(s?.ui || {}) }, grant: { ...base.grant, ...(s?.grant || {}) } };
  if (!Array.isArray(merged.missions.alex) || !merged.missions.alex.length) merged.missions.alex = buildMissionsFor('alex');
  if (!Array.isArray(merged.missions.katya) || !merged.missions.katya.length) merged.missions.katya = buildMissionsFor('katya');
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

  const startMission = (childKey, missionId) => {
    const mission = state.missions[childKey].find((m) => m.id === missionId); if (!mission || mission.completed) return;
    const questions = Array.from({ length: 5 }, () => genQuestion(childKey, mission.title));
    const next = safeClone(state); next.selectedChild = childKey; next.activeMission = { childKey, missionId, questions, index: 0, input: '', feedback: '', localCorrect: 0, localAttempts: 0, localCorrections: 0, secondTry: false }; next.battleScore[childKey] += 1; next.ui.message = `${next.children[childKey].name} mission started.`;
    persist(next);
    setTimeout(() => document.getElementById('active-mission')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  const submitMissionAnswer = () => {
    const next = safeClone(state); const m = next.activeMission; if (!m) return;
    const child = next.children[m.childKey]; const mission = next.missions[m.childKey].find((x) => x.id === m.missionId); const q = m.questions[m.index];
    const ans = Number(String(m.input).trim()); m.localAttempts += 1; mission.attempts += 1; child.statsToday.attempts += 1;
    if (!Number.isNaN(ans) && ans === q.a) {
      const corrected = m.secondTry; m.localCorrect += 1; mission.correctAnswers += 1; mission.progress += 1; child.statsToday.correct += 1; m.feedback = 'Correct! Great work.';
      addXpCoins(next, m.childKey, corrected ? 5 : 8, corrected ? 3 : 5, q.skill);
      if (corrected) { mission.mistakesCorrected += 1; child.mistakesCorrected += 1; child.statsToday.coinsEarned += 0; next.battleScore[m.childKey] += 1; }
      m.secondTry = false; m.input = '';
      if (m.index < 4) m.index += 1;
      else {
        mission.completed = true; child.missionsCompletedToday += 1; child.completedMissions.push(mission.title); child.minutesToday += next.weekendMode ? 8 : 10;
        addXpCoins(next, m.childKey, mission.xpReward, mission.coinReward, mission.skillFocus); next.battleScore[m.childKey] += 2;
        if ((mission.correctAnswers / Math.max(1, mission.attempts)) > 0.8) next.battleScore[m.childKey] += 1;
        if (m.childKey === 'alex') next.battleScore.alex += 1; else next.battleScore.katya += 1;
        if (child.missionsCompletedToday >= 1) child.streak += 0;
        if (child.missionsCompletedToday === 6) { addXpCoins(next, m.childKey, 20, 15, 'Streak bonus'); child.badgesEarned.push('Daily 6/6'); }
        next.ui.message = `${child.name} completed ${mission.title}!`;
        next.activeMission = null;
      }
    } else {
      m.feedback = 'Good try. Let’s fix the step. Hint: ' + q.hint; m.secondTry = true;
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

  const dailyReport = useMemo(() => {
    const a = state.children.alex, k = state.children.katya;
    return `Today Alex practiced ${a.completedMissions.join(', ') || 'warmups'} and earned ${a.statsToday.xpEarned} XP. Today Katya practiced ${k.completedMissions.join(', ') || 'warmups'} and earned ${k.statsToday.xpEarned} XP. Tomorrow focus: Alex fractions/BEDMAS, Katya subtraction/facts. Reward requests: ${state.rewardRequests.map((r) => `${r.child}:${r.reward}(${r.status})`).join('; ') || 'none'}.`;
  }, [state]);

  const winner = state.battleScore.alex === state.battleScore.katya ? 'Tie' : (state.battleScore.alex > state.battleScore.katya ? 'Alex leads' : 'Katya leads');

  const selected = state.selectedChild || 'alex';
  const selectedName = state.children[selected].name;
  const selectedMissions = state.missions[selected];
  const nextMission = selectedMissions.find((m) => !m.completed);

  return <div className="app-shell"><div className="test-banner">Summer Math Battle Tutor Loaded</div><div className="particles" />
    <header className="hud"><div className="logo">🎮 Summer Math Battle Tutor</div><nav>{tabs.map((t) => <button key={t} className={state.activeTab === t ? 'tab active' : 'tab'} onClick={() => switchTab(t)}>{t}</button>)}</nav><div className="stats"><span>🪙 {state.children.alex.coins + state.children.katya.coins}</span><span>✨ {state.children.alex.xp + state.children.katya.xp}</span><span>🔥 {state.children.alex.streak + state.children.katya.streak}</span></div></header>
    <div className="actions"><button onClick={() => setSelectedChild('alex')}>Alex</button><button onClick={() => setSelectedChild('katya')}>Katya</button><strong>Currently selected: {selectedName}</strong></div>
    {state.activeMission && <section className="big-card" id="active-mission"><h3>Active Mission • {state.children[state.activeMission.childKey].name} • {state.missions[state.activeMission.childKey].find((x) => x.id === state.activeMission.missionId)?.title}</h3><p>Question {state.activeMission.index + 1}/5: {state.activeMission.questions[state.activeMission.index].q}</p><input value={state.activeMission.input} onChange={(e) => persist({ ...state, activeMission: { ...state.activeMission, input: e.target.value } })} /><button onClick={submitMissionAnswer}>Submit</button><button onClick={() => persist({ ...state, activeMission: null, ui: { ...state.ui, message: 'Mission closed.' } })}>Close Mission</button><p>{state.activeMission.feedback}</p></section>}
    <main className="content fade-in">
      {state.ui.levelUp && <p>{state.ui.levelUp}</p>}
      {state.ui.message && <p>{state.ui.message}</p>}
      {state.ui.rewardMessage && <p>{state.ui.rewardMessage}</p>}
      {state.activeTab === 'Home' && <div><h2>Home Dashboard</h2><div className="hero-grid">{['alex', 'katya'].map((k) => <article key={k} className={`hero ${k} ${selected===k?'selected-hero':''}`} onClick={() => setSelectedChild(k)}><h3>{state.children[k].name}</h3><p>{state.children[k].gradeLevel}</p><p>Level {state.children[k].level} | XP {state.children[k].xp}/{state.children[k].xpMax}</p><p>Coins {state.children[k].coins} | Accuracy {state.children[k].accuracy}%</p></article>)}</div><article className="big-card"><h3>Selected Child Panel: {selectedName}</h3><p>Today's missions completed: {state.children[selected].missionsCompletedToday}/6</p><p>Next mission: {nextMission ? nextMission.title : 'All done today!'}</p><button disabled={!nextMission} onClick={() => nextMission && startMission(selected, nextMission.id)}>Start Today&apos;s Missions</button>{state.activeMission && <button onClick={() => document.getElementById('active-mission')?.scrollIntoView({ behavior: 'smooth' })}>Continue Mission</button>}</article></div>}
      {state.activeTab === 'Missions' && <div><h2>{selectedName}’s Missions</h2><div className="mission-grid">{selectedMissions.map((m) => <article className="mission" key={m.id}><h4>{m.title}</h4><p>{m.skillFocus} • {m.difficulty}</p><p>Questions: 5</p><p>Progress: {m.progress}/5</p><p>Rewards: +{m.xpReward} XP • +{m.coinReward} coins</p><p>{m.completed ? '✅ Completed' : '⬜ Not completed yet'}</p><button onClick={() => startMission(selected, m.id)}>Start Mission</button></article>)}</div></div>}
      {state.activeTab === 'Battle' && <section><h2>Sibling Battle Arena</h2><p>Alex: {state.battleScore.alex} | Katya: {state.battleScore.katya}</p><p>Winner: {winner}</p><p>You compete by effort and improvement, not grade level.</p></section>}
      {state.activeTab === 'Store' && <section><h2>Reward Store ({selectedName} selected)</h2><div className="store-grid">{rewards.map((r) => <article className="store-card" key={r[1]}><h4>{r[0]} {r[1]}</h4><p>{r[2]} coins • {r[3]}</p><button onClick={() => requestReward(selected, r)}>Request for Selected Child</button><button onClick={() => requestReward('alex', r)}>Request for Alex</button><button onClick={() => requestReward('katya', r)}>Request for Katya</button></article>)}</div></section>}
      {state.activeTab === 'Grant Prize' && <section><h2>Grant Prize</h2><button onClick={claimGrant}>Claim Daily Grant Prize</button><p>{state.grant.message}</p></section>}
      {state.activeTab === 'Practice' && <section><h2>Practice Trainer</h2><p>Selected child: {selectedName}</p><div className="actions"><button onClick={() => setSelectedChild('alex')}>Alex</button><button onClick={() => setSelectedChild('katya')}>Katya</button></div><select value={state.practice.mode} onChange={(e)=>persist({...state,practice:{...state.practice,mode:e.target.value,child:selected}})}><option>Multiplication</option><option>Division</option><option>Mixed</option><option>Missing Number</option></select><button onClick={()=>{const qs=Array.from({length:10},()=>genQuestion(selected,'Speed Round'));persist({...state,practice:{...state.practice,child:selected,questions:qs,index:0,score:0}})}}>Generate 10 Questions</button>{state.practice.questions.length>0&&<article className="big-card"><p>{state.practice.index+1}/10: {state.practice.questions[state.practice.index]?.q}</p><input value={state.practice.answer||''} onChange={(e)=>persist({...state,practice:{...state.practice,answer:e.target.value}})} /><button onClick={()=>{const n=safeClone(state);const q=n.practice.questions[n.practice.index];if(Number((n.practice.answer||'').trim())===q.a)n.practice.score+=1;n.practice.index=Math.min(9,n.practice.index+1);n.practice.answer='';persist(n);}}>Submit</button><p>Score: {state.practice.score}</p></article>}</section>}
      {state.activeTab === 'Money Lab' && <section><h2>Money Lab ({selectedName})</h2><p>Use missions Money Lab + Store requests to build financial choices.</p></section>}
      {state.activeTab === 'Parent' && <section><h2>Parent Dashboard</h2>{['alex', 'katya'].map((k) => <article key={k} className="big-card"><h3>{state.children[k].name}</h3><p>Minutes: {state.children[k].minutesToday} | Missions: {state.children[k].missionsCompletedToday}</p><p>XP today: {state.children[k].statsToday.xpEarned} | Coins today: {state.children[k].statsToday.coinsEarned}</p><p>Accuracy: {state.children[k].accuracy}% | Corrections: {state.children[k].mistakesCorrected}</p><button onClick={() => momBonus(k)}>Mom Bonus +25 coins</button></article>)}
        <h3>Reward Requests</h3><ul>{state.rewardRequests.map((r) => <li key={r.id}>{r.child} - {r.reward} ({r.cost}) [{r.status}] {r.status === 'Pending Parent Approval' && <><button onClick={() => parentDecision(r.id, true)}>Approve</button><button onClick={() => parentDecision(r.id, false)}>Decline</button></>}</li>)}</ul>
        <h3>Daily Report</h3><textarea value={dailyReport} readOnly rows={4} style={{ width: '100%' }} /><button onClick={() => navigator.clipboard.writeText(dailyReport)}>Copy Report</button>
        <div><button onClick={resetToday}>Reset Today</button><button onClick={() => window.confirm('Reset all progress?') && resetAll()}>Reset All Progress</button><button onClick={exportJson}>Export Progress JSON</button></div>
        <textarea value={state.importText} onChange={(e) => persist({ ...state, importText: e.target.value })} rows={4} placeholder="Paste progress JSON" style={{ width: '100%' }} /><button onClick={importJson}>Import Progress JSON</button>
      </section>}
    </main><div className="card">Selected child: {selected} | Active tab: {state.activeTab} | Active mission: {state.activeMission ? 'yes' : 'no'}</div></div>;
}
