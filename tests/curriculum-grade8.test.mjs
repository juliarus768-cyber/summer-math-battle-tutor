import fs from 'node:fs'; import vm from 'node:vm';
const src=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=src.indexOf('const TOPIC_BANK ='); const end=src.indexOf('/* ============ BRAIN BOOST',start);
const code=src.slice(start,end)+';globalThis.bank=TOPIC_BANK;';
let seed=17; const ctx={globalThis:{},R:(a,b)=>{seed=(seed*1103515245+12345)>>>0;return a+(seed%(b-a+1));},RNZ:(a,b)=>a===0?1:a,pick:a=>a[0],shuffle:a=>a.slice(),gcd:(a,b)=>{while(b){[a,b]=[b,a%b]}return Math.abs(a)||1},missionChoices:(c,x)=>[String(c),...x].filter((v,i,a)=>a.indexOf(v)===i).slice(0,3),sgn:n=>String(n),FRIENDS:['A']}; ctx.globalThis=ctx;
vm.runInNewContext(code,ctx); const bank=ctx.bank.alex;
const plan={bedmas:3,fractions:4,decimals:2,percent:1,ratios:3,algebra:4,geometry:3,data:2,probability:1,money:2,wordproblems:1,integers:2,longdivision:2};
let exercised=0;
for(const [topic,count] of Object.entries(plan)){ if(!bank[topic]) throw new Error(`missing Alex topic ${topic}`); for(let i=0;i<Math.max(20,count);i++){ const q=bank[topic][i%bank[topic].length](1); exercised++; if(!q||q.who==='katya'||q.a===undefined||String(q.q).includes('undefined')||String(q.q).includes('NaN')||String(q.q).includes('Infinity')) throw new Error(`invalid ${topic}`); if(q.choices){const c=q.choices.map(String); if(new Set(c).size!==c.length||!c.includes(String(q.a))) throw new Error(`choice integrity ${topic}`);} if(topic==='longdivision'){const m=q.q.match(/(\d+) ÷ (\d+).*?/); const ans=String(q.a).match(/(\d+) r (\d+)/); if(!m||!ans||Number(ans[2])>=Number(m[2])||Number(m[1])!==Number(m[2])*Number(ans[1])+Number(ans[2])) throw new Error('long division invariant');} }}
if(Object.values(plan).reduce((a,b)=>a+b,0)!==30) throw new Error('plan total');
if(!src.includes("const KATYA_GRADE5_PLAN")) throw new Error('Katya plan missing');
console.log(`Grade 8 curriculum behavioral checks passed (${exercised} generated questions)`);
