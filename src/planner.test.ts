import assert from 'node:assert/strict';
import test from 'node:test';
import {applyRulesToPlan, createDemoPlan, dimensions} from './planner';
import {defaultProduct, defaultRules} from './types';
const product = {...defaultProduct, name:'플로 스툴', width:'340', depth:'350', height:'560'};
test('new demo prompts do not include common rule document', () => {
 const plan = createDemoPlan(product, 3, defaultRules);
 assert.equal(plan.cuts.length, 6);
 assert.equal(new Set(plan.cuts.map(c => c.prompt)).size, 6);
 assert.ok(plan.cuts.every(c => !c.prompt.includes(defaultRules) && !c.prompt.includes('[공통 지침]')));
 assert.equal(dimensions(product),'340 × 350 × 560 mm (가로 × 깊이 × 높이)');
});
test('legacy project strips entire appended rules at display', () => {
 const plan = createDemoPlan(product,1,defaultRules);
 plan.cuts[0].prompt += '\\n[공통 지침]\\n' + defaultRules;
 const updated = applyRulesToPlan(plan,defaultRules,product)!;
 assert.ok(!updated.cuts[0].prompt.includes(defaultRules));
 assert.ok(!updated.cuts[0].prompt.includes('[공통 지침]'));
 assert.ok(updated.cuts[0].prompt.includes('플로 스툴'));
});
test('new rules change scenario in existing demo plan', () => {
 const plan=createDemoPlan(product,1,defaultRules);
 const updated=applyRulesToPlan(plan,'왼쪽 자연광만 사용',product)!;
 assert.ok(updated.cuts.every(c=>c.prompt.includes('왼쪽에서 들어오는 부드러운 자연광')));
 assert.ok(updated.cuts.every(c=>!c.prompt.includes('왼쪽 자연광만 사용')));
});
test('hand-edited prompts survive normalization', () => {
 const plan=createDemoPlan(product,1,defaultRules);
 plan.cuts[0].prompt='나만의 컷 프롬프트';
 plan.cuts[0].promptCustomized=true;
 assert.equal(applyRulesToPlan(plan,'왼쪽 자연광',product)!.cuts[0].prompt,'나만의 컷 프롬프트');
});
