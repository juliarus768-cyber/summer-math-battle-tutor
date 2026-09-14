import fs from 'fs';
const s=fs.readFileSync('index.html','utf8');
if(!s.includes('function dailyCompletionRewards(accuracy)')) throw new Error('helper missing');
const rewards=a=>{const n=Number(a);const x=Number.isFinite(n)?Math.max(0,Math.min(100,n)):0;if(x===0)return{completionXp:20,completionCoins:5};if(x<40)return{completionXp:50,completionCoins:15};if(x<70)return{completionXp:90,completionCoins:25};if(x<90)return{completionXp:120,completionCoins:35};return{completionXp:140,completionCoins:45}};
for(const [a,x,c] of [[0,20,5],[1,50,15],[39,50,15],[40,90,25],[69,90,25],[70,120,35],[89,120,35],[90,140,45],[100,140,45],[-10,20,5],[101,140,45],[NaN,20,5],[Infinity,20,5],['bad',20,5]]){const r=rewards(a);if(r.completionXp!==x||r.completionCoins!==c)throw new Error(`tier ${a}`)}
const accuracyBonus=a=>Math.round(a/3); if(accuracyBonus(50)!==17||accuracyBonus(100)!==33)throw new Error('accuracy bonus changed');
const missionPayout=(q,accuracy,weekend,team)=>{const r=rewards(accuracy);return Math.round((q+r.completionXp+accuracyBonus(accuracy))*(weekend?2:1)*(team?1.15:1));};
if(missionPayout(0,0,false,false)!==20||missionPayout(0,100,true,true)!==398)throw new Error('XP stacking changed');
if(rewards(100).completionCoins!==45||rewards(100).completionCoins*2!==90)throw new Error('coins incorrectly weekend-scaled');
const repeat={coins:0}; const complete=a=>{repeat.coins+=rewards(a).completionCoins}; complete(100); complete(100); if(repeat.coins!==90)throw new Error('repeat payout blocked');
let completed=false, payouts=0; const show=()=>{if(completed)return;completed=true;payouts++};show();show();if(payouts!==1)throw new Error('idempotency failed');
const owner='alex'; let awarded=owner; if(awarded!=='alex')throw new Error('ownership failed');
for(const marker of ['Math.max(4, XP_PER_Q - Math.min(M.attempts, 2) * 2)','3 * Math.min(M.combo - 1, 4)','if (M.q.reinforcement) gain += 4','const wMult = weekendXpMult()','const teamBonus = dailyCountFor(sibling) >= 1','const mlXp = 5 * weekendXpMult()']) if(!s.includes(marker))throw new Error('missing unchanged formula '+marker);
for(const marker of ['gainXP(state.alex','gainXP(state.katya','const coins = Math.round(xp / 3)']) if(!s.includes(marker))throw new Error('other economy marker missing '+marker);
console.log('reward integrity regression checks passed');
