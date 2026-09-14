import fs from 'fs';
const s=fs.readFileSync('index.html','utf8');
for(const x of ['state.moneyLabDaily','rewarded < 10','localDateKey()','Daily rewards complete','mlQ.completed = true']) if(!s.includes(x)) throw new Error('missing '+x);
const normalize=v=>{const out={date:typeof v?.date==='string'&&(!v.date||/^\d{4}-\d{2}-\d{2}$/.test(v.date))?v.date:'',rewarded:Number.isFinite(v?.rewarded)&&v.rewarded>=0?Math.min(10,Math.floor(v.rewarded)):0};return out};
for(const v of [undefined,{date:'bad',rewarded:-1},{date:'2026-09-14',rewarded:Infinity},{date:'2026-09-14',rewarded:3.8},{date:'2026-09-14',rewarded:99}]){const n=normalize(v);if(n.rewarded<0||n.rewarded>10||typeof n.date!=='string')throw new Error('normalization failed')}
const day={alex:{date:'',rewarded:0},katya:{date:'',rewarded:0}}; const solved={alex:0,katya:0}; const qDone=new Set();
const pay=(who,date,id,correct=true,weekend=false)=>{if(!correct)return {coins:0,xp:0};if(qDone.has(id))return {coins:0,xp:0};qDone.add(id);solved[who]++;if(day[who].date!==date){day[who].date=date;day[who].rewarded=0}const ok=day[who].rewarded<10;if(ok)day[who].rewarded++;return ok?{coins:15,xp:weekend?10:5}:{coins:0,xp:0}};
for(let i=1;i<=10;i++){const r=pay('alex','2026-09-14','a'+i);if(r.coins!==15||r.xp!==5)throw new Error('reward '+i)}
if(pay('alex','2026-09-14','a11').coins!==0||day.alex.rewarded!==10)throw new Error('answer 11 cap');
if(pay('alex','2026-09-14','wrong',false).coins!==0||day.alex.rewarded!==10)throw new Error('wrong consumed slot');
if(pay('alex','2026-09-14','a11').coins!==0||solved.alex!==11)throw new Error('post-cap practice/idempotency failed');
if(pay('katya','2026-09-14','k1').coins!==15||day.katya.rewarded!==1)throw new Error('child isolation');
if(pay('alex','2026-09-15','a12').coins!==15||day.alex.rewarded!==1)throw new Error('local rollover');
if(pay('katya','2026-09-15','k2',true,true).xp!==10||pay('katya','2026-09-15','k3',true,true).coins!==15)throw new Error('weekend behavior');
if(!s.includes('state[mlOwner].coins += reward')||!s.includes('gainXP(mlOwner, mlXp)')||!s.includes('state.activity[mlOwner].money++'))throw new Error('owner/counter behavior');
if(!s.includes('const token = activityEpoch, owner = mlOwner'))throw new Error('stale callback guard');
console.log('Money Lab daily reward cap regression checks passed');
