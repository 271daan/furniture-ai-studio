import assert from 'node:assert/strict';
import test from 'node:test';
import {applyRulesToPlan, createDemoPlan, dimensions} from './planner';
import {defaultProduct, defaultRules} from './types';
const product = {...defaultProduct, name:'플로 스툴', width:'340', depth:'350', height:'560'};
const longRules = '# 상세페이지용 AI 공간 연출 이미지 기획 요청문\n너는 가구 상세페이지용 AI 공간 연출 이미지 제작자야.\n아래 조건을 모두 반영해 줘.\n화병 금지.';

test('CUT prompts never copy global guidelines into demo output', () => {
 const plan=createDemoPlan(product,3,longRules);
 assert.equal(plan.cuts.length,6);
 assert.equal(new Set(plan.cuts.map(c=>c.prompt)).size,6);
 assert.ok(plan.cuts.every(c=>!c.prompt.includes('너는 가구') && !c.prompt.includes('화병 금지') && !c.prompt.includes('[공통 지침]')));
 assert.equal(dimensions(product),'340 × 350 × 560 mm (가로 × 깊이 × 높이)');
});
test('old saved demo prompts with full guideline appendix are regenerated',()=>{
 const plan=createDemoPlan(product,1,defaultRules);
 plan.cuts[0].prompt += '\n[공통 지침]\n' + longRules;
 const cleaned=applyRulesToPlan(plan,longRules,product)!;
 assert.ok(!cleaned.cuts[0].prompt.includes(longRules));
 assert.ok(cleaned.cuts[0].prompt.includes('[공간]'));
});
test('changing guidelines does not append any guideline text to generated demo prompts',()=>{
 const plan=createDemoPlan(product,1,defaultRules);
 const updated=applyRulesToPlan(plan,longRules,product)!;
 assert.ok(updated.cuts.every(c=>!c.prompt.includes(longRules)));
});
test('manual prompt is retained',()=>{
 const plan=createDemoPlan(product,1,defaultRules);
 plan.cuts[0].prompt='내가 직접 수정한 프롬프트';
 plan.cuts[0].promptCustomized=true;
 assert.equal(applyRulesToPlan(plan,longRules,product)!.cuts[0].prompt,'내가 직접 수정한 프롬프트');
});

test('detailed prompts contain concrete placement, camera, light and exclusions',()=>{
 const plan=createDemoPlan(product,2,longRules);
 for(const cut of plan.cuts) {
  assert.ok(cut.prompt.length > 450);
  assert.ok(cut.prompt.includes('공간 연출:'));
  assert.ok(cut.prompt.includes('제품과 가구의 배치:'));
  assert.ok(cut.prompt.includes('촬영 구도:'));
  assert.ok(cut.prompt.includes('제외 요소:'));
  assert.ok(!cut.prompt.includes(longRules));
 }
 assert.ok(plan.cuts[4].prompt.includes('화장대 아래에 반쯤'));
 assert.ok(plan.cuts[0].prompt.includes('화장대 앞'));
});
