/* Summer Kids App — Math Thinking System v2.0
   Contextual Brain Boosts, Pattern Hunter, unlockable Math Secrets,
   spaced review, mastery tracking, and a child-friendly strategy library. */
(() => {
'use strict';
const VERSION='2.0.0';
const DAY=86400000;
const REVIEW_GAPS=[1,3,7,14,30];

const TOPICS={
 multiplication:{name:'Multiplication',icon:'✖️',grades:[4,5,6,7,8],strategy:'Look for structure before calculating: flip the fact, use ×1/×2/×5/×10, use ×9 as ×10 minus one group, or split a number into friendly chunks.',example:'23 × 6 = (20 × 6) + (3 × 6) = 120 + 18 = 138.',memoryHook:'Notice, split, solve, check.',commonMistake:'trying to memorize every fact without using patterns',patternQuestion:'Which shortcut or split makes this multiplication easier?'},
 division:{name:'Division',icon:'➗',grades:[4,5,6,7,8],strategy:'Treat division as multiplication in reverse. Ask what number times the divisor gives the total. For larger totals, split into friendly divisible chunks.',example:'84 ÷ 4 = 80 ÷ 4 + 4 ÷ 4 = 20 + 1 = 21.',memoryHook:'Division rewinds multiplication.',commonMistake:'dividing in the wrong direction',patternQuestion:'Which multiplication fact or friendly chunk helps?'},
 longdivision:{name:'Long Division',icon:'🔍',grades:[5,6,7,8],strategy:'Estimate first. Use partial quotients: remove a large friendly multiple, divide the remainder, then combine the quotient parts.',example:'156 ÷ 6 = 120 ÷ 6 + 36 ÷ 6 = 20 + 6 = 26.',memoryHook:'Estimate, split, divide, combine, check.',commonMistake:'losing a partial quotient or remainder',patternQuestion:'What large multiple of the divisor fits first?'},
 fractions:{name:'Fractions',icon:'🍕',grades:[4,5,6,7,8],strategy:'The denominator tells the piece size. Add or subtract only equal-sized pieces. Multiply straight across and simplify. Divide by multiplying by the reciprocal of the second fraction.',example:'1/3 + 1/4 = 4/12 + 3/12 = 7/12.',memoryHook:'Same pieces to add; straight across to multiply; flip the second to divide.',commonMistake:'adding denominators',patternQuestion:'Do the pieces need a common denominator, or is this multiplication/division?'},
 decimals:{name:'Decimals',icon:'🔟',grades:[4,5,6,7,8],strategy:'Use place value. Line up decimal points for addition and subtraction. Estimate the size of the answer before calculating.',example:'3.7 + 0.46 = 3.70 + 0.46 = 4.16.',memoryHook:'Line up place values, not the last digits.',commonMistake:'misaligning decimal places',patternQuestion:'Which place values must line up?'},
 percent:{name:'Percent',icon:'%',grades:[5,6,7,8],strategy:'Use friendly anchors: 50%=half, 25%=quarter, 10%=divide by 10, 5%=half of 10%, 1%=divide by 100. Combine anchors.',example:'15% of 80 = 10% + 5% = 8 + 4 = 12.',memoryHook:'Find 10% first.',commonMistake:'using the wrong anchor or forgetting the base amount',patternQuestion:'Which friendly percent can you build from?'},
 ratios:{name:'Ratios & Rates',icon:'⚖️',grades:[6,7,8],strategy:'Keep comparison order consistent. Find one unit first, then scale up or down.',example:'4 tickets cost $20, so one ticket costs $5 and 7 tickets cost $35.',memoryHook:'Find one, then scale.',commonMistake:'switching ratio order',patternQuestion:'What is the value of one unit?'},
 integers:{name:'Integers',icon:'🛗',grades:[6,7,8],strategy:'Picture an elevator or number line. Positive means up/right; negative means down/left. Subtracting a negative reverses direction.',example:'3 − 7 means start at 3 and move 7 left to −4.',memoryHook:'Signs tell direction.',commonMistake:'memorizing sign rules without deciding direction',patternQuestion:'Which direction should you move?'},
 algebra:{name:'Algebra & Equations',icon:'⚖️',grades:[6,7,8],strategy:'Treat an equation like a balanced scale. Undo operations in reverse order and do the same thing to both sides.',example:'3x + 4 = 19. Subtract 4, then divide by 3. x=5.',memoryHook:'Same move on both sides.',commonMistake:'changing only one side or undoing in the wrong order',patternQuestion:'Which operation should be undone first?'},
 orderops:{name:'BEDMAS',icon:'🧩',grades:[5,6,7,8],strategy:'Brackets and exponents first. Multiplication/division share a level; addition/subtraction share a level. Work left to right within a level.',example:'5 + 3 × 4 = 5 + 12 = 17.',memoryHook:'Strong operations first.',commonMistake:'always solving left to right',patternQuestion:'Which operation has priority?'},
 exponents:{name:'Exponents',icon:'🚀',grades:[6,7,8],strategy:'The exponent counts repeated factors. Expand the power when unsure.',example:'2³ = 2 × 2 × 2 = 8.',memoryHook:'Exponent = number of copies of the base.',commonMistake:'multiplying the base by the exponent',patternQuestion:'How many equal factors are there?'},
 geometry:{name:'Geometry',icon:'📐',grades:[4,5,6,7,8],strategy:'Translate the question into a picture. Perimeter is around, area covers a surface, and volume fills a container.',example:'A 6 m by 4 m rectangle has perimeter 20 m and area 24 m².',memoryHook:'Around, cover, fill.',commonMistake:'using area when the question asks for perimeter',patternQuestion:'Does the problem ask for around, cover, or fill?'},
 coordinates:{name:'Coordinates',icon:'🗺️',grades:[5,6,7,8],strategy:'Read coordinates as (x,y): horizontal first, then vertical.',example:'(3,−2) means 3 right and 2 down.',memoryHook:'Across first, then up/down.',commonMistake:'switching x and y',patternQuestion:'What horizontal move comes first?'},
 probability:{name:'Probability',icon:'🎲',grades:[5,6,7,8],strategy:'Probability = favourable outcomes ÷ all possible outcomes. List the complete sample space.',example:'3 red and 2 blue counters gives P(red)=3/5.',memoryHook:'Wanted outcomes on top; total outcomes below.',commonMistake:'forgetting possible outcomes',patternQuestion:'What are all possible outcomes?'},
 mean:{name:'Mean & Average',icon:'⚖️',grades:[5,6,7,8],strategy:'The mean is a balance point. Add all values and divide by how many values there are. For evenly spaced values, the centre is the mean.',example:'99,100,101 balance at 100.',memoryHook:'Total shared equally.',commonMistake:'dividing by the wrong count',patternQuestion:'Can you see a balance point before adding?'},
 patterns:{name:'Patterns',icon:'🔁',grades:[4,5,6,7,8],strategy:'Compare consecutive terms. Test addition, subtraction, multiplication, division, or alternating rules. Work backward for a missing value.',example:'2,6,18,54 uses ×3, so next is 162.',memoryHook:'Ask what changed from here to here.',commonMistake:'assuming every pattern uses addition',patternQuestion:'What changed between each pair of terms?'},
 estimation:{name:'Estimation',icon:'🎯',grades:[4,5,6,7,8],strategy:'Round to friendly values before solving exactly. Compare the exact answer with the estimate.',example:'48 × 21 is about 50 × 20 = 1000, so 1008 is reasonable.',memoryHook:'Round, solve, compare.',commonMistake:'accepting an unreasonable exact answer',patternQuestion:'What nearby friendly numbers give a quick estimate?'},
 money:{name:'Money Math',icon:'💰',grades:[4,5,6,7,8],strategy:'Find the cost of one item, multiply by quantity, and count up for change. Use percent anchors for tax, tips, and discounts.',example:'Change from $20 for $13: count 13→15 (+2), 15→20 (+5), total $7.',memoryHook:'One item, all items, check the total.',commonMistake:'forgetting quantity or discount direction',patternQuestion:'Is this unit price, total cost, change, or percent?'},
 measurement:{name:'Measurement',icon:'📏',grades:[4,5,6,7,8],strategy:'Choose the correct unit and direction. Bigger unit to smaller unit means multiply; smaller to bigger means divide.',example:'3 m = 300 cm because 1 m = 100 cm.',memoryHook:'Smaller units mean more pieces.',commonMistake:'multiplying and dividing backwards',patternQuestion:'Are you converting to a larger or smaller unit?'},
 wordproblems:{name:'Word Problems',icon:'📖',grades:[4,5,6,7,8],strategy:'Read, highlight, draw, plan, solve, check. Follow the order of events and label the answer.',example:'18 stickers shared by 3 friends, then each finds 2 more: 18÷3=6, then 6+2=8 each.',memoryHook:'Read → Plan → Solve → Check.',commonMistake:'calculating before understanding the question',patternQuestion:'What is being asked, and which operation matches the story?'}
};

const SECRET_GROUPS={
 multiplication:[
 ['mirror-facts','Mirror Facts','4×7 and 7×4 are the same fact. Learn only one direction.'],
 ['easy-facts','Easy Facts First','×1 keeps the number, ×2 doubles, ×5 is half of ×10, and ×10 adds a zero for whole numbers.'],
 ['hard-eight','The Hard Eight','Focus extra practice on 6×7, 6×8, 6×9, 7×8, 7×9, 8×8, 8×9, and 9×9.'],
 ['mixed-recall','Shuffle the Facts','Mixed practice builds recall better than practising the table in order.'],
 ['mistake-loop','Practise the Misses','Repeat only missed facts after a delay, later that day, and the next day.'],
 ['nine-minus','The 9 Trick','Multiply by 10, then subtract one group.'],
 ['nine-check','Digit Sum Check for 9','Digits in multiples of 9 repeatedly add to 9. Use this as a check, not the main method.'],
 ['eleven-bridge','The 11 Bridge','For many two-digit numbers ×11, place the digit sum between the original digits and regroup if needed.'],
 ['double-half','Doubling and Halving','Double one factor and halve the other to keep the product unchanged.'],
 ['distribute','Break Apart Multiplication','Use the distributive property to split a factor into friendly parts.']
 ],
 division:[
 ['reverse-multiply','Division Rewind','Ask which multiplication fact creates the dividend.'],
 ['friendly-chunks','Friendly Division Chunks','Split a dividend into parts that divide evenly.'],
 ['estimate-quotient','Estimate the Quotient','Use nearby multiples to predict the size of a quotient.'],
 ['remainder-meaning','Remainder Meaning','Decide whether a remainder stays, becomes a fraction/decimal, or means one more group is needed.'],
 ['div-two','Divisible by 2','The last digit is even.'],['div-three','Divisible by 3','The digit sum is divisible by 3.'],['div-four','Divisible by 4','The last two digits form a multiple of 4.'],['div-five','Divisible by 5','The last digit is 0 or 5.'],['div-six','Divisible by 6','The number is divisible by both 2 and 3.'],['div-eight','Divisible by 8','The last three digits form a multiple of 8.'],['div-nine','Divisible by 9','The digit sum is divisible by 9.'],['div-ten','Divisible by 10','The last digit is 0.']
 ],
 fractions:[
 ['equal-pieces','Equal-Sized Pieces','Use a common denominator before adding or subtracting fractions.'],
 ['equivalent','Equivalent Fractions','Multiply or divide numerator and denominator by the same non-zero number.'],
 ['simplify-first','Simplify Early','Cancel common factors before multiplying when possible.'],
 ['straight-across','Straight Across','Multiply numerators together and denominators together.'],
 ['reciprocal','Reciprocal Flip','To divide fractions, multiply by the reciprocal of the second fraction.'],
 ['benchmark-fractions','Benchmark Fractions','Compare fractions to 0, 1/2, and 1 before calculating exactly.'],
 ['mixed-improper','Mixed and Improper','Convert mixed numbers to improper fractions for multiplication or division.'],
 ['fraction-of','Fraction of a Quantity','The word “of” usually means multiply.']
 ],
 decimals:[
 ['decimal-align','Line Up Decimals','Align decimal points so equal place values stay together.'],
 ['decimal-zero','Invisible Zeros','Add trailing zeros to make decimal place values easier to compare.'],
 ['decimal-estimate','Decimal Estimate','Round first to check whether the exact answer is reasonable.'],
 ['decimal-multiply','Decimal Product Size','Multiply as whole numbers, then place the decimal using total decimal places.'],
 ['decimal-divide','Make the Divisor Whole','Move the decimal in both dividend and divisor by the same number of places.']
 ],
 percent:[
 ['half-percent','50 Percent','50% means one half.'],['quarter-percent','25 Percent','25% means one quarter.'],['ten-anchor','10 Percent Anchor','10% means divide by 10.'],['five-percent','5 Percent','5% is half of 10%.'],['one-percent','1 Percent','1% means divide by 100.'],['fifteen-percent','15 Percent','15% = 10% + 5%.'],['seventy-five','75 Percent','75% = 50% + 25%.'],['percent-change','Percent Change','Compare the change with the original amount, not the new amount.'],['reverse-percent','Reverse Percent','When the final amount and percent are known, divide by the multiplier to recover the original.']
 ],
 integers:[
 ['integer-elevator','Integer Elevator','Positive values move up; negative values move down.'],
 ['opposites-zero','Opposites Make Zero','A number and its opposite add to zero.'],
 ['subtract-negative','Subtracting a Negative','Subtracting a negative reverses direction and becomes addition.'],
 ['same-sign-product','Same Signs Multiply Positive','Two negatives or two positives multiply to a positive.'],
 ['different-sign-product','Different Signs Multiply Negative','One negative and one positive multiply to a negative.']
 ],
 algebra:[
 ['balance-scale','Balance Scale','Do the same operation to both sides.'],
 ['inverse-operations','Inverse Operations','Addition/subtraction and multiplication/division undo each other.'],
 ['reverse-order','Undo in Reverse Order','Undo the last operation first.'],
 ['combine-like','Combine Like Terms','Only terms with the same variable part can combine.'],
 ['distributive-delivery','Distributive Delivery','The outside factor multiplies every term inside brackets.'],
 ['substitution','Substitution Check','Replace the variable with your answer to verify the equation.'],
 ['square-model','Perfect Square Model','(a+b)² contains a², two ab rectangles, and b².'],
 ['difference-squares','Difference of Squares','a²−b² factors as (a−b)(a+b).']
 ],
 geometry:[
 ['fence-cover-fill','Fence, Cover, Fill','Perimeter is around, area covers, and volume fills.'],
 ['rectangle-perimeter','Rectangle Perimeter','P=2(l+w), because there are two lengths and two widths.'],
 ['triangle-area','Triangle Half-Rectangle','A triangle with matching base and height is half a rectangle.'],
 ['parallelogram-area','Slide the Triangle','A parallelogram can be rearranged into a rectangle with the same base and height.'],
 ['circle-parts','Circle Parts','Radius goes centre to edge; diameter crosses the whole circle and equals two radii.'],
 ['pythagorean','Three-Square Theorem','In a right triangle, a²+b²=c².'],
 ['scale-factor','Scale Factor','Lengths multiply by k, areas by k², and volumes by k³.'],
 ['angle-line','Straight-Line Angles','Angles on a straight line total 180°.'],
 ['triangle-angles','Triangle Angles','Interior angles of a triangle total 180°.']
 ],
 coordinates:[
 ['xy-address','Coordinate Address','Read (x,y): horizontal first, vertical second.'],
 ['quadrants','Quadrant Signs','Quadrants follow (+,+), (−,+), (−,−), (+,−).'],
 ['coordinate-distance','Horizontal or Vertical Distance','Subtract matching coordinates and use the absolute value.']
 ],
 exponents:[
 ['factor-count','Exponent Factor Count','The exponent tells how many copies of the base are multiplied.'],
 ['power-one','Power of One','Any number to the power 1 stays the same.'],
 ['power-zero','Power of Zero','Any non-zero number to the power 0 equals 1.'],
 ['same-base-multiply','Multiply Same Bases','Add exponents when multiplying powers with the same base.'],
 ['same-base-divide','Divide Same Bases','Subtract exponents when dividing powers with the same base.']
 ],
 orderops:[
 ['bedmas-levels','BEDMAS Levels','Brackets and exponents first; then ×/÷ left to right; then +/− left to right.'],
 ['left-right-tie','Left-to-Right Ties','Multiplication does not always beat division; they share a level.'],
 ['bracket-purpose','Brackets Change Priority','Brackets tell you which calculation forms one unit.']
 ],
 ratios:[
 ['unit-rate','Unit Rate','Find the value for one unit before scaling.'],
 ['ratio-order','Ratio Order','Keep the comparison in the same order throughout.'],
 ['equivalent-ratio','Equivalent Ratios','Multiply or divide both parts of a ratio by the same number.'],
 ['proportion-cross','Proportion Check','Cross products are equal for equivalent ratios.']
 ],
 probability:[
 ['wanted-total','Wanted over Total','Favourable outcomes go over all possible outcomes.'],
 ['sample-space','Complete Sample Space','List every possible outcome once.'],
 ['complement','Complement Shortcut','P(not A)=1−P(A).'],
 ['experimental','Experimental Probability','Use observed successes divided by total trials.']
 ],
 mean:[
 ['balance-point','Average Balance Point','The mean is the value all data would have if shared equally.'],
 ['even-spacing','Evenly Spaced Mean','The centre of evenly spaced values is the mean.'],
 ['missing-value-mean','Missing Value from Mean','Mean × count gives the total; subtract known values to find the missing one.']
 ],
 patterns:[
 ['compare-neighbours','Compare Neighbours','Find what changes between consecutive terms.'],
 ['multiplicative-pattern','Multiplicative Pattern','Check whether each term is multiplied or divided by the same factor.'],
 ['alternating-pattern','Alternating Pattern','Some patterns switch between two rules.'],
 ['term-jumps','Count Jumps','From term 1 to term n there are n−1 jumps.'],
 ['work-backward','Work Backward','Use inverse operations to find missing earlier values.']
 ],
 estimation:[
 ['front-end','Front-End Estimate','Use the leading place values for a fast rough estimate.'],
 ['compatible-numbers','Compatible Numbers','Choose nearby numbers that calculate easily together.'],
 ['reasonableness','Reasonableness Check','Compare the exact answer with an estimate and the situation.']
 ],
 money:[
 ['unit-price','Unit Price','Divide total cost by quantity to compare products fairly.'],
 ['count-change','Count Up for Change','Count from the price to the amount paid.'],
 ['discount-direction','Discount Direction','Subtract the discount from the original price.'],
 ['tax-tip','Tax and Tip','Find the percent amount, then add it to the original.'],
 ['simple-interest','Simple Interest','Interest = principal × rate × time.']
 ],
 measurement:[
 ['metric-direction','Metric Direction','Bigger unit to smaller unit means multiply; smaller to bigger means divide.'],
 ['metric-prefix','Metric Prefix Pattern','kilo means 1000, centi means 1/100, milli means 1/1000.'],
 ['unit-check','Unit Check','Write the unit beside each number and in the final answer.'],
 ['time-not-decimal','Time Is Not Base Ten','60 minutes make an hour, not 100.']
 ],
 wordproblems:[
 ['read-plan-check','Read Plan Solve Check','Understand the story before choosing operations.'],
 ['label-answer','Label the Answer','Include the correct unit or object in the final answer.'],
 ['draw-model','Draw a Model','Use a bar, array, number line, or diagram to organize information.'],
 ['extra-information','Ignore Extra Information','Not every number in a word problem must be used.'],
 ['two-step-order','Follow Story Order','Complete operations in the order the events happen unless the structure says otherwise.']
 ]
};

const SECRETS=[];
Object.entries(SECRET_GROUPS).forEach(([topic,items])=>items.forEach(([id,name,text],index)=>SECRETS.push({id,topic,name,text,level:index<2?1:index<5?2:3})));

const PATTERN_CHOICES={
 multiplication:['Friendly fact or shortcut','Break into parts','Estimate first','No useful pattern'],
 division:['Reverse multiplication','Friendly chunks','Estimate quotient','No useful pattern'],
 fractions:['Common denominator','Multiply straight across','Use reciprocal','Compare to 1/2'],
 percent:['10% anchor','Half or quarter','Combine friendly percents','Convert to decimal'],
 integers:['Move on a number line','Use opposites','Reverse direction','Check sign only'],
 algebra:['Undo an operation','Balance both sides','Combine like terms','Distribute first'],
 geometry:['Around','Cover','Fill','Angle relationship'],
 patterns:['Add/subtract rule','Multiply/divide rule','Alternating rule','Work backward'],
 decimals:['Line up place value','Use trailing zeros','Estimate size','Make divisor whole'],
 money:['Find one item','Count change up','Use percent anchor','Compare unit prices'],
 measurement:['Convert units','Choose a formula','Use elapsed time jumps','Check unit size'],
 orderops:['Brackets first','Exponent first','×/÷ left to right','+/− left to right']
};

function safeState(){return typeof state!=='undefined'?state:null}
function save(){try{if(typeof Store!=='undefined')Store.set('smbt-state-v2',state)}catch(e){}}
function player(){const s=safeState();return s&&s.activePlayer==='katya'?'katya':'alex'}
function ensure(){const s=safeState();if(!s)return false;if(!s.mathSecrets||typeof s.mathSecrets!=='object')s.mathSecrets={};['alex','katya'].forEach(w=>{if(!s.mathSecrets[w])s.mathSecrets[w]={unlocked:[],seen:{},review:{},patternWins:0,weekly:[]};const p=s.mathSecrets[w];if(!Array.isArray(p.unlocked))p.unlocked=[];if(!p.seen)p.seen={};if(!p.review)p.review={};if(!Array.isArray(p.weekly))p.weekly=[];if(!Number.isFinite(p.patternWins))p.patternWins=0});return true}
function mastery(w,t){try{return typeof getMastery==='function'?getMastery(w,t):{seen:0,correct:0,recent:[]}}catch(e){return{seen:0,correct:0,recent:[]}}}
function viewed(w,t){try{return state.strategy&&state.strategy[w]&&state.strategy[w].viewed?(state.strategy[w].viewed[t]||0):0}catch(e){return 0}}
function dueInfo(w,id){ensure();const r=state.mathSecrets[w].review[id];if(!r)return{stage:0,due:0};return r}
function scheduleReview(w,id,correct=true){ensure();const now=Date.now();const old=dueInfo(w,id);let stage=correct?Math.min(old.stage+1,REVIEW_GAPS.length-1):0;state.mathSecrets[w].review[id]={stage,due:now+REVIEW_GAPS[stage]*DAY,last:now};save()}
function unlockEligible(w){if(!ensure())return;let unlockedNow=[];SECRETS.forEach(sec=>{if(state.mathSecrets[w].unlocked.includes(sec.id))return;const m=mastery(w,sec.topic);const enough=sec.level===1?m.correct>=2:sec.level===2?m.correct>=5:m.correct>=9;const discovered=viewed(w,sec.topic)>0||m.seen>=4;if(enough&&discovered){state.mathSecrets[w].unlocked.push(sec.id);scheduleReview(w,sec.id,true);unlockedNow.push(sec)}});if(unlockedNow.length){save();unlockedNow.slice(0,2).forEach(sec=>{try{if(typeof logEvent==='function')logEvent(w,'🧠',`Math Secret unlocked: ${sec.name}`);if(typeof toast==='function')toast(`🧠 Math Secret Unlocked: ${sec.name}!`);if(typeof burst==='function')burst(40)}catch(e){}})}}
function dueReviews(w){if(!ensure())return[];const now=Date.now();return state.mathSecrets[w].unlocked.map(id=>SECRETS.find(s=>s.id===id)).filter(Boolean).filter(sec=>{const r=dueInfo(w,sec.id);return !r.due||r.due<=now}).slice(0,5)}

const originalStrategy=typeof strategyFor==='function'?strategyFor:null;
window.strategyFor=function(topic){return TOPICS[topic]||(originalStrategy?originalStrategy(topic):null)};
try{strategyFor=window.strategyFor}catch(e){}

if(typeof recordAnswer==='function'){
 const originalRecord=recordAnswer;
 window.recordAnswer=function(w,t,correct){const out=originalRecord(w,t,correct);unlockEligible(w);if(correct){const due=dueReviews(w).find(s=>s.topic===t);if(due)scheduleReview(w,due.id,true)}return out};
 try{recordAnswer=window.recordAnswer}catch(e){}
}
if(typeof markStrategyViewed==='function'){
 const originalViewed=markStrategyViewed;
 window.markStrategyViewed=function(w,t){const out=originalViewed(w,t);ensure();state.mathSecrets[w].seen[t]=(state.mathSecrets[w].seen[t]||0)+1;unlockEligible(w);save();return out};
 try{markStrategyViewed=window.markStrategyViewed}catch(e){}
}

function currentQuestion(){try{return typeof M!=='undefined'&&M&&M.q?M.q:null}catch(e){return null}}
function currentTopic(){const q=currentQuestion();if(q&&q.topic)return q.topic;const text=q&&q.q?q.q:'';if(text.includes('%'))return'percent';if(text.includes('×'))return'multiplication';if(text.includes('÷'))return'division';if(/solve for x/i.test(text))return'algebra';if(/perimeter|area|triangle|volume/i.test(text))return'geometry';return'wordproblems'}
const originalHint=typeof hintFor==='function'?hintFor:null;
window.hintFor=function(){const t=currentTopic(),topic=TOPICS[t];if(topic)return`🧠 Winning Strategy: ${topic.strategy} Pattern Hunter: ${topic.patternQuestion}`;return originalHint?originalHint():'Look for a pattern, choose a friendly first step, and estimate before solving.'};
try{hintFor=window.hintFor}catch(e){}

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function unlockedFor(w){ensure();return state.mathSecrets[w].unlocked}
function stats(w){const unlocked=unlockedFor(w);return{unlocked:unlocked.length,total:SECRETS.length,due:dueReviews(w).length,patterns:state.mathSecrets[w].patternWins||0}}
function renderLibrary(filter='all'){
 const w=player(),u=unlockedFor(w),st=stats(w),grid=document.getElementById('mts-grid'),summary=document.getElementById('mts-summary');if(!grid)return;
 summary.textContent=`${st.unlocked} of ${st.total} unlocked · ${st.due} reviews due · ${st.patterns} Pattern Hunter wins`;
 const list=SECRETS.filter(s=>filter==='all'||s.topic===filter);
 grid.innerHTML=list.map(sec=>{const open=u.includes(sec.id),r=dueInfo(w,sec.id),due=open&&(!r.due||r.due<=Date.now());return`<article class="mts-card ${open?'':'locked'}"><div class="mts-topic">${open?'🧠 UNLOCKED':'🔒 LOCKED'} · ${esc(TOPICS[sec.topic]?.name||sec.topic)} ${due?'<b>· REVIEW</b>':''}</div><h3>${open?esc(sec.name):'Hidden Math Secret'}</h3><p>${open?esc(sec.text):'Use the related Brain Boost and solve questions correctly to reveal this secret.'}</p>${open?`<button class="mts-review" data-id="${esc(sec.id)}">I REMEMBER THIS</button>`:''}</article>`}).join('');
 grid.querySelectorAll('.mts-review').forEach(btn=>btn.onclick=()=>{scheduleReview(w,btn.dataset.id,true);btn.textContent='REVIEWED ✓';btn.disabled=true;renderLibrary(filter)})
}
function showPatternHunter(){const t=currentTopic(),topic=TOPICS[t]||TOPICS.wordproblems,choices=PATTERN_CHOICES[t]||['Find a pattern','Choose an operation','Draw a model','Estimate first'];const panel=document.getElementById('mph-panel');panel.innerHTML=`<div class="mph-label">👀 PATTERN HUNTER</div><h2>${esc(topic.patternQuestion)}</h2><div class="mph-choices">${choices.map((c,i)=>`<button data-i="${i}">${esc(c)}</button>`).join('')}</div><div class="mph-result" id="mph-result"></div>`;document.getElementById('mph-modal').classList.add('open');panel.querySelectorAll('button').forEach(btn=>btn.onclick=()=>{const result=document.getElementById('mph-result');result.innerHTML=`<strong>Winning Strategy</strong><br>${esc(topic.strategy)}<br><br><strong>Memory Hook</strong><br>${esc(topic.memoryHook)}<br><br><strong>Try this example</strong><br>${esc(topic.example)}`;ensure();state.mathSecrets[player()].patternWins++;save();unlockEligible(player());panel.querySelectorAll('button').forEach(b=>b.disabled=true)})}

const style=document.createElement('style');style.textContent=`
.mts-fab,.mph-fab{position:fixed;z-index:180;border:2px solid rgba(255,201,60,.75);background:linear-gradient(135deg,#16112c,#24163c);color:#fff;border-radius:18px;padding:12px 15px;font:800 13px var(--raj);letter-spacing:1px;box-shadow:0 0 24px rgba(255,201,60,.28);cursor:pointer}.mts-fab{right:18px;bottom:max(18px,env(safe-area-inset-bottom))}.mph-fab{left:18px;bottom:max(18px,env(safe-area-inset-bottom));border-color:rgba(25,201,255,.75);box-shadow:0 0 24px rgba(25,201,255,.24)}
.mts-modal,.mph-modal{position:fixed;inset:0;z-index:260;background:rgba(2,4,12,.9);backdrop-filter:blur(12px);display:none;align-items:center;justify-content:center;padding:18px}.mts-modal.open,.mph-modal.open{display:flex}.mts-panel,.mph-panel{width:min(1050px,100%);max-height:92dvh;overflow:auto;background:#0a0f1f;border:1px solid rgba(255,201,60,.45);border-radius:24px;padding:22px}.mph-panel{max-width:760px;border-color:rgba(25,201,255,.5)}
.mts-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:16px}.mts-head h2,.mph-panel h2{font:900 clamp(22px,5vw,34px) var(--orb);color:#ffc93c}.mph-panel h2{color:#19c9ff;margin:8px 0 18px}.mts-head p{color:#8fa3c8;margin-top:6px}.mts-close{border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#fff;border-radius:12px;min-width:48px;min-height:48px;font-size:22px}.mts-filter{display:flex;gap:8px;overflow:auto;margin-bottom:14px;padding-bottom:4px}.mts-filter button{white-space:nowrap;border:1px solid rgba(120,150,255,.25);background:rgba(255,255,255,.04);color:#cbd8f2;border-radius:12px;padding:8px 11px;font-weight:700}.mts-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px}.mts-card{border:1px solid rgba(120,150,255,.18);background:rgba(255,255,255,.035);border-radius:16px;padding:14px}.mts-card.locked{opacity:.45;filter:saturate(.4)}.mts-card h3{font:800 15px var(--orb);margin:7px 0}.mts-card p{font-size:15px;line-height:1.4;color:#cbd8f2}.mts-topic{font-size:11px;text-transform:uppercase;letter-spacing:1.3px;color:#19c9ff}.mts-review{margin-top:12px;border:1px solid rgba(61,255,139,.5);background:rgba(61,255,139,.08);color:#3dff8b;border-radius:10px;padding:8px 10px;font-weight:800}.mph-label{font:800 12px var(--orb);letter-spacing:2px;color:#ffc93c}.mph-choices{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.mph-choices button{min-height:58px;border:1px solid rgba(25,201,255,.5);background:rgba(25,201,255,.08);color:#fff;border-radius:14px;font:800 15px var(--raj)}.mph-result{margin-top:16px;padding:16px;border-radius:14px;background:rgba(255,255,255,.04);line-height:1.5;color:#dce8ff}.mph-result strong{color:#ffc93c}
@media(max-width:720px){.mts-fab,.mph-fab{bottom:max(8px,env(safe-area-inset-bottom));padding:10px 11px;font-size:11px}.mts-fab{right:8px}.mph-fab{left:8px}.mts-panel,.mph-panel{padding:15px}.mts-grid,.mph-choices{grid-template-columns:1fr}}
`;document.head.appendChild(style);

const libBtn=document.createElement('button');libBtn.className='mts-fab';libBtn.type='button';libBtn.textContent='🧠 MATH SECRETS';document.body.appendChild(libBtn);
const patternBtn=document.createElement('button');patternBtn.className='mph-fab';patternBtn.type='button';patternBtn.textContent='👀 PATTERN HUNTER';document.body.appendChild(patternBtn);
const lib=document.createElement('div');lib.id='mts-modal';lib.className='mts-modal';lib.innerHTML=`<section class="mts-panel" role="dialog" aria-modal="true"><div class="mts-head"><div><h2>🧠 Math Secrets Library</h2><p id="mts-summary">Understand math instead of memorizing it.</p></div><button class="mts-close" aria-label="Close">×</button></div><div class="mts-filter"><button data-topic="all">All</button>${Object.entries(TOPICS).map(([id,t])=>`<button data-topic="${esc(id)}">${esc(t.icon)} ${esc(t.name)}</button>`).join('')}</div><div class="mts-grid" id="mts-grid"></div></section>`;document.body.appendChild(lib);
const ph=document.createElement('div');ph.id='mph-modal';ph.className='mph-modal';ph.innerHTML='<section class="mph-panel" id="mph-panel" role="dialog" aria-modal="true"></section>';document.body.appendChild(ph);
libBtn.onclick=()=>{renderLibrary();lib.classList.add('open')};patternBtn.onclick=showPatternHunter;lib.querySelector('.mts-close').onclick=()=>lib.classList.remove('open');lib.onclick=e=>{if(e.target===lib)lib.classList.remove('open')};ph.onclick=e=>{if(e.target===ph)ph.classList.remove('open')};lib.querySelectorAll('[data-topic]').forEach(btn=>btn.onclick=()=>renderLibrary(btn.dataset.topic));

ensure();unlockEligible('alex');unlockEligible('katya');save();
window.MathThinkingSystem={version:VERSION,topics:TOPICS,secrets:SECRETS,getStats:()=>stats(player()),dueReviews:()=>dueReviews(player()),openLibrary:()=>{renderLibrary();lib.classList.add('open')},openPatternHunter:showPatternHunter};
console.info(`Math Thinking System v${VERSION} loaded: ${SECRETS.length} secrets across ${Object.keys(TOPICS).length} topics.`);
})();