/* PIN-gated Parent Dashboard analytics for Math Thinking System v3. */
(() => {
'use strict';
if (window.__MATH_PARENT_REPORT_LOADED__) return;
window.__MATH_PARENT_REPORT_LOADED__ = true;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=(a,b)=>b?Math.round(a/b*100):0;
function api(){return window.MathThinkingSystem}
function questionOutcomes(events){
 const grouped=new Map();
 events.forEach((event,index)=>{
  const key=event.questionKey||`legacy-${index}`;
  const current=grouped.get(key)||{...event,correct:false};
  current.correct=current.correct||!!event.correct;
  if(event.t>=current.t)Object.assign(current,event,{correct:current.correct||!!event.correct});
  grouped.set(key,current);
 });
 return[...grouped.values()].sort((a,b)=>a.t-b.t);
}
function summary(w){
 const system=api(),p=system.reportData(w),events=p.events||[],questions=questionOutcomes(events),now=Date.now(),recent=questions.filter(e=>e.t>=now-14*86400000),correct=questions.filter(e=>e.correct).length,recentCorrect=recent.filter(e=>e.correct).length;
 const topics=Object.entries(p.topic||{}).map(([id,t])=>({id,name:system.topics[id]?.name||id,seen:t.seen||0,correct:t.correct||0,accuracy:pct(t.correct,t.seen),recent:(t.recent||[]).slice(-10)})).sort((a,b)=>b.seen-a.seen);
 const errors=Object.entries(p.errors||{}).filter(([name])=>name!=='other').sort((a,b)=>b[1]-a[1]);
 const due=system.dueReviews(w).length,unlocked=(p.unlocked||[]).length;
 const first=questions.slice(0,Math.ceil(questions.length/2)),last=questions.slice(Math.ceil(questions.length/2));
 const improvement=questions.length>=8?pct(last.filter(e=>e.correct).length,last.length)-pct(first.filter(e=>e.correct).length,first.length):null;
 const weak=topics.filter(t=>t.seen>=2).sort((a,b)=>a.accuracy-b.accuracy)[0];
 const coverage=Object.keys(system.topics).length?Math.round(topics.filter(t=>t.seen>0).length/Object.keys(system.topics).length*100):0;
 return{p,events,questions,recent,topics,errors,due,unlocked,accuracy:pct(correct,questions.length),recentAccuracy:pct(recentCorrect,recent.length),improvement,focus:weak?weak.name:'Complete more questions to establish a focus',coverage};
}
function card(w){
 const d=summary(w),name=w==='alex'?'Alex':'Katya',errorLabel=x=>x.replace(/-/g,' ');
 const mastery=d.topics.length?d.topics.map(t=>`<div class="mpr-row"><span>${esc(t.name)}</span><span>${t.accuracy}%</span><span>${t.correct}/${t.seen}</span></div>`).join(''):'<p class="mpr-empty">No question evidence yet.</p>';
 return`<article class="mpr-child"><header><div><h3>${name}</h3><p>Updated ${new Date(d.p.updatedAt||Date.now()).toLocaleString()}</p></div><span class="mpr-version">System ${esc(api().version)}</span></header>
 <div class="mpr-kpis"><span><b>${d.accuracy}%</b> overall accuracy</span><span><b>${d.recentAccuracy}%</b> recent accuracy</span><span><b>${d.p.hintsUsed||0}</b> hints</span><span><b>${d.p.strategyViews||0}</b> strategy views</span><span><b>${d.p.patternAttempts||0}</b> Pattern attempts</span><span><b>${d.p.patternUseful||0}</b> useful patterns</span><span><b>${d.unlocked}</b> secrets</span><span><b>${d.due}</b> reviews due</span></div>
 <div class="mpr-grid"><section><h4>Recommended next focus</h4><p>${esc(d.focus)}${d.due?` · Complete ${d.due} due review${d.due===1?'':'s'} in upcoming missions.`:''}</p><p>Math Thinking catalogue coverage: ${d.coverage}%</p><p>Improvement over time: ${d.improvement==null?'More evidence needed':`${d.improvement>=0?'+':''}${d.improvement} percentage points`}</p><p>Rushed-answer signal: not measured because answer timing is not collected.</p></section>
 <section><h4>Recurring error patterns</h4>${d.errors.length?d.errors.slice(0,5).map(([e,n])=>`<p>${esc(errorLabel(e))}: <b>${n}</b></p>`).join(''):'<p>No recurring pattern recorded yet.</p>'}</section></div>
 <section><h4>Mastery by topic</h4><div class="mpr-table"><div class="mpr-row mpr-title"><span>Topic</span><span>Accuracy</span><span>Correct</span></div>${mastery}</div></section></article>`;
}
function ensureHost(){
 const parent=document.getElementById('parent-content');if(!parent)return null;
 let host=document.getElementById('math-thinking-report');
 if(!host){host=document.createElement('section');host.id='math-thinking-report';host.className='parent-section';host.innerHTML='<h2 style="margin-top:24px">📊 Math Thinking Report</h2><p class="mgr-note">Deterministic learning analytics from saved question and strategy evidence.</p><div id="mpr-body"></div>';parent.appendChild(host)}
 return host.querySelector('#mpr-body');
}
function render(){if(!api())return;const body=ensureHost();if(body)body.innerHTML=card('alex')+card('katya')}
const style=document.createElement('style');style.textContent=`
.mpr-child{border:1px solid rgba(120,150,255,.2);border-radius:18px;padding:16px;margin:14px 0;background:rgba(255,255,255,.025)}.mpr-child header{display:flex;justify-content:space-between;gap:12px;align-items:start}.mpr-child h3{font:900 20px var(--orb);color:var(--gold)}.mpr-child h4{font:800 13px var(--orb);color:var(--cyan);margin:14px 0 7px}.mpr-child p{color:var(--muted);line-height:1.45}.mpr-version{color:var(--green);font-size:12px}.mpr-kpis{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.mpr-kpis span{padding:8px 10px;border:1px solid var(--line);border-radius:10px;color:var(--muted)}.mpr-kpis b{color:var(--text)}.mpr-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.mpr-grid section{background:rgba(255,255,255,.025);padding:12px;border-radius:12px}.mpr-table{overflow-x:auto}.mpr-row{display:grid;grid-template-columns:minmax(160px,1fr) 90px 90px;gap:8px;padding:8px;border-bottom:1px solid rgba(255,255,255,.06)}.mpr-title{font-size:11px;text-transform:uppercase;color:var(--muted);font-weight:800}@media(max-width:720px){.mpr-grid{grid-template-columns:1fr}.mpr-row{grid-template-columns:minmax(130px,1fr) 75px 75px}.mpr-child{padding:12px}}`;
document.head.appendChild(style);
window.MathParentReport={render,summary,questionOutcomes};
window.addEventListener('math-thinking-ready',render,{once:true});
render();
})();
