/* Parent-facing Math Thinking analytics for Summer Math Battle Tutor. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
function ready(){return typeof state!=='undefined'&&window.MathThinkingSystem}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function mastery(w,t){try{return typeof getMastery==='function'?getMastery(w,t):{seen:0,correct:0,recent:[]}}catch(e){return{seen:0,correct:0,recent:[]}}}
function accuracy(m){return m.seen?Math.round((m.correct/m.seen)*100):0}
function reportFor(w){
 const api=window.MathThinkingSystem,topics=api.topics,secrets=api.secrets,p=state.mathSecrets&&state.mathSecrets[w]?state.mathSecrets[w]:{unlocked:[],review:{},patternWins:0};
 const unlocked=new Set(p.unlocked||[]),now=Date.now();
 const rows=Object.entries(topics).map(([id,t])=>{const m=mastery(w,id),topicSecrets=secrets.filter(s=>s.topic===id),u=topicSecrets.filter(s=>unlocked.has(s.id)).length;return{id,name:t.name,icon:t.icon,seen:m.seen||0,correct:m.correct||0,accuracy:accuracy(m),unlocked:u,total:topicSecrets.length}}).filter(r=>r.seen||r.unlocked).sort((a,b)=>(b.seen-a.seen)||(a.accuracy-b.accuracy));
 const due=(p.unlocked||[]).filter(id=>{const r=p.review&&p.review[id];return !r||!r.due||r.due<=now}).length;
 const totalCorrect=rows.reduce((n,r)=>n+r.correct,0),totalSeen=rows.reduce((n,r)=>n+r.seen,0);
 return{rows,due,totalUnlocked:unlocked.size,totalSecrets:secrets.length,patternWins:p.patternWins||0,totalCorrect,totalSeen,accuracy:totalSeen?Math.round(totalCorrect/totalSeen*100):0};
}
function recommendations(data){
 const active=data.rows.filter(r=>r.seen>=2);if(!active.length)return['Complete a few missions to begin strategy analytics.'];
 const weak=[...active].sort((a,b)=>a.accuracy-b.accuracy).slice(0,3);
 const strong=[...active].sort((a,b)=>b.accuracy-a.accuracy).slice(0,2);
 const out=[];
 if(weak[0]&&weak[0].accuracy<75)out.push(`Prioritize ${weak.map(r=>r.name).join(', ')} with guided examples and untimed practice.`);
 if(data.due)out.push(`Complete ${data.due} due Math Secret review${data.due===1?'':'s'} before introducing harder work.`);
 if(data.patternWins<5)out.push('Use Pattern Hunter before difficult questions to strengthen strategy selection.');
 if(strong.length)out.push(`Current strengths: ${strong.map(r=>`${r.name} (${r.accuracy}%)`).join(', ')}.`);
 return out.slice(0,4);
}
function childCard(w){const d=reportFor(w),name=w==='alex'?'Alex':'Katya';return`<section class="mpr-child"><div class="mpr-child-head"><div><h2>${name}</h2><p>${d.accuracy}% overall accuracy · ${d.totalCorrect}/${d.totalSeen} correct</p></div><div class="mpr-kpis"><span><b>${d.totalUnlocked}</b> secrets</span><span><b>${d.due}</b> due</span><span><b>${d.patternWins}</b> patterns</span></div></div><div class="mpr-recs"><h3>Recommended next focus</h3>${recommendations(d).map(x=>`<p>• ${esc(x)}</p>`).join('')}</div><div class="mpr-table"><div class="mpr-row mpr-title"><span>Topic</span><span>Accuracy</span><span>Practice</span><span>Secrets</span></div>${d.rows.length?d.rows.map(r=>`<div class="mpr-row"><span>${esc(r.icon)} ${esc(r.name)}</span><span class="${r.accuracy>=80?'good':r.accuracy>=65?'mid':'needs'}">${r.accuracy}%</span><span>${r.correct}/${r.seen}</span><span>${r.unlocked}/${r.total}</span></div>`).join(''):'<p class="mpr-empty">No math activity recorded yet.</p>'}</div></section>`}
function render(){if(!ready())return;const body=$('mpr-body');if(body)body.innerHTML=childCard('alex')+childCard('katya')}
const style=document.createElement('style');style.textContent=`.mpr-btn{position:fixed;top:max(12px,env(safe-area-inset-top));right:12px;z-index:185;display:none;border:2px solid rgba(61,255,139,.6);background:#0a1820;color:#fff;border-radius:14px;padding:10px 13px;font:800 12px var(--raj);letter-spacing:1px}.mpr-btn.show{display:block}.mpr-modal{position:fixed;inset:0;z-index:280;background:rgba(2,4,12,.92);backdrop-filter:blur(12px);display:none;align-items:center;justify-content:center;padding:16px}.mpr-modal.open{display:flex}.mpr-panel{width:min(1100px,100%);max-height:94dvh;overflow:auto;background:#0a0f1f;border:1px solid rgba(61,255,139,.45);border-radius:24px;padding:22px}.mpr-head{display:flex;justify-content:space-between;gap:12px;align-items:start;margin-bottom:16px}.mpr-head h1{font:900 clamp(22px,5vw,34px) var(--orb);color:#3dff8b}.mpr-head p{color:#8fa3c8;margin-top:5px}.mpr-close{min-width:48px;min-height:48px;border:1px solid rgba(255,255,255,.2);border-radius:12px;background:rgba(255,255,255,.05);color:#fff;font-size:22px}.mpr-child{border:1px solid rgba(120,150,255,.18);border-radius:18px;padding:16px;margin-top:14px;background:rgba(255,255,255,.025)}.mpr-child-head{display:flex;justify-content:space-between;gap:12px;align-items:center}.mpr-child h2{font:900 22px var(--orb);color:#ffc93c}.mpr-child p{color:#cbd8f2}.mpr-kpis{display:flex;gap:7px;flex-wrap:wrap}.mpr-kpis span{background:rgba(255,255,255,.05);border:1px solid rgba(120,150,255,.2);border-radius:11px;padding:7px 9px;color:#8fa3c8}.mpr-kpis b{color:#fff}.mpr-recs{margin:14px 0;padding:12px;border-left:3px solid #19c9ff;background:rgba(25,201,255,.05)}.mpr-recs h3{font:800 13px var(--orb);color:#19c9ff;margin-bottom:5px}.mpr-recs p{line-height:1.4}.mpr-table{overflow:auto}.mpr-row{display:grid;grid-template-columns:minmax(170px,1.6fr) repeat(3,minmax(80px,.6fr));gap:8px;padding:9px;border-bottom:1px solid rgba(255,255,255,.06);align-items:center}.mpr-title{font-weight:800;color:#8fa3c8;text-transform:uppercase;font-size:11px;letter-spacing:1px}.good{color:#3dff8b}.mid{color:#ffc93c}.needs{color:#ff6b86}.mpr-empty{padding:14px}@media(max-width:700px){.mpr-panel{padding:14px}.mpr-child-head{align-items:flex-start;flex-direction:column}.mpr-row{grid-template-columns:minmax(145px,1.4fr) repeat(3,minmax(70px,.6fr));font-size:13px}.mpr-btn{top:auto;bottom:58px;right:8px}}`;document.head.appendChild(style);
const btn=document.createElement('button');btn.className='mpr-btn';btn.type='button';btn.textContent='📊 MATH REPORT';document.body.appendChild(btn);
const modal=document.createElement('div');modal.className='mpr-modal';modal.id='mpr-modal';modal.innerHTML='<section class="mpr-panel" role="dialog" aria-modal="true"><div class="mpr-head"><div><h1>📊 Math Thinking Report</h1><p>Mastery, strategy use, Math Secrets, reviews, and recommended next steps.</p></div><button class="mpr-close" aria-label="Close">×</button></div><div id="mpr-body"></div></section>';document.body.appendChild(modal);
btn.onclick=()=>{render();modal.classList.add('open')};modal.querySelector('.mpr-close').onclick=()=>modal.classList.remove('open');modal.onclick=e=>{if(e.target===modal)modal.classList.remove('open')};
function visibility(){try{btn.classList.toggle('show',state.activeProfile==='parent'||state.activePlayer==='parent'||window.parentUnlocked===true)}catch(e){}}
if(typeof paint==='function'){const old=paint;window.paint=function(){const out=old();visibility();return out};try{paint=window.paint}catch(e){}}
setInterval(visibility,1000);visibility();
window.MathParentReport={open:()=>{render();modal.classList.add('open')},reportFor};
})();