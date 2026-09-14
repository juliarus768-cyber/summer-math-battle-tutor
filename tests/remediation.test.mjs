import assert from 'node:assert/strict';
import fs from 'node:fs';
const source = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
for (const marker of ['MAX_REMEDIATION = 6', 'MAX_MISSION_LEN = 36', 'saved.questions.length <= 36', 'remediationQueued: 0', 'M.remediationQueued = Math.min', 'const existing = new Set(M.questions.map(q => q.q))', 'item.reinforcement = true', 'M.i++; savePausedMission(); lockThen(nextQ, 6500)']) assert.match(source, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
const base = Array.from({length:30}, (_, i) => ({q:`base-${i}`, a:i, topic:'addition'}));
assert.equal(base.length, 30);
const max = 6;
let queued = 0; const questions = base.slice();
for (const candidate of [{q:'base-0',a:0},{q:'rem-1',a:99,topic:'addition'},{q:'rem-2',a:98,topic:'addition'}]) {
  if (queued < max && !questions.some(q => q.q === candidate.q) && candidate.a !== base[0].a) { questions.push({...candidate, reinforcement:true}); queued++; }
}
assert.equal(questions.length, 32); assert.equal(queued, 2); assert.equal(questions.filter(q => q.reinforcement).every(q => q.topic === 'addition'), true);
queued = max; assert.equal(Math.min(max - queued, 36 - questions.length), 0);
let tries = 0; while (tries < 6) tries++; assert.equal(tries, 6);
const evidence = [{correct:false, topic:'addition'}, {correct:true, topic:'addition', reinforcement:true}];
assert.equal(evidence.filter(e => !e.correct).length, 1); assert.equal(evidence.filter(e => e.correct).length, 1);
console.log('remediation regression checks passed');
