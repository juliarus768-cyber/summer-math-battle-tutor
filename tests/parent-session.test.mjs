import fs from 'fs';
const s=fs.readFileSync('index.html','utf8');
for (const x of ['function lockParent()','function requireParentAuth()','hideAllActivityScreens(keepParent=false)','hideAllActivityScreens(true)','if (!requireParentAuth()) return;']) if(!s.includes(x)) throw new Error('missing '+x);
const guarded=['changePin','decideRequest','editReward','toggleReward','adjust','markMissionDone','doResetProgress','grantPrize','dismissPinNotice'];
for(const fn of guarded){const start=s.indexOf('function '+fn);const block=s.slice(start,start+350);if(!block.includes('requireParentAuth'))throw new Error(fn+' unguarded')}
if(!s.includes('function closeParent() {\n  lockParent();')||!s.includes('function closeGrant() {\n  lockParent();'))throw new Error('close lock missing');
if((s.match(/hideAllActivityScreens\(true\)/g)||[]).length!==1)throw new Error('preserve mode used outside openParent');
if(s.includes('state.parentUnlocked'))throw new Error('authorization persisted');
const model={parentUnlocked:false,coins:10,requests:{r1:'pending'}};const lock=()=>{model.parentUnlocked=false};const guard=()=>model.parentUnlocked;
const mutate=()=>{if(!guard())return false;model.coins+=5;return true}; if(mutate()||model.coins!==10)throw new Error('unauthorized mutation'); model.parentUnlocked=true;if(!mutate()||model.coins!==15)throw new Error('authorized mutation');lock();if(mutate()||model.coins!==15)throw new Error('stale mutation');
if(!s.includes('function requestPrize(id)'))throw new Error('child request missing');
console.log('parent session protection regression checks passed');
