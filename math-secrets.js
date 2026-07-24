/* Summer Kids App — Math Thinking System v2.0
   Contextual Brain Boosts, Pattern Hunter, unlockable Math Secrets,
   spaced review, mastery tracking, and a child-friendly strategy library. */
(() => {
'use strict';
if(window.__MATH_THINKING_LOADED__)return;
window.__MATH_THINKING_LOADED__=true;
const VERSION='3.0.0';
const STATE_VERSION=3;
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
 ,factors:{name:'Factors, Multiples & Primes',icon:'🧱',grades:[4,5,6,7,8],strategy:'Build factor pairs in order and use divisibility checks to avoid missing a pair.',example:'Factors of 24: 1×24, 2×12, 3×8, 4×6.',memoryHook:'Pairs build the number.',commonMistake:'listing a factor twice or missing its partner',patternQuestion:'Which factor pair should come next?'}
 ,data:{name:'Data Literacy',icon:'📊',grades:[4,5,6,7,8],strategy:'Read the title, labels, units, scale, and legend before comparing values.',example:'If each graph symbol means 5 votes, 4 symbols mean 20 votes.',memoryHook:'Title, labels, scale, legend.',commonMistake:'counting symbols without using the scale',patternQuestion:'What does one mark or interval represent?'}
 ,statistics:{name:'Mean, Median, Mode & Range',icon:'📈',grades:[5,6,7,8],strategy:'Sort the data first, then choose the measure the question asks for.',example:'For 2, 4, 4, 9: median=4, mode=4, range=7, mean=4.75.',memoryHook:'Sort before statistics.',commonMistake:'finding the middle before ordering the values',patternQuestion:'Which measure best answers the question?'}
 ,angles:{name:'Angles',icon:'📐',grades:[4,5,6,7,8],strategy:'Use known totals: right angle 90°, straight line 180°, full turn 360°, triangle 180°.',example:'An angle beside 68° on a straight line is 180°−68°=112°.',memoryHook:'Corner 90, line 180, turn 360.',commonMistake:'using 360° when the angles form a straight line',patternQuestion:'What total do these angles make?'}
 ,transformations:{name:'Transformations',icon:'🗺️',grades:[5,6,7,8],strategy:'Track every vertex using the same translation, reflection, or rotation rule.',example:'Translate (2,−1) by (+3,+4) to get (5,3).',memoryHook:'Same move for every point.',commonMistake:'moving only one coordinate or changing the shape size',patternQuestion:'What stays the same under this transformation?'}
 ,surfacearea:{name:'Perimeter, Area, Surface Area & Volume',icon:'📦',grades:[4,5,6,7,8],strategy:'Decide whether you need a boundary, a flat covering, all outside faces, or inside capacity.',example:'A 3×4×5 prism has volume 60 units³ and surface area 2(12+15+20)=94 units².',memoryHook:'Around, cover, wrap, fill.',commonMistake:'using cubic units for surface area',patternQuestion:'Is the problem asking around, cover, wrap, or fill?'}
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
 ],
 factors:[
 ['factor-pairs','Factor Pairs','List factor pairs from 1 upward until the pairs meet.'],
 ['multiple-ladder','Multiple Ladder','Generate multiples by repeated equal jumps.'],
 ['prime-test','Prime Test','A prime has exactly two positive factors: 1 and itself.'],
 ['common-factors','Greatest Common Factor','Compare complete factor lists or use prime factors to find the greatest shared factor.'],
 ['common-multiples','Least Common Multiple','Find the first positive multiple shared by both numbers.'],
 ['prime-factor-tree','Prime Factor Tree','Split a composite number until every branch ends in a prime.'],
 ['divisibility-plan','Divisibility Plan','Test easy divisibility rules before attempting long division.']
 ],
 data:[
 ['read-scale','Read the Scale','Find the value of one interval before reading a graph.'],
 ['legend-units','Legend and Units','Use the legend and unit label when translating marks into quantities.'],
 ['fair-graph','Fair Graph Check','Check whether a truncated axis exaggerates a difference.'],
 ['table-compare','Compare Table Rows','Align the same categories before calculating a difference.'],
 ['double-bar','Double-Bar Match','Compare matching bars within each category, not neighbouring categories.'],
 ['line-trend','Read a Trend','Describe overall change and important peaks or drops without claiming a cause.'],
 ['data-question','Answerable Data Question','Make sure the collected data can actually answer the question asked.']
 ],
 statistics:[
 ['median-order','Order for Median','Sort values before choosing the middle one or averaging the two middle values.'],
 ['mode-frequency','Mode Is Most Frequent','Count occurrences; a data set may have no mode or more than one mode.'],
 ['range-spread','Range Measures Spread','Subtract the minimum from the maximum.'],
 ['mean-share','Mean as Fair Share','Add all values and share the total equally among the data points.'],
 ['outlier-effect','Outlier Effect','A far-away value usually changes the mean more than the median.'],
 ['choose-measure','Choose a Centre','Use context and outliers to decide whether mean or median is more representative.'],
 ['missing-mean','Recover a Missing Value','Multiply mean by count to get the total, then subtract known values.']
 ],
 angles:[
 ['angle-type','Classify Angles','Acute is under 90°, right is 90°, obtuse is between 90° and 180°, straight is 180°.'],
 ['complement','Complement to 90','Angles forming a right angle total 90°.'],
 ['supplement','Supplement to 180','Angles on a straight line total 180°.'],
 ['around-point','Around a Point','Angles around one point total 360°.'],
 ['triangle-sum','Triangle Sum','The interior angles of every triangle total 180°.'],
 ['opposite-angles','Vertically Opposite Angles','Opposite angles made by two crossing lines are equal.'],
 ['parallel-lines','Parallel Line Angles','Use corresponding and alternate angle relationships only when lines are parallel.']
 ],
 transformations:[
 ['translation-vector','Translation Vector','Add the horizontal and vertical movement to every coordinate.'],
 ['reflect-y-axis','Reflect in the y-axis','Change the sign of x and keep y.'],
 ['reflect-x-axis','Reflect in the x-axis','Keep x and change the sign of y.'],
 ['quarter-turn','Quarter-Turn Rotation','For a 90° counter-clockwise turn about the origin, (x,y) becomes (−y,x).'],
 ['transformation-invariants','What Stays Fixed','Translations, rotations, and reflections preserve lengths and angles.'],
 ['describe-transform','Describe a Transformation','Name the transformation and include its vector, mirror line, or centre and angle.']
 ],
 surfacearea:[
 ['perimeter-boundary','Perimeter Boundary','Add every outside side length once.'],
 ['rectangle-area','Rectangle Area','Multiply length by width and use square units.'],
 ['triangle-area-2','Triangle Area','Multiply base by perpendicular height, then divide by two.'],
 ['prism-volume','Rectangular Prism Volume','Multiply length, width, and height and use cubic units.'],
 ['net-surface-area','Surface Area from a Net','Find the area of every outside face and add them.'],
 ['missing-dimension','Missing Dimension','Divide the known area or volume by the product of known dimensions.']
 ]
};

const SECRETS=[];
Object.entries(SECRET_GROUPS).forEach(([topic,items])=>items.forEach(([id,name,text],index)=>{
 const meta=TOPICS[topic];
 SECRETS.push({
  id:`${topic}.${id}`,title:name,name,topic,strand:topic,
  minGrade:meta.grades[0],maxGrade:meta.grades[meta.grades.length-1],
  prerequisiteIds:index? [`${topic}.${items[Math.max(0,index-1)][0]}`] : [],
  explanation:text,workedExample:meta.example,memoryHook:meta.memoryHook,
  commonMistake:meta.commonMistake,patternHunterQuestion:meta.patternQuestion,
  childVariants:{alex:`Strategy move: ${text}`,katya:`Detective clue: ${text}`},
  reviewTags:[topic,id],text,level:index<2?1:index<5?2:3
 });
}));
// Grade-specific curriculum guardrails. Topic ranges are broad for browsing;
// these overrides prevent advanced strategies from being recommended early.
const GRADE_OVERRIDES={
 'geometry.pythagorean':[8,8],
 'geometry.scale-factor':[7,8],
 'geometry.circle-parts':[5,8],
 'algebra.square-model':[8,8],
 'algebra.difference-squares':[8,8],
 'exponents.power-zero':[8,8],
 'exponents.same-base-multiply':[8,8],
 'exponents.same-base-divide':[8,8],
 'money.simple-interest':[7,8],
 'statistics.outlier-effect':[7,8],
 'statistics.choose-measure':[6,8],
 'surfacearea.prism-volume':[5,8],
 'surfacearea.net-surface-area':[5,8],
 'angles.parallel-lines':[8,8],
 'transformations.quarter-turn':[6,8]
};
SECRETS.forEach(strategy=>{const range=GRADE_OVERRIDES[strategy.id];if(range){strategy.minGrade=range[0];strategy.maxGrade=range[1]}});
// These identities are useful extensions, but are not Ontario Grade 8
// expectations. Keep them discoverable in the library without recommending
// them during curriculum-aligned missions.
const ENRICHMENT_IDS=new Set(['algebra.square-model','algebra.difference-squares']);
SECRETS.forEach(strategy=>{strategy.enrichment=ENRICHMENT_IDS.has(strategy.id)});

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

function safeState(){try{return typeof state!=='undefined'&&state&&typeof state==='object'?state:null}catch(e){return null}}
function save(){try{if(typeof Store!=='undefined')Store.set('smbt-state-v2',state)}catch(e){}}
function player(){const s=safeState();return s&&s.activePlayer==='katya'?'katya':'alex'}
function freshChild(){return{updatedAt:0,unlocked:[],seen:{},review:{},events:[],topic:{},errors:{},strategyViews:0,usefulSelections:0,patternAttempts:0,patternUseful:0,hintsUsed:0}}
function objectOr(value,fallback={}){return value&&typeof value==='object'&&!Array.isArray(value)?value:fallback}
function finiteOr(value,fallback=0){return Number.isFinite(Number(value))?Number(value):fallback}
function ensure(){
 const s=safeState();if(!s)return false;
 if(!s.mathThinking||typeof s.mathThinking!=='object'||Array.isArray(s.mathThinking))s.mathThinking={version:0};
 ['alex','katya'].forEach(w=>{
  const legacy=s.mathSecrets&&s.mathSecrets[w];
  if(!s.mathThinking[w]||typeof s.mathThinking[w]!=='object')s.mathThinking[w]=freshChild();
  const p=s.mathThinking[w];
  p.unlocked=Array.isArray(p.unlocked)?[...new Set(p.unlocked.filter(id=>typeof id==='string'))]:[];
  p.events=Array.isArray(p.events)?p.events.filter(e=>e&&typeof e==='object').slice(-500):[];
  p.seen=objectOr(p.seen);p.review=objectOr(p.review);p.topic=objectOr(p.topic);p.errors=objectOr(p.errors);
  ['updatedAt','strategyViews','usefulSelections','patternAttempts','patternUseful','hintsUsed'].forEach(k=>{p[k]=finiteOr(p[k])});
  if(legacy&&s.mathThinking.version<STATE_VERSION){
   (legacy.unlocked||[]).forEach(old=>{const hit=SECRETS.find(x=>x.id===old||x.id.endsWith('.'+old));if(hit&&!p.unlocked.includes(hit.id))p.unlocked.push(hit.id)});
   Object.entries(objectOr(legacy.review)).forEach(([old,review])=>{const hit=SECRETS.find(x=>x.id===old||x.id.endsWith('.'+old));if(hit&&review&&typeof review==='object'&&!p.review[hit.id])p.review[hit.id]=review});
   p.patternUseful=Math.max(p.patternUseful,finiteOr(legacy.patternWins));
  }
 });
 s.mathThinking.version=STATE_VERSION;s.mathThinking.migratedAt=s.mathThinking.migratedAt||new Date().toISOString();
 return true;
}
function mastery(w,t){try{return typeof getMastery==='function'?getMastery(w,t):{seen:0,correct:0,recent:[]}}catch(e){return{seen:0,correct:0,recent:[]}}}
function viewed(w,t){try{return state.strategy&&state.strategy[w]&&state.strategy[w].viewed?(state.strategy[w].viewed[t]||0):0}catch(e){return 0}}
function childState(w){ensure();return state.mathThinking[w]}
function dueInfo(w,id){const r=childState(w).review[id];return r||{stage:-1,due:0}}
function scheduleReview(w,id,correct=true){const p=childState(w),now=Date.now(),old=dueInfo(w,id);let stage=correct?Math.min(Math.max(0,old.stage+1),REVIEW_GAPS.length-1):Math.max(0,old.stage-1);p.review[id]={stage,due:now+REVIEW_GAPS[stage]*DAY,last:now,remembered:!!correct};p.updatedAt=now}
function unlockEligible(w){const p=childState(w),unlockedNow=[];SECRETS.forEach(sec=>{if(p.unlocked.includes(sec.id))return;const prereqs=sec.prerequisiteIds.every(id=>p.unlocked.includes(id));const appId=appTopic(sec.topic),m=mastery(w,appId);const enough=sec.level===1?m.correct>=2:sec.level===2?m.correct>=5:m.correct>=9;if(prereqs&&enough&&(viewed(w,appId)>0||m.seen>=4)){p.unlocked.push(sec.id);scheduleReview(w,sec.id,true);unlockedNow.push(sec)}});if(unlockedNow.length){save();unlockedNow.slice(0,2).forEach(sec=>{try{logEvent(w,'🧠',`Math Secret unlocked: ${sec.name}`);toast(`🧠 Math Secret Unlocked: ${sec.name}!`);burst(40)}catch(e){}})}}
function dueReviews(w){const p=childState(w),now=Date.now();return p.unlocked.map(id=>SECRETS.find(s=>s.id===id)).filter(Boolean).filter(sec=>{const r=dueInfo(w,sec.id);return !r.due||r.due<=now})}
function normalizeTopic(topic){return({bedmas:'orderops',logic:'patterns',time:'measurement',mentalmath:'estimation'}[topic]||topic||'wordproblems')}
function appTopic(topic){return({orderops:'bedmas',patterns:'logic'}[topic]||topic)}
function operationFor(q){if(q&&q.operation)return q.operation;const text=String(q&&q.q||'');if(text.includes('÷'))return'division';if(text.includes('×'))return'multiplication';if(text.includes('+'))return'addition';if(text.includes('−')||text.includes('-'))return'subtraction';if(/perimeter/i.test(text))return'perimeter';if(/area/i.test(text))return'area';return'reasoning'}
function detectError(q,answer){
 const text=String(q&&q.q||''),raw=String(answer||'').trim(),expected=String(q&&q.a!=null?q.a:'');
 if(/\/.+\+.+\//.test(text)&&/^\d+\/\d+$/.test(raw)){const dens=[...text.matchAll(/\/(\d+)/g)].map(x=>+x[1]);const got=+raw.split('/')[1];if(dens.length>1&&got===dens[0]+dens[1])return'added-fraction-denominators'}
 let m;
 if(/perimeter/i.test(text)&&(m=text.match(/rectangle is\s+(\d+(?:\.\d+)?)\s*\w*\s+by\s+(\d+(?:\.\d+)?)/i))&&Number(raw)===(+m[1])*(+m[2]))return'perimeter-area-confusion';
 if((m=text.match(/^(-?\d+(?:\.\d+)?)\s*÷\s*(-?\d+(?:\.\d+)?)/))&&Number(raw)===Number(m[2])/Number(m[1]))return'reversed-division-order';
 if((m=text.match(/^(\d+)\s*([²³])/))&&Number(raw)===Number(m[1])*(m[2]==='²'?2:3))return'exponent-as-multiplication';
 if((m=text.match(/^(-?\d+(?:\.\d+)?)\s*([+−])\s*(-?\d+(?:\.\d+)?)\s*([×÷])\s*(-?\d+(?:\.\d+)?)/))){
  const left=m[2]==='+'?(+m[1])+(+m[3]):(+m[1])-(+m[3]),ltr=m[4]==='×'?left*(+m[5]):left/(+m[5]);if(Math.abs(Number(raw)-ltr)<.001)return'bedmas-left-to-right';
 }
 if(/remainder|round up/i.test(text)&&Number.isInteger(Number(raw))&&Number(raw)===Math.floor(Number(expected)))return'dropped-remainder';
 if(/integer|−\s*-|\(-/.test(text)&&Number(raw)===-Number(expected))return'integer-sign-direction';
 return'other';
}
function selectStrategy(topic,ctx={}){
 const t=normalizeTopic(topic),grade=Math.max(4,Math.min(8,Number(ctx.grade||5))),p=childState(ctx.child||player());
 const eligible=SECRETS.filter(s=>!s.enrichment&&s.topic===t&&s.minGrade<=grade&&s.maxGrade>=grade&&s.prerequisiteIds.every(id=>p.unlocked.includes(id)));
 const due=eligible.find(s=>{const r=p.review[s.id];return r&&r.due<=Date.now()});
 return due||eligible.find(s=>!p.seen[s.id])||eligible[0]||null;
}
function strategyForTopic(topic,ctx={}){const sec=selectStrategy(topic,ctx),meta=TOPICS[normalizeTopic(topic)];if(!sec||!meta)return null;return{...meta,id:sec.id,name:sec.title,strategy:sec.explanation,example:sec.workedExample,memoryHook:sec.memoryHook,commonMistake:sec.commonMistake,patternQuestion:sec.patternHunterQuestion}}

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function unlockedFor(w){return childState(w).unlocked}
function stats(w){const p=childState(w),unlocked=p.unlocked;return{unlocked:unlocked.length,total:SECRETS.length,due:dueReviews(w).length,patterns:p.patternUseful||0,hints:p.hintsUsed||0,strategyViews:p.strategyViews||0,usefulSelections:p.usefulSelections||0}}
function renderLibrary(filter='all'){
 const w=player(),u=unlockedFor(w),st=stats(w),grid=document.getElementById('mts-grid'),summary=document.getElementById('mts-summary');if(!grid)return;
 summary.textContent=`${st.unlocked} of ${st.total} unlocked · ${st.due} reviews due · ${st.patterns} Pattern Hunter wins`;
 const list=SECRETS.filter(s=>filter==='all'||s.topic===filter);
 grid.innerHTML=list.map(sec=>{const open=u.includes(sec.id),r=dueInfo(w,sec.id),due=open&&(!r.due||r.due<=Date.now());return`<article class="mts-card ${open?'':'locked'}"><div class="mts-topic">${open?'🧠 UNLOCKED':'🔒 LOCKED'} · ${esc(TOPICS[sec.topic]?.name||sec.topic)} ${due?'<b>· REVIEW</b>':''}</div><h3>${open?esc(sec.name):'Hidden Math Secret'}</h3><p>${open?esc(sec.text):'Use the related Brain Boost and solve questions correctly to reveal this secret.'}</p>${open?`<button class="mts-review" data-id="${esc(sec.id)}">I REMEMBER THIS</button>`:''}</article>`}).join('');
 grid.querySelectorAll('.mts-review').forEach(btn=>btn.onclick=()=>{scheduleReview(w,btn.dataset.id,true);btn.textContent='REVIEWED ✓';btn.disabled=true;renderLibrary(filter)})
}
let activeContext={child:'alex',grade:5,question:null,strategy:null};
function patternChoicesFor(sec){return[sec.title,'Guess without a plan','Use an unrelated rule','Choose by colour']}
function showPatternHunter(ctx=activeContext){
 const q=ctx.question||{},sec=selectStrategy(q.topic,ctx),topic=TOPICS[normalizeTopic(q.topic)]||TOPICS.wordproblems;if(!sec)return;
 const choices=patternChoicesFor(sec),order=choices.map((x,i)=>({x,i})).sort(()=>Math.random()-.5),panel=document.getElementById('mph-panel'),p=childState(ctx.child||player());
 p.patternAttempts++;p.updatedAt=Date.now();save();
 panel.innerHTML=`<div class="mph-label">👀 PATTERN HUNTER</div><h2 id="mph-dialog-title">${esc(sec.patternHunterQuestion)}</h2><div class="mph-choices">${order.map(c=>`<button data-useful="${c.i===0}">${esc(c.x)}</button>`).join('')}</div><div class="mph-result" id="mph-result" aria-live="polite"></div><button class="mts-close mph-close" aria-label="Close Pattern Hunter">Close</button>`;
 openModal(document.getElementById('mph-modal'));
 panel.querySelectorAll('.mph-choices button').forEach(btn=>btn.onclick=()=>{
  const useful=btn.dataset.useful==='true',result=document.getElementById('mph-result');
  if(useful){p.patternUseful++;p.usefulSelections++;p.strategyViews++;p.seen[sec.id]=(p.seen[sec.id]||0)+1;scheduleReview(ctx.child,sec.id,true);result.innerHTML=`<strong>Useful choice!</strong><br>${esc(sec.explanation)}<br><br><strong>Memory Hook</strong><br>${esc(sec.memoryHook)}<br><br><strong>Different-number example</strong><br>${esc(sec.workedExample)}`}
  else{result.textContent='Good try. That choice does not match this question yet. Look at the operation and what the question asks.'}
  save();unlockEligible(ctx.child);panel.querySelectorAll('.mph-choices button').forEach(b=>b.disabled=true)
 });
 panel.querySelector('.mph-close').onclick=()=>closeModal(document.getElementById('mph-modal'));
}
function recordEvent(ctx){
 const p=childState(ctx.child),q=ctx.question||{},topic=normalizeTopic(q.topic),now=Date.now(),ts=p.topic[topic]||(p.topic[topic]={seen:0,correct:0,recent:[],hints:0,strategyViews:0});
 if(ctx.attempts===1)ts.seen++;if(ctx.correct)ts.correct++;if(ctx.usedStrategy&&!activeContext.strategyCounted){ts.strategyViews++;p.strategyViews++;activeContext.strategyCounted=true}if(!ctx.correct&&ctx.attempts===1){ts.hints++;p.hintsUsed++}
 if(ctx.correct||ctx.attempts>=3){ts.recent.push({t:now,correct:!!ctx.correct,attempts:ctx.attempts});ts.recent=ts.recent.slice(-30)}
 const error=ctx.correct?null:detectError(q,ctx.answer);if(error&&error!=='other')p.errors[error]=(p.errors[error]||0)+1;
 const sec=selectStrategy(q.topic,ctx);if(sec){p.seen[sec.id]=(p.seen[sec.id]||0)+(ctx.usedStrategy?1:0);const reviewDue=p.review[sec.id]&&p.review[sec.id].due<=now;if(ctx.correct&&(ctx.usedStrategy||reviewDue)){if(ctx.usedStrategy)p.usefulSelections++;scheduleReview(ctx.child,sec.id,true)}else if(!ctx.correct&&ctx.attempts>=3&&p.review[sec.id])scheduleReview(ctx.child,sec.id,false)}
 p.events.push({t:now,questionKey:ctx.questionKey,topic,skill:q.skill||topic,operation:operationFor(q),correct:!!ctx.correct,attempts:ctx.attempts,error,strategyId:sec&&sec.id,usedStrategy:!!ctx.usedStrategy});p.events=p.events.slice(-500);p.updatedAt=now;unlockEligible(ctx.child);save();
}
function questionPresented(ctx){activeContext={...ctx,questionKey:`${ctx.child}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,strategy:selectStrategy(ctx.question&&ctx.question.topic,ctx)};const btn=document.getElementById('mts-pattern-action');if(btn)btn.hidden=true}
function answerRecorded(ctx){recordEvent({...ctx,questionKey:activeContext.questionKey});const btn=document.getElementById('mts-pattern-action');if(btn&&ctx.attempts>=2&&!ctx.correct)btn.hidden=false}
function openModal(modal){if(!modal)return;modal.classList.add('open');modal._returnFocus=document.activeElement;const focusable=modal.querySelector('button,input,[href]');if(focusable)focusable.focus()}
function closeModal(modal){if(!modal)return;modal.classList.remove('open');if(modal._returnFocus)modal._returnFocus.focus()}

const style=document.createElement('style');style.textContent=`
#mts-pattern-action[hidden]{display:none!important}
.mts-fab,.mph-fab{position:fixed;z-index:180;border:2px solid rgba(255,201,60,.75);background:linear-gradient(135deg,#16112c,#24163c);color:#fff;border-radius:18px;padding:12px 15px;font:800 13px var(--raj);letter-spacing:1px;box-shadow:0 0 24px rgba(255,201,60,.28);cursor:pointer}.mts-fab{right:18px;bottom:max(18px,env(safe-area-inset-bottom))}.mph-fab{left:18px;bottom:max(18px,env(safe-area-inset-bottom));border-color:rgba(25,201,255,.75);box-shadow:0 0 24px rgba(25,201,255,.24)}
.mts-modal,.mph-modal{position:fixed;inset:0;z-index:260;background:rgba(2,4,12,.9);backdrop-filter:blur(12px);display:none;align-items:center;justify-content:center;padding:18px}.mts-modal.open,.mph-modal.open{display:flex}.mts-panel,.mph-panel{width:min(1050px,100%);max-height:92vh;max-height:92dvh;overflow:auto;background:#0a0f1f;border:1px solid rgba(255,201,60,.45);border-radius:24px;padding:22px}.mph-panel{max-width:760px;border-color:rgba(25,201,255,.5)}
.mts-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:16px}.mts-head h2,.mph-panel h2{font:900 clamp(22px,5vw,34px) var(--orb);color:#ffc93c}.mph-panel h2{color:#19c9ff;margin:8px 0 18px}.mts-head p{color:#8fa3c8;margin-top:6px}.mts-close{border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#fff;border-radius:12px;min-width:48px;min-height:48px;font-size:22px}.mts-filter{display:flex;gap:8px;overflow:auto;margin-bottom:14px;padding-bottom:4px}.mts-filter button{white-space:nowrap;min-height:44px;border:1px solid rgba(120,150,255,.25);background:rgba(255,255,255,.04);color:#cbd8f2;border-radius:12px;padding:8px 11px;font-weight:700}.mts-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px}.mts-card{border:1px solid rgba(120,150,255,.18);background:rgba(255,255,255,.035);border-radius:16px;padding:14px}.mts-card.locked{opacity:.45;filter:saturate(.4)}.mts-card h3{font:800 15px var(--orb);margin:7px 0}.mts-card p{font-size:15px;line-height:1.4;color:#cbd8f2}.mts-topic{font-size:11px;text-transform:uppercase;letter-spacing:1.3px;color:#19c9ff}.mts-review{min-height:44px;margin-top:12px;border:1px solid rgba(61,255,139,.5);background:rgba(61,255,139,.08);color:#3dff8b;border-radius:10px;padding:8px 10px;font-weight:800}.mph-label{font:800 12px var(--orb);letter-spacing:2px;color:#ffc93c}.mph-choices{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.mph-choices button{min-height:58px;border:1px solid rgba(25,201,255,.5);background:rgba(25,201,255,.08);color:#fff;border-radius:14px;font:800 15px var(--raj)}.mph-result{margin-top:16px;padding:16px;border-radius:14px;background:rgba(255,255,255,.04);line-height:1.5;color:#dce8ff}.mph-result strong{color:#ffc93c}
@media(max-width:720px){.mts-fab,.mph-fab{bottom:max(8px,env(safe-area-inset-bottom));padding:10px 11px;font-size:11px}.mts-fab{right:8px}.mph-fab{left:8px}.mts-panel,.mph-panel{padding:15px}.mts-grid,.mph-choices{grid-template-columns:1fr}}
`;document.head.appendChild(style);

const lib=document.createElement('div');lib.id='mts-modal';lib.className='mts-modal';lib.innerHTML=`<section class="mts-panel" role="dialog" aria-modal="true" aria-labelledby="mts-dialog-title"><div class="mts-head"><div><h2 id="mts-dialog-title">🧠 Math Secrets Library</h2><p id="mts-summary">Understand math instead of memorizing it.</p></div><button class="mts-close" aria-label="Close Math Secrets Library">×</button></div><div class="mts-filter"><button data-topic="all">All</button>${Object.entries(TOPICS).map(([id,t])=>`<button data-topic="${esc(id)}">${esc(t.icon)} ${esc(t.name)}</button>`).join('')}</div><div class="mts-grid" id="mts-grid"></div></section>`;document.body.appendChild(lib);
const ph=document.createElement('div');ph.id='mph-modal';ph.className='mph-modal';ph.innerHTML='<section class="mph-panel" id="mph-panel" role="dialog" aria-modal="true" aria-labelledby="mph-dialog-title"></section>';document.body.appendChild(ph);
const brainButton=document.getElementById('ms-bb-btn');if(brainButton){const patternAction=document.createElement('button');patternAction.id='mts-pattern-action';patternAction.type='button';patternAction.className=brainButton.className;patternAction.textContent='👀 PATTERN HUNTER';patternAction.hidden=true;patternAction.onclick=()=>showPatternHunter(activeContext);brainButton.insertAdjacentElement('afterend',patternAction)}
const strategyScreen=document.getElementById('strategy-screen');if(strategyScreen&&!document.getElementById('mts-library-action')){const libraryAction=document.createElement('button');libraryAction.id='mts-library-action';libraryAction.type='button';libraryAction.className='btn btn-gold';libraryAction.textContent='🧠 OPEN ALL MATH SECRETS';libraryAction.style.margin='12px';libraryAction.onclick=()=>{renderLibrary();openModal(lib)};strategyScreen.insertBefore(libraryAction,strategyScreen.firstChild)}
lib.querySelector('.mts-close').onclick=()=>closeModal(lib);lib.onclick=e=>{if(e.target===lib)closeModal(lib)};ph.onclick=e=>{if(e.target===ph)closeModal(ph)};lib.querySelectorAll('[data-topic]').forEach(btn=>btn.onclick=()=>renderLibrary(btn.dataset.topic));
document.addEventListener('keydown',e=>{const modal=document.querySelector('.mts-modal.open,.mph-modal.open');if(!modal)return;if(e.key==='Escape')closeModal(modal);if(e.key==='Tab'){const nodes=[...modal.querySelectorAll('button:not([disabled]),input:not([disabled]),[href]')];if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});

ensure();unlockEligible('alex');unlockEligible('katya');save();
window.MathThinkingSystem={version:VERSION,stateVersion:STATE_VERSION,topics:TOPICS,secrets:SECRETS,getStats:(w=player())=>stats(w),dueReviews:(w=player())=>dueReviews(w),strategyForTopic,selectStrategy,questionPresented,answerRecorded,openLibrary:()=>{renderLibrary();openModal(lib)},openPatternHunter:()=>showPatternHunter(activeContext),reportData:w=>childState(w)};
window.dispatchEvent(new CustomEvent('math-thinking-ready'));
console.info(`Math Thinking System v${VERSION} loaded: ${SECRETS.length} secrets across ${Object.keys(TOPICS).length} topics.`);
})();
