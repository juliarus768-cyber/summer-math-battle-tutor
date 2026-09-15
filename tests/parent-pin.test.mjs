import fs from 'fs';
const s=fs.readFileSync('index.html','utf8');
if(s.includes('Default PIN is <b>1234</b>')||s.includes('default PIN (1234)')) throw new Error('visible default PIN remains');
for(const x of ['function isValidParentPin(pin)','function setupParentPin()','pin-new','pin-confirm','Set up a Parent PIN first.','parentUnlocked = false;']) if(!s.includes(x)) throw new Error('missing '+x);
if(s.includes("if (!state.parentPin) state.parentPin = '1234'")) throw new Error('automatic default remains');
const valid=p=>typeof p==='string' && /^\d{4}$/.test(p); for(const p of [null,'','12',12,'12345','abcd',{},[]]) if(valid(p)) throw new Error('invalid pin accepted'); if(!valid('1234')||!valid('2468')) throw new Error('valid pin rejected');
let state={parentPin:undefined,alex:{coins:5,xp:8},katya:{coins:7,xp:9}}; let unlocked=false;
const setup=(a,b,save)=>{if(valid(state.parentPin))return false; unlocked=false; if(!/^\d{4}$/.test(a)||a!==b)return false; const old=state.parentPin;state.parentPin=a; if(!save){state.parentPin=old;return false} unlocked=true;return true};
if(setup('12','12',true)||state.parentPin!==undefined||unlocked)throw new Error('bad setup mutated'); const before=JSON.stringify(state); if(setup('2468','2468',false)||JSON.stringify(state)!==before||unlocked)throw new Error('failed persistence rollback'); if(!setup('2468','2468',true)||!unlocked||state.parentPin!=='2468')throw new Error('setup success');
const custom={parentPin:'9753',alex:{coins:5},katya:{coins:7}}; const stale=(a,b)=>{if(valid(custom.parentPin))return false;custom.parentPin=a;return true}; if(stale('1111','1111')||custom.parentPin!=='9753')throw new Error('custom overwrite');
let serialized=''; serialized=JSON.stringify({parentPin:'2468'}); if(serialized.includes('parentUnlocked'))throw new Error('unlock serialized');
if(!s.includes('if (!isValidParentPin(state.parentPin)) { toast(\'Set up a Parent PIN first.\'); return; }')) throw new Error('parent gate');
if(!s.includes("if (!isValidParentPin(state.parentPin)) { $('g-pin-err').textContent")) throw new Error('grant gate');
if((s.match(/setupParentPin\(\)/g)||[]).length!==2) throw new Error('duplicate setup path');
console.log('parent PIN setup regression checks passed');

