const STORAGE_KEY = 'summerMathBattleTutorStateV2';

const readState = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

const getChild = (state, key) => state?.children?.[key] || {};

const childKeys = (child) => Number(child.adventureKeys ?? child.keys ?? 0);

const ensureProgressRibbon = () => {
  let ribbon = document.querySelector('.progress-ribbon');
  if (ribbon) return ribbon;

  const switcher = document.querySelector('.child-switcher');
  if (!switcher?.parentNode) return null;

  ribbon = document.createElement('section');
  ribbon.className = 'progress-ribbon';
  ribbon.setAttribute('aria-label', 'Selected child progress');
  ribbon.innerHTML = `
    <div class="progress-ribbon-head"><strong></strong><span></span></div>
    <div class="progress-ribbon-track"><span></span></div>
    <div class="progress-ribbon-stats">
      <span data-stat="coins"></span>
      <span data-stat="xp"></span>
      <span data-stat="keys"></span>
      <span data-stat="score"></span>
    </div>
  `;
  switcher.insertAdjacentElement('afterend', ribbon);
  return ribbon;
};

const updateHeaderLogo = (selected, child) => {
  const logo = document.querySelector('.hud-logo');
  if (!logo || logo.dataset.progressFixed === selected) return;

  logo.dataset.progressFixed = selected;
  logo.classList.toggle('alex', selected === 'alex');
  logo.classList.toggle('katya', selected === 'katya');
  logo.innerHTML = `<span class="player-mark">${selected === 'alex' ? 'A' : 'K'}</span><span>SUMMER BATTLE QUEST</span><small>${child.name || selected} HQ</small>`;
};

const updateCounters = (state, selected, child) => {
  const counters = document.querySelector('.hud-counters');
  const soundButton = counters?.querySelector('.sound-toggle');
  if (!counters) return;

  const score = state?.battleScore?.[selected] || 0;
  const notifications = state?.notifications || 0;
  counters.innerHTML = `
    <span>🪙 ${child.coins || 0}</span>
    <span>⭐ ${child.xp || 0} XP</span>
    <span>🗝 ${childKeys(child)}</span>
    <span>🏆 ${score}</span>
    <span class="notification">🔔<b>${notifications}</b></span>
  `;
  if (soundButton) counters.appendChild(soundButton);
};

const updateRibbon = (state, selected, child) => {
  const ribbon = ensureProgressRibbon();
  if (!ribbon) return;

  const mission = state?.missions?.[selected]?.[0] || {};
  const total = mission.total || 30;
  const progress = Math.min(mission.progress || 0, total);
  const score = state?.battleScore?.[selected] || 0;
  const width = Math.min(100, Math.round((progress / Math.max(1, total)) * 100));

  ribbon.classList.toggle('alex', selected === 'alex');
  ribbon.classList.toggle('katya', selected === 'katya');
  ribbon.querySelector('.progress-ribbon-head strong').textContent = `${child.name || selected} progress`;
  ribbon.querySelector('.progress-ribbon-head span').textContent = `${progress}/${total} daily questions`;
  ribbon.querySelector('.progress-ribbon-track span').style.width = `${width}%`;
  ribbon.querySelector('[data-stat="coins"]').textContent = `Coins ${child.coins || 0}`;
  ribbon.querySelector('[data-stat="xp"]').textContent = `XP ${child.xp || 0}/${child.xpMax || 0}`;
  ribbon.querySelector('[data-stat="keys"]').textContent = `Keys ${childKeys(child)}`;
  ribbon.querySelector('[data-stat="score"]').textContent = `Score ${score}`;
};

const updateActiveMissionProgress = (state) => {
  const mission = state?.activeMission;
  const progress = document.querySelector('#active-mission .mission-progress');
  if (!mission || !progress) return;

  let stats = progress.querySelector('.mission-progress-stats');
  if (!stats) {
    stats = document.createElement('div');
    stats.className = 'mission-progress-stats';
    progress.querySelector('.mission-progress-track')?.insertAdjacentElement('beforebegin', stats);
  }

  const child = getChild(state, mission.childKey);
  stats.innerHTML = `<span>Score ${mission.localCorrect || 0} correct</span><span>Keys ${childKeys(child)}</span><span>Coins ${child.coins || 0}</span>`;
};

const syncMobileProgress = () => {
  const state = readState();
  const selected = state.selectedChild || 'alex';
  const child = getChild(state, selected);
  if (!child.name) return;

  updateHeaderLogo(selected, child);
  updateCounters(state, selected, child);
  updateRibbon(state, selected, child);
  updateActiveMissionProgress(state);
};

const startMobileProgressFix = () => {
  syncMobileProgress();
  window.addEventListener('storage', syncMobileProgress);
  window.addEventListener('focus', syncMobileProgress);
  window.setInterval(syncMobileProgress, 500);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startMobileProgressFix);
} else {
  startMobileProgressFix();
}
