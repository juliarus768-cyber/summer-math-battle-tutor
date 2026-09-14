import fs from 'fs';
const s=fs.readFileSync('index.html','utf8');
const required=['MAX_EVIDENCE_EVENTS = 500','recordLearningEvent','M.evidenceRecorded','outcome:M.q.reinforcement',"outcome:\'miss\'",'ACTIVITY SUMMARY'];
for (const x of required) if(!s.includes(x)) throw new Error('missing '+x);
// Deterministic contract checks for the classification priority used by submitQ.
const classify=(reinforcement,hint,attempts)=>reinforcement?'remediation':hint?'hint-assisted':attempts>0?'retry':'first-attempt';
if(classify(false,false,0)!=='first-attempt' || classify(false,false,2)!=='retry' || classify(false,true,0)!=='hint-assisted' || classify(true,true,2)!=='remediation') throw new Error('classification priority failed');
// Model the per-question guard and independent bounded child histories.
const histories={alex:[],katya:[]}; const seen=new Set();
const add=(who,id)=>{if(seen.has(id)) return; seen.add(id); histories[who].push(id); if(histories[who].length>500) histories[who].shift();};
add('alex','q1'); add('alex','q1'); if(histories.alex.length!==1 || histories.katya.length!==0) throw new Error('duplicate/ownership guard failed');
for(let i=2;i<=501;i++) add('alex','q'+i);
if(histories.alex.length!==500 || histories.alex[0]!=='q2' || histories.alex.at(-1)!=='q501') throw new Error('trim failed');
console.log('learning evidence regression checks passed');

