import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function extractFunction(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} must exist`);
  const bodyStart = source.indexOf('{', start);
  let depth = 0, quote = null, escaped = false, lineComment = false, blockComment = false;
  for (let i = bodyStart; i < source.length; i++) {
    const ch = source[i];
    const next = source[i + 1];
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

class FakeClassList {
  constructor() { this.values = new Set(); }
  add(...names) { names.forEach(name => this.values.add(name)); }
  remove(...names) { names.forEach(name => this.values.delete(name)); }
  toggle(name, force) {
    const enabled = force === undefined ? !this.values.has(name) : !!force;
    if (enabled) this.values.add(name); else this.values.delete(name);
    return enabled;
  }
  contains(name) { return this.values.has(name); }
}

function createHarness(questionFactory = () => [question('2 + 2 = ?', 4, ['3', '4', '5'])]) {
  const elements = new Map();
  const timers = [];
  const storeWrites = [];
  const presented = [];
  const thinkingAnswers = [];
  const recordedAnswers = [];
  const viewed = [];
  const helped = [];
  const reinforcementCalls = [];
  const toasts = [];
  let nodeSequence = 0;

  function element(id = '') {
    if (elements.has(id)) return elements.get(id);
    let html = '';
    const el = {
      id, style:{ display:'' }, className:'', classList:new FakeClassList(), children:[],
      textContent:'', value:'', disabled:false, inputMode:'', onclick:null, offsetWidth:1,
      focusCount:0, scrollCount:0,
      appendChild(child) { this.children.push(child); return child; },
      replaceChildren(...children) { this.children = children; },
      addEventListener(type, fn) { if (type === 'click') this.onclick = fn; },
      focus() { this.focusCount++; },
      scrollIntoView() { this.scrollCount++; }
    };
    Object.defineProperty(el, 'innerHTML', {
      get() { return html; },
      set(value) { html = String(value); if (value === '') el.children = []; }
    });
    elements.set(id, el);
    return el;
  }

  const requiredIds = [
    'ms-result','ms-answer','ms-submit','ms-fb','ms-combo','hq-grid','landing','mission-screen',
    'ms-title','ms-player','ms-xp-pill','ms-play','pad-card','pad-toggle-btn','ms-story','ms-q',
    'ms-reinforce-badge','ms-attempt-dots','ms-walkthrough','ms-choices','ms-sign-btn','ms-bb-panel',
    'ms-bb-btn','ms-segs','ms-count','ms-walkthrough-next','res-title','res-score','res-xp',
    'res-coins','res-bonus','battle-screen','store-screen','parent-screen','moneylab-screen',
    'grant-screen','guided-screen','escape-screen','strategy-screen','hero-alex','hero-katya'
  ];
  requiredIds.forEach(element);
  element('ms-result').style.display = 'none';
  element('ms-play').style.display = 'block';
  element('ms-attempt-dots').children = [element('dot-1'), element('dot-2'), element('dot-3')];

  const state = {
    activePlayer:'alex',
    pausedDaily:{ alex:null, katya:null },
    alex:{ xp:0, totalXP:0, coins:0, streak:0, lvl:1 },
    katya:{ xp:0, totalXP:0, coins:0, streak:0, lvl:1 },
    activity:{ alex:{ missions:0 }, katya:{ missions:0 } },
    daily:{ alex:{ count:0 }, katya:{ count:0 } },
    log:[]
  };
  let generatedQuestions = questionFactory();

  const context = vm.createContext({
    JSON, Number, Object, Array, Math, Date, console,
    state,
    resetInProgress:false,
    MISSIONS:[{ id:'daily', xp:140 }],
    GRADE:{ alex:'Grade 8', katya:'Grade 5' },
    BB_STEPS:{
      ms:['🧠 BRAIN BOOST','⚡ WINNING STRATEGY','🔍 SIMILAR EXAMPLE','💡 REMEMBER THIS','⚠️ COMMON MISTAKE','🎯 BONUS CHALLENGE'],
      b:['🧠 BRAIN BOOST','⚡ WINNING STRATEGY','⚠️ COMMON MISTAKE']
    },
    MAX_MISSION_LEN:36,
    B:{},
    BATTLE_TOPIC_MAP:{},
    document:{
      createElement:() => element(`__node-${++nodeSequence}`),
      querySelectorAll(selector) { return selector === '.choice-answer' ? element('ms-choices').children : []; }
    },
    window:{
      scrollTo() {},
      MathThinkingSystem:{
        questionPresented(event) { presented.push(structuredClone(event)); },
        answerRecorded(event) { thinkingAnswers.push(structuredClone(event)); }
      }
    },
    structuredClone,
    setTimeout(fn, delay) { timers.push({ fn, delay }); return timers.length; },
    $:element,
    isPlainObject:value => !!value && typeof value === 'object' && !Array.isArray(value),
    Store:{ set(key, value) { storeWrites.push({ key, value:structuredClone(value) }); return { ok:true }; } },
    generateDailyMission:() => structuredClone(generatedQuestions),
    getCurrentGrade:who => who === 'alex' ? 7 : 4,
    initPad() {},
    toast:message => toasts.push(message),
    topicAllowsNegative:topic => topic === 'integers',
    strategyFor:() => ({ strategy:'Use the matching operation.', memoryHook:'Check each step.', commonMistake:'rushing' }),
    similarQuestion:() => null,
    topicDifficulty:() => 1,
    fallbackWorkedExample:() => 'Work a similar example.',
    hintFor:() => 'Use a useful clue.',
    markStrategyViewed:(who, topic) => viewed.push({ who, topic }),
    markStrategyHelped:(who, topic) => helped.push({ who, topic }),
    recordAnswer:(who, topic, correct) => recordedAnswers.push({ who, topic, correct }),
    showWalkthrough() { element('ms-walkthrough').style.display = 'block'; },
    queueReinforcement:topic => reinforcementCalls.push(topic),
    pick:items => items[0],
    burst() {},
    dailyCountFor:() => 0,
    weekendXpMult:() => 1,
    gainXP(player, xp) { player.xp += xp; player.totalXP += xp; return false; },
    bumpStreak:player => { player.streak++; },
    bumpDaily:who => { state.daily[who].count++; },
    touchPlayer() {},
    logEvent:(who, icon, msg) => state.log.push({ who, icon, msg }),
    playCue() {},
    paint() { context.Store.set('smbt-state-v2', state); },
    fmt:value => String(value),
    gradePlain:who => who === 'alex' ? 'Grade 8' : 'Grade 5'
  });

  const functions = [
    'validPausedMission','setPlayer','resetBrainBoost','bbTopicFor','bbHintText','advanceBrainBoost',
    'renderBrainBoostLevel','restoreBrainBoost','updateAttemptDots','savePausedMission',
    'pauseDailyMissionRun','startMission','segs','nextQ','chooseMissionAnswer','parseStrictNumber',
    'answerOk','submitQ','lockThen','showResult','closeMission'
  ].map(extractFunction).join('\n');

  vm.runInContext(`
    let M = null;
    let missionRunToken = 0;
    const QCOUNT = 20, DAILY_BASIC_COUNT = 8, XP_PER_Q = 8;
    ${extractFunction('missionRunIsCurrent')}
    ${extractFunction('scheduleMissionCallback')}
    ${functions}
    globalThis.api = {
      validPausedMission, setPlayer, savePausedMission, pauseDailyMissionRun, startMission, nextQ,
      chooseMissionAnswer, submitQ, showResult, closeMission,
      mission:() => M, token:() => missionRunToken,
      replaceQuestions(value) { generatedQuestions = value; },
      invalidate() { missionRunToken++; },
      runIsCurrent:missionRunIsCurrent
    };
  `, context);

  return {
    api:context.api, state, elements, timers, storeWrites, presented, thinkingAnswers,
    recordedAnswers, viewed, helped, reinforcementCalls, toasts,
    setQuestions(value) { generatedQuestions = structuredClone(value); },
    runTimer(index) { const timer = timers[index]; assert.ok(timer, `timer ${index} must exist`); timer.fn(); },
    runAllTimers() { while (timers.length) timers.shift().fn(); }
  };
}

function question(text, answer, choices = null, overrides = {}) {
  return {
    s:'Solve carefully.', q:text, a:answer, topic:'addition', hint:'Add the two values.',
    ...(choices ? { choices } : {}), ...overrides
  };
}

// Mission start presents the first question once and creates one active run.
{
  const h = createHarness();
  h.api.startMission('daily');
  assert.equal(h.api.mission().player, 'alex');
  assert.equal(h.api.mission().i, 0);
  assert.equal(h.presented.length, 1);
  assert.equal(h.presented[0].child, 'alex');
}

// Wrong attempts, selected answer, Brain Boost state, unknown fields, pause, and restore survive exactly.
{
  const h = createHarness();
  h.api.startMission('daily');
  h.api.chooseMissionAnswer('3');
  h.api.submitQ();
  assert.equal(h.api.mission().attempts, 1);
  assert.equal(h.api.mission().bbLevel, 1);
  assert.equal(h.state.pausedDaily.alex.answer, '3');
  assert.equal(h.state.pausedDaily.alex.attempts, 1);
  assert.equal(h.state.pausedDaily.alex.bbLevel, 1);
  assert.equal(h.thinkingAnswers.length, 1);
  assert.equal(h.viewed.length, 1);

  h.api.closeMission();
  assert.equal(h.api.mission(), null);
  h.state.pausedDaily.alex.futurePausedField = { kept:true };
  h.api.startMission('daily');
  assert.equal(h.api.mission().attempts, 1);
  assert.equal(h.api.mission().bbLevel, 1);
  assert.equal(h.elements.get('ms-answer').value, '3');
  assert.equal(h.elements.get('ms-choices').children[0].classList.contains('selected'), true);
  assert.equal(h.elements.get('ms-bb-panel').children.length, 1);
  assert.equal(h.presented.length, 2, 'restore must re-establish the current Math Thinking question context');
  assert.equal(h.thinkingAnswers.length, 1, 'restore must not duplicate answer events');
  assert.equal(h.viewed.length, 1, 'support restore must not count as a new strategy view');
  assert.deepEqual(h.api.mission().futurePausedField, { kept:true });

  h.api.submitQ();
  assert.equal(h.api.mission().attempts, 2);
  assert.equal(h.api.mission().bbLevel, 3);
  h.api.closeMission();
  h.api.startMission('daily');
  assert.equal(h.api.mission().attempts, 2);
  assert.equal(h.api.mission().bbLevel, 3);
  assert.equal(h.elements.get('ms-bb-panel').children.length, 3);
  assert.equal(h.viewed.length, 1);
}

// A correct answer checkpoints the next unanswered question before its delayed transition.
// Rapid re-submission cannot duplicate rewards, mastery, or Math Thinking evidence.
{
  const questions = [question('2 + 2 = ?', 4, ['3','4','5']), question('7 + 1 = ?', 8)];
  const h = createHarness(() => questions);
  h.api.startMission('daily');
  h.api.chooseMissionAnswer('4');
  h.api.submitQ();
  const gained = h.api.mission().xpEarned;
  assert.equal(h.api.mission().i, 1);
  assert.equal(h.state.pausedDaily.alex.i, 1);
  assert.equal(h.state.pausedDaily.alex.q.q, '7 + 1 = ?');
  assert.equal(h.state.pausedDaily.alex.attempts, 0);
  assert.equal(h.recordedAnswers.length, 1);
  assert.equal(h.thinkingAnswers.length, 1);
  h.api.submitQ();
  assert.equal(h.api.mission().xpEarned, gained);
  assert.equal(h.recordedAnswers.length, 1);
  assert.equal(h.thinkingAnswers.length, 1);

  h.api.closeMission();
  h.api.startMission('daily');
  assert.equal(h.api.mission().i, 1);
  assert.equal(h.presented.length, 2, 'the newly checkpointed question is presented once on resume');
  assert.equal(h.thinkingAnswers.length, 1);
}

// Support from a completed question never leaks into the checkpoint for the next question.
{
  const questions = [question('2 + 2 = ?', 4, ['3','4','5']), question('7 + 1 = ?', 8)];
  const h = createHarness(() => questions);
  h.api.startMission('daily');
  h.api.chooseMissionAnswer('3');
  h.api.submitQ();
  assert.equal(h.api.mission().bbLevel, 1);
  h.api.chooseMissionAnswer('4');
  h.api.submitQ();
  assert.equal(h.state.pausedDaily.alex.i, 1);
  assert.equal(h.state.pausedDaily.alex.attempts, 0);
  assert.equal(h.state.pausedDaily.alex.bbLevel, 0);
}

// A third miss records one final mastery miss, advances/checkpoints, and does not award anything for queueing.
{
  const h = createHarness();
  h.api.startMission('daily');
  for (let attempt = 0; attempt < 3; attempt++) {
    h.api.chooseMissionAnswer('3');
    h.api.submitQ();
  }
  assert.equal(h.api.mission().i, 1);
  assert.equal(h.api.mission().pendingCompletion, true);
  assert.equal(h.state.pausedDaily.alex.i, 1);
  assert.equal(h.state.pausedDaily.alex.pendingCompletion, true);
  assert.deepEqual(h.recordedAnswers, [{ who:'alex', topic:'addition', correct:false }]);
  assert.equal(h.thinkingAnswers.length, 3, 'current-main per-attempt Math Thinking behavior is preserved');
  assert.equal(h.reinforcementCalls.length, 1);
  assert.equal(h.state.alex.xp, 0);
  assert.equal(h.state.alex.coins, 0);
}

// Pending final completion survives pause/reload-style re-entry and pays exactly once without a new answer event.
{
  const h = createHarness();
  h.api.startMission('daily');
  h.api.chooseMissionAnswer('4');
  h.api.submitQ();
  assert.equal(h.state.pausedDaily.alex.pendingCompletion, true);
  const answerEvents = h.thinkingAnswers.length;
  h.api.closeMission();
  h.api.startMission('daily');
  assert.equal(h.api.mission().completed, true);
  assert.equal(h.state.pausedDaily.alex, null);
  assert.equal(h.thinkingAnswers.length, answerEvents);
  const paid = { xp:h.state.alex.xp, coins:h.state.alex.coins, streak:h.state.alex.streak, missions:h.state.activity.alex.missions, logs:h.state.log.length };
  h.api.showResult();
  assert.deepEqual({ xp:h.state.alex.xp, coins:h.state.alex.coins, streak:h.state.alex.streak, missions:h.state.activity.alex.missions, logs:h.state.log.length }, paid);
  h.runAllTimers();
  assert.deepEqual({ xp:h.state.alex.xp, coins:h.state.alex.coins, streak:h.state.alex.streak, missions:h.state.activity.alex.missions, logs:h.state.log.length }, paid);
}

// Callbacks from an old mission are harmless after Home, replacement, completion, or profile change.
{
  const questions = [question('2 + 2 = ?', 4, ['3','4','5']), question('7 + 1 = ?', 8)];
  const h = createHarness(() => questions);
  h.api.startMission('daily');
  h.api.chooseMissionAnswer('4');
  h.api.submitQ();
  const oldTimer = h.timers.at(-1);
  h.api.closeMission();
  assert.equal(h.api.mission(), null);
  oldTimer.fn();
  assert.equal(h.api.mission(), null);

  h.state.pausedDaily.alex = null;
  h.api.startMission('daily');
  const replacement = h.api.mission();
  oldTimer.fn();
  assert.equal(h.api.mission(), replacement);
  assert.equal(replacement.i, 0);

  h.api.chooseMissionAnswer('4');
  h.api.submitQ();
  const alexTimer = h.timers.at(-1);
  h.api.setPlayer('katya');
  assert.equal(h.state.activePlayer, 'katya');
  assert.equal(h.api.mission(), null);
  assert.equal(h.state.pausedDaily.alex.player, 'alex');
  assert.equal(h.state.pausedDaily.katya, null);
  h.api.startMission('daily');
  const katyaMission = h.api.mission();
  const katyaBefore = structuredClone(h.state.katya);
  alexTimer.fn();
  assert.equal(h.api.mission(), katyaMission);
  assert.equal(katyaMission.player, 'katya');
  assert.deepEqual(h.state.katya, katyaBefore);
}

// Malformed or cross-child snapshots fail safely; conservative normalization preserves unknown data.
{
  const h = createHarness();
  h.state.pausedDaily.alex = { player:'katya', i:0, questions:[question('1 + 1 = ?', 2)] };
  assert.equal(h.api.validPausedMission('alex'), null);
  h.state.pausedDaily.alex = { player:'alex', i:0, questions:[{ q:'broken', s:'', a:Number.NaN }] };
  assert.equal(h.api.validPausedMission('alex'), null);
  h.state.pausedDaily.alex = { player:'alex', i:0, questions:[{ ...question('1 + 1 = ?', 2), choices:'not-an-array' }] };
  assert.equal(h.api.validPausedMission('alex'), null);
  h.state.pausedDaily.alex = { player:'alex', i:0, questions:[question('1 + 1 = ?', 2, ['2','2','3'])] };
  assert.equal(h.api.validPausedMission('alex'), null);
  h.state.pausedDaily.alex = { player:'alex', i:99, questions:[question('1 + 1 = ?', 2)] };
  assert.equal(h.api.validPausedMission('alex'), null);
  h.state.pausedDaily.alex = { player:'alex', i:0, attempts:99, bbLevel:99, future:{ value:7 }, questions:[question('1 + 1 = ?', 2)] };
  const normalized = h.api.validPausedMission('alex');
  assert.equal(normalized.attempts, 2);
  assert.equal(normalized.bbLevel, 6);
  assert.deepEqual(normalized.future, { value:7 });
}

// Stage 3 continues through the Stage 2 Store contract and introduces no direct primary-storage write.
{
  const lifecycleStart = source.indexOf('/* ============ ACTIVE MISSION FLOW ============ */');
  const lifecycleEnd = source.indexOf('/* ============ SCRATCHPAD', lifecycleStart);
  const lifecycle = source.slice(lifecycleStart, lifecycleEnd);
  assert.match(lifecycle, /Store\.set\('smbt-state-v2', state\)/);
  assert.doesNotMatch(lifecycle, /localStorage\.(?:setItem|removeItem)\s*\(/);
  assert.match(source, /if \(resetInProgress \|\| !M \|\| M\.completed/);
  assert.match(source, /missionRunToken\+\+/);
}

console.log('Integration Stage 3 Daily Mission lifecycle checks passed');
