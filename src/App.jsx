import { useMemo, useState } from 'react';

const STORAGE_KEY = 'summerMathBattleTutorStateV1';

const defaultState = {
  activeTab: 'Home',
  weekendMode: false,
  notifications: 3,
  grantClaimed: false,
  players: {
    alex: { level: 7, xp: 320, xpMax: 500, coins: 180, streak: 9, rank: 'Battle Commander', missions: 0, minutes: 0, bonuses: ['Check Before Submit'] },
    katya: { level: 4, xp: 250, xpMax: 400, coins: 150, streak: 10, rank: 'Mystery Detective', missions: 0, minutes: 0, bonuses: ['Clue Finder'] }
  },
  missionProgress: [0, 0, 0, 0, 0, 0],
  rewardRequests: [],
  battleScore: { alex: 0, katya: 0 }
};

const tabs = ['Home', 'Missions', 'Battle', 'Practice', 'Money Lab', 'Store', 'Grant Prize', 'Parent'];
const missions = [
  { name: 'Speed Round', icon: '⚡', desc: 'Fast recall with accuracy checks.', xp: 40, rarity: 'rare' },
  { name: 'Logic Battle', icon: '🧠', desc: 'BEDMAS and strategy puzzle drill.', xp: 50, rarity: 'epic' },
  { name: 'Money Lab', icon: '💰', desc: 'Coins, change, and market math.', xp: 35, rarity: 'uncommon' },
  { name: 'Mystery Case', icon: '🕵️', desc: 'Solve clues with multi-step math.', xp: 45, rarity: 'mythic' },
  { name: 'Boss Battle', icon: '👾', desc: 'Mixed mastery challenge round.', xp: 60, rarity: 'legendary' },
  { name: 'Streak Saver', icon: '🔥', desc: 'Catch-up mission shield boost.', xp: 30, rarity: 'rare' }
];

const rewards = [
  ['🍫', 'Chocolate', 40, 'Common'], ['🎵', 'Pick music in the car', 55, 'Common'], ['🧋', 'Bubble tea', 80, 'Rare'],
  ['🍜', 'Pick takeout', 120, 'Rare'], ['🚚', 'DoorDash delivery', 140, 'Epic'], ['🍽️', 'Restaurant with mom', 180, 'Epic'],
  ['🍔', 'Restaurant with dad', 180, 'Epic'], ['🎬', 'Movie', 220, 'Legendary'], ['🧗', 'Rock climbing', 260, 'Legendary'],
  ['☕', 'Starbucks card', 300, 'Mythic'], ['🍎', 'Apple gift card', 450, 'Mythic'], ['🎮', 'PlayStation card', 500, 'Ultra'],
  ['📱', 'Device day with no classes', 650, 'Ultra']
];

const loadState = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState;
  try { return { ...defaultState, ...JSON.parse(raw) }; } catch { return defaultState; }
};

export default function App() {
  const [state, setState] = useState(loadState);

  const save = (next) => {
    setState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const completeMission = (kidKey) => {
    const next = structuredClone(state);
    const kid = next.players[kidKey];
    const missionIndex = next.missionProgress.findIndex((m) => m < 5);
    if (missionIndex !== -1) next.missionProgress[missionIndex] += 1;
    kid.missions += 1;
    kid.minutes += next.weekendMode ? 8 : 10;
    kid.xp = Math.min(kid.xpMax, kid.xp + 40);
    kid.coins += 20;
    kid.streak += 1;
    next.battleScore[kidKey] += 1;
    save(next);
  };

  const requestReward = (kid, rewardName, cost) => {
    const next = structuredClone(state);
    next.rewardRequests.unshift({ kid, rewardName, cost, time: new Date().toLocaleString('en-US'), status: 'Pending' });
    save(next);
  };

  const claimGrant = () => {
    if (state.grantClaimed) return;
    const next = structuredClone(state);
    next.grantClaimed = true;
    next.players.alex.coins += 50;
    next.players.katya.coins += 50;
    next.notifications = Math.max(0, next.notifications - 1);
    save(next);
  };

  const topTotals = useMemo(() => ({
    coins: state.players.alex.coins + state.players.katya.coins,
    xp: state.players.alex.xp + state.players.katya.xp,
    streak: state.players.alex.streak + state.players.katya.streak
  }), [state.players]);

  return (
    <div className="app-shell">
      <div className="particles" />
      <header className="hud">
        <div className="logo">🎮 Summer Math Battle Tutor</div>
        <nav>{tabs.map((t) => <button key={t} className={state.activeTab===t?'tab active':'tab'} onClick={()=>save({...state,activeTab:t})}>{t}</button>)}</nav>
        <div className="stats"><span>🪙 {topTotals.coins}</span><span>✨ {topTotals.xp}</span><span>🔥 {topTotals.streak}</span><span className="badge">{state.notifications}</span><span>⚙️</span></div>
      </header>

      <main className="content">
        {state.activeTab === 'Home' && <Home state={state} completeMission={completeMission} claimGrant={claimGrant} />}
        {state.activeTab === 'Store' && <Store state={state} requestReward={requestReward} />}
        {state.activeTab === 'Parent' && <Parent state={state} />}
        {!['Home','Store','Parent'].includes(state.activeTab) && <Placeholder title={state.activeTab} state={state} save={save} />}
      </main>
    </div>
  );
}

function Home({ state, completeMission, claimGrant }) {
  return <section className="fade-in">
    <div className="event-banner"><h2>DOUBLE XP WEEKEND</h2><p>Portal boost expires in 01d 12h 33m</p></div>
    <div className="hero-grid">
      <HeroCard kid="alex" data={state.players.alex} theme="alex" />
      <HeroCard kid="katya" data={state.players.katya} theme="katya" />
    </div>
    <div className="status-grid">
      <Card title="Streak Flame" value="Protected: No lost streaks" icon="🔥" />
      <Card title="Today's Goal" value="60 minutes per child" icon="⏱️" />
      <Card title="Team Bonus" value="Both complete missions = +40 coins" icon="🛡️" />
    </div>
    <div className="section-title">Today's Missions</div>
    <div className="mission-grid">
      {missions.map((m,i)=><article key={m.name} className={`mission ${m.rarity}`}><h4>{m.icon} {m.name}</h4><p>{m.desc}</p><div>{state.missionProgress[i]}/5 • +{m.xp} XP</div><div className="check">{state.missionProgress[i] >= 5 ? '✅ Complete' : '⬜ In progress'}</div></article>)}
    </div>
    <div className="actions"><button onClick={()=>completeMission('alex')}>Complete mission for Alex</button><button onClick={()=>completeMission('katya')}>Complete mission for Katya</button></div>
    <div className="lower-grid">
      <article className="big-card"><h3>Sibling Battle Arena</h3><p>Alex {state.battleScore.alex} vs {state.battleScore.katya} Katya</p></article>
      <article className="big-card chest"><h3>Grant Prize Chest</h3><p>{state.grantClaimed?'Claimed +50 coins each':'Glowing mystery chest ready!'}</p><button onClick={claimGrant}>Claim grant prize</button></article>
      <article className="big-card"><h3>Next Reward</h3><p>🧋 Bubble Tea unlock trend: 80 coins</p></article>
      <article className="big-card"><h3>Achievements</h3><p>⚔️ Check Before Submit | 🔦 Clue Finder | 🧠 Accuracy Hero</p></article>
      <article className="big-card"><h3>Upcoming Events</h3><p>Friday Boss Raid • Saturday Light Mode • Sunday Catch-Up</p></article>
      <article className="big-card"><h3>Katya Motivation</h3><p>“Friends don’t lie. Numbers don’t either. Keep solving.”</p></article>
    </div>
  </section>;
}

const HeroCard = ({ kid, data, theme }) => <article className={`hero ${theme}`}>
  <div className="avatar">
    <div className="hair"/><div className="face"><span className="eyes">◉ ◉</span><span className="smile">{kid==='katya'?'▱▱':')'}</span></div>
    <div className="outfit">{kid==='katya'?'🔦':'⚡'}</div>
  </div>
  <div className="hero-info"><h3>{kid==='alex'?'Alex: Battle Commander':'Katya: Mystery Detective'}</h3><p>Level {data.level} • {data.rank}</p><div className="xp"><span style={{width:`${(data.xp/data.xpMax)*100}%`}}/></div><p>🪙 {data.coins} • 🔥 {data.streak} • Bonus: {data.bonuses[0]}</p><button>View Profile</button></div>
</article>;

const Card = ({ title, value, icon }) => <article className="card"><h4>{icon} {title}</h4><p>{value}</p></article>;

function Store({ state, requestReward }) { return <section className="fade-in"><h2>Reward Store</h2><div className="store-grid">{rewards.map(([icon,name,cost,rarity])=><article key={name} className="store-card"><h3>{icon} {name}</h3><p>Cost: {cost} Math Coins</p><p>Rarity: {rarity}</p><div className="store-actions"><button onClick={()=>requestReward('Alex',name,cost)}>Request for Alex</button><button onClick={()=>requestReward('Katya',name,cost)}>Request for Katya</button></div><small>Requires parent approval</small></article>)}</div></section>; }

function Parent({ state }) { return <section className="fade-in"><h2>Parent Dashboard</h2><div className="parent-grid"><article><h3>Daily Minutes</h3><p>Alex: {state.players.alex.minutes} • Katya: {state.players.katya.minutes}</p></article><article><h3>Missions Completed</h3><p>Alex: {state.players.alex.missions} • Katya: {state.players.katya.missions}</p></article><article><h3>Weak Skills</h3><p>Alex: fractions, long division | Katya: subtraction fluency, division facts</p></article><article><h3>Strongest Skill Today</h3><p>Alex: BEDMAS checks | Katya: persistence in clue-solving</p></article><article><h3>Suggested Focus for Tomorrow</h3><p>6 x 10 minutes each, reward corrections. Phrase: “Good try. Let’s fix the step.”</p></article><article><h3>Approve / Review</h3><p>No lost streaks, catch-up enabled, weekend lighter mode active manually.</p></article></div><h3>Reward Requests</h3><ul className="requests">{state.rewardRequests.length?state.rewardRequests.map((r,idx)=><li key={idx}>{r.time} — {r.kid} requested {r.rewardName} ({r.cost} coins) [{r.status}]</li>):<li>No requests yet.</li>}</ul></section>; }

function Placeholder({ title, state, save }) {
  return <section className="fade-in"><h2>{title}</h2><p>Game module preview with neon UI continuity.</p><button onClick={()=>save({...state,weekendMode:!state.weekendMode})}>{state.weekendMode?'Switch to weekday mode':'Toggle weekend mode'}</button><p>{state.weekendMode?'Weekend mode: lighter mission sessions (8 mins).':'Weekday mode: standard mission sessions (10 mins).'}</p></section>;
}
