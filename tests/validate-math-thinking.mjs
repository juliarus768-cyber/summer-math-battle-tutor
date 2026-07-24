import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function nodeStub() {
  return {
    className:'', textContent:'', innerHTML:'', hidden:false, style:{},
    classList:{add(){},remove(){},toggle(){}}, appendChild(){},
    insertAdjacentElement(){}, addEventListener(){}, focus(){},
    querySelector(){return nodeStub()}, querySelectorAll(){return[]}
  };
}

const saved = {
  activePlayer:'alex', alex:{}, katya:{},
  mastery:{alex:{},katya:{}}, strategy:{alex:{viewed:{}},katya:{viewed:{}}},
  mathThinking:{version:2,alex:{unlocked:'invalid',events:{bad:true},seen:null,review:[],topic:'invalid',errors:null,strategyViews:'2'},katya:{}},
  mathSecrets:{alex:{unlocked:['mirror-facts'],review:{'mirror-facts':{stage:1,due:123,last:100}}},katya:{}}
};
const context = vm.createContext({
  console, Date, Math, Set, Map, JSON, String, Number, Array, Object, RegExp,
  CustomEvent: class { constructor(type){this.type=type} },
  state:saved, Store:{set(){}},
  window:{dispatchEvent(){},matchMedia(){return{matches:false}}},
  document:{head:nodeStub(),body:nodeStub(),createElement:nodeStub,getElementById(){return null},addEventListener(){},querySelector(){return null}},
  setTimeout(){}, clearTimeout(){}
});
context.window.window = context.window;
vm.runInContext(fs.readFileSync(new URL('../math-secrets.js', import.meta.url), 'utf8'), context);
const api = context.window.MathThinkingSystem;
assert.ok(api, 'Math Thinking API must initialize');
assert.equal(api.secrets.length, 150, 'catalogue must contain exactly 150 strategies');
const required = ['id','title','topic','strand','minGrade','maxGrade','prerequisiteIds','explanation','workedExample','memoryHook','commonMistake','patternHunterQuestion','reviewTags'];
const ids = new Set();
for (const strategy of api.secrets) {
  for (const key of required) assert.ok(strategy[key] !== undefined && strategy[key] !== '', `${strategy.id || 'unknown'} missing ${key}`);
  assert.ok(!ids.has(strategy.id), `duplicate strategy ID: ${strategy.id}`);
  ids.add(strategy.id);
  assert.ok(api.topics[strategy.topic], `${strategy.id} has broken topic ${strategy.topic}`);
  assert.ok(Number.isInteger(strategy.minGrade) && Number.isInteger(strategy.maxGrade) && strategy.minGrade <= strategy.maxGrade, `${strategy.id} has invalid grade range`);
}
for (const strategy of api.secrets) {
  for (const prerequisite of strategy.prerequisiteIds) assert.ok(ids.has(prerequisite), `${strategy.id} has invalid prerequisite ${prerequisite}`);
}
const migrated = api.reportData('alex');
assert.ok(Array.isArray(migrated.unlocked), 'malformed unlocked data must be repaired');
assert.ok(Array.isArray(migrated.events), 'malformed events data must be repaired');
assert.ok(migrated.unlocked.includes('multiplication.mirror-facts'), 'legacy unlock ID must migrate');
assert.equal(migrated.review['multiplication.mirror-facts'].stage, 1, 'legacy review schedule must migrate');
assert.equal(api.selectStrategy('bedmas',{child:'alex',grade:5}).topic, 'orderops', 'BEDMAS must normalize to the catalogue topic');
assert.equal(api.selectStrategy('ratios',{child:'alex',grade:5}), null, 'out-of-grade strategies must not be used as fallbacks');
assert.equal(api.secrets.find(x=>x.id==='geometry.pythagorean').minGrade,8,'Pythagorean Theorem must remain Grade 8');
assert.equal(api.secrets.find(x=>x.id==='algebra.difference-squares').minGrade,8,'advanced algebra must not be offered before Grade 8');
assert.equal(api.secrets.find(x=>x.id==='algebra.difference-squares').enrichment,true,'content beyond Grade 8 must be labelled enrichment');
console.log(`Validated ${api.secrets.length} Math Thinking strategies, ${ids.size} unique IDs, required fields, grades, topics, and prerequisites.`);
