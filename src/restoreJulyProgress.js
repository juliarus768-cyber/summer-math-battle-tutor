const STORAGE_KEY = 'summerMathBattleTutorStateV2';
const RECOVERY_KEY = 'summerMathBattleTutorJuly15ProgressRecoveryV1';

const rememberedProgress = {
  alex: {
    name: 'Alex',
    level: 7,
    xpMax: 500,
    coins: 430,
    adventureKeys: 1,
  },
  katya: {
    name: 'Katya',
    level: 13,
    xpMax: 1300,
    coins: 500,
    adventureKeys: 1,
  },
};

const readJson = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
};

const writeJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

const hasWipedProgress = (state) => {
  const alex = state?.children?.alex;
  const katya = state?.children?.katya;
  if (!alex || !katya) return true;

  const alexKeys = Number(alex.adventureKeys ?? alex.keys ?? 0);
  const katyaKeys = Number(katya.adventureKeys ?? katya.keys ?? 0);
  return (
    Number(alex.coins || 0) < rememberedProgress.alex.coins ||
    Number(katya.coins || 0) < rememberedProgress.katya.coins ||
    Number(alex.level || 0) < rememberedProgress.alex.level ||
    Number(katya.level || 0) < rememberedProgress.katya.level ||
    alexKeys < rememberedProgress.alex.adventureKeys ||
    katyaKeys < rememberedProgress.katya.adventureKeys
  );
};

const restoreChildFloor = (state, childKey) => {
  const baseline = rememberedProgress[childKey];
  state.children ||= {};
  state.children[childKey] ||= { name: baseline.name };
  const child = state.children[childKey];

  child.name ||= baseline.name;
  child.level = Math.max(Number(child.level || 0), baseline.level);
  child.xpMax = Math.max(Number(child.xpMax || 0), baseline.xpMax);
  child.coins = Math.max(Number(child.coins || 0), baseline.coins);
  child.adventureKeys = Math.max(Number(child.adventureKeys ?? child.keys ?? 0), baseline.adventureKeys);
  delete child.keys;
};

const restoreJulyProgress = () => {
  const state = readJson(STORAGE_KEY) || {};
  if (!hasWipedProgress(state)) return;

  restoreChildFloor(state, 'alex');
  restoreChildFloor(state, 'katya');
  state.selectedChild ||= 'alex';
  state.ui ||= {};
  state.ui.message = 'Progress safety restore applied from the July 15 baseline.';
  state.recovery ||= {};
  state.recovery.july15Baseline = {
    appliedAt: new Date().toISOString(),
    source: 'manual remembered values: Alex level 7, 430 coins, 1 key; Katya level 13, 500 coins, 1 key',
  };

  writeJson(STORAGE_KEY, state);
  writeJson(RECOVERY_KEY, state.recovery.july15Baseline);
};

restoreJulyProgress();
