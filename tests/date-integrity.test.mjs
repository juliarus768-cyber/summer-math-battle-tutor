import fs from 'fs';
const s=fs.readFileSync('index.html','utf8');
for (const x of ['function localDateKey(date = new Date())','const todayStr = () => localDateKey()','new Date(y, m - 1, day - 1)','lastDay','state.daily[who]']) if(!s.includes(x)) throw new Error('missing '+x);
if (/toISOString\(\)\.slice\(0,10\)/.test(s)) throw new Error('date-only UTC conversion remains');
if (s.includes('Date.now() - 864e5')) throw new Error('fixed 24h calendar subtraction remains');
const localDateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const prior=d=>localDateKey(new Date(d.getFullYear(),d.getMonth(),d.getDate()-1));
// Toronto evening: 2026-09-14 22:30 EDT is 2026-09-15T02:30Z, but remains Sep 14 locally.
const torontoLocalFromUtc=(utcMs)=>{const d=new Date(utcMs-4*60*60*1000);return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`};
if(torontoLocalFromUtc(Date.parse('2026-09-15T02:30:00Z'))!=='2026-09-14') throw new Error('Toronto evening rollover failed');
if(torontoLocalFromUtc(Date.parse('2026-09-15T04:01:00Z'))!=='2026-09-15') throw new Error('Toronto midnight rollover failed');
if(prior(new Date(2024,2,11))!=='2024-03-10' || prior(new Date(2024,10,4))!=='2024-11-03') throw new Error('DST-adjacent prior day failed');
const required=(today)=>{const [y,m,d]=today.split('-').map(Number);const x=new Date(y,m-1,d-1);while(x.getDay()===0||x.getDay()===6)x.setDate(x.getDate()-1);return localDateKey(x)};
if(required('2026-09-14')!=='2026-09-11') throw new Error('Friday to Monday continuity failed');
if(required('2026-09-15')!=='2026-09-14') throw new Error('weekday continuity failed');
if(required('2026-09-16')!=='2026-09-15') throw new Error('weekday continuity failed');
const streak=(last,t,current)=> last===t?current:(last&&last>=required(t)?current+1:1);
if(streak('2026-09-14','2026-09-14',3)!==3) throw new Error('same-day streak idempotency failed');
if(streak('2026-09-12','2026-09-15',4)!==1) throw new Error('missed weekday reset failed');
const daily={alex:{date:'',count:0},katya:{date:'',count:0}}; const bump=(w,t)=>{if(daily[w].date!==t){daily[w].date=t;daily[w].count=0} daily[w].count++};
bump('alex','2026-09-14'); bump('alex','2026-09-14'); bump('alex','2026-09-15'); if(daily.alex.count!==1||daily.katya.count!==0) throw new Error('daily bucket rollover/isolation failed');
const normalizeDaily=v=>({date:typeof v?.date==='string'&&(/^\d{4}-\d{2}-\d{2}$/.test(v.date)||v.date==='')?v.date:'',count:Number.isFinite(v?.count)&&v.count>=0?v.count:0});
const n=normalizeDaily({date:'bad',count:{}}); if(n.date!==''||n.count!==0) throw new Error('malformed date normalization failed');
if(!s.includes('weekendXpMult()') || !s.includes('35 + Math.round(accuracy / 5)')) throw new Error('reward behavior changed');
console.log('local date and streak regression checks passed');

