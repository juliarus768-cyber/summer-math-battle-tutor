import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const child = {
  updatedAt:Date.now(),unlocked:[],review:{},errors:{},topic:{},
  events:[
    {t:1,questionKey:'q1',topic:'fractions',correct:false,attempts:1},
    {t:2,questionKey:'q1',topic:'fractions',correct:true,attempts:2},
    {t:3,questionKey:'q2',topic:'fractions',correct:false,attempts:1},
    {t:4,questionKey:'q2',topic:'fractions',correct:false,attempts:2},
    {t:5,questionKey:'q2',topic:'fractions',correct:false,attempts:3}
  ]
};
const documentStub = {
  head:{appendChild(){}},
  createElement(){return{style:{},appendChild(){}}},
  getElementById(){return null}
};
const windowStub = {
  MathThinkingSystem:{
    version:'3.0.0',topics:{fractions:{name:'Fractions'}},secrets:[],
    reportData(){return child},dueReviews(){return[]}
  },
  addEventListener(){}
};
const context=vm.createContext({console,Date,Math,Map,Set,String,Number,Array,Object,document:documentStub,window:windowStub});
vm.runInContext(fs.readFileSync(new URL('../math-parent-report.js',import.meta.url),'utf8'),context);
const report=context.window.MathParentReport.summary('alex');
assert.equal(report.questions.length,2,'attempts must group into two questions');
assert.equal(report.accuracy,50,'question accuracy must not count every attempt');
console.log('Validated parent question-level accuracy aggregation.');
