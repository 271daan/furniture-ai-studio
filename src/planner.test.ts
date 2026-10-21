import assert from 'node:assert/strict';
import test from 'node:test';
import { applyRulesToPlan, createDemoPlan, dimensions } from './planner';
import { defaultProduct, defaultRules } from './types';

const product = { ...defaultProduct, name: '라운지 체어', width: '800', depth: '750', height: '900', material: '오크', color: '그레이' };

test('six distinct prompts integrate supported rules within the scene, not as a raw appendix', () => {
 const plan = createDemoPlan(product, 2, defaultRules);
 assert.equal(plan.cuts.length, 6);
 assert.equal(new Set(plan.cuts.map(c => c.prompt)).size, 6);
 for(const cut of plan.cuts) {
  assert.ok(cut.prompt.includes('800 × 750 × 900 mm'));
  assert.ok(cut.prompt.includes('[장면]'));
  assert.ok(!cut.prompt.includes(defaultRules));
  assert.ok(!cut.prompt.includes('[공통 지침]'));
  assert.ok(!cut.prompt.includes('강한 노란빛과 붉은빛을 사용하지 않는다'));
 }
 assert.equal(dimensions(product), '800 × 750 × 900 mm (가로 × 깊이 × 높이)');
});

test('saving new rules regenerates demo scene without dumping input text', () => {
 const plan = createDemoPlan(product, 2, defaultRules);
 const updated = applyRulesToPlan(plan, '왼쪽 자연광만 사용', product)!;
 assert.ok(updated.cuts.every(c => c.prompt.includes('왼쪽에서 들어오는 부드러운 자연광')));
 assert.ok(updated.cuts.every(c => !c.prompt.includes('왼쪽 자연광만 사용')));
});

test('legacy exposed settings are stripped, preserving manually edited copy', () => {
 const plan = createDemoPlan(product, 1, defaultRules);
 plan.cuts[0].prompt = '나만의 프롬프트\\n[공통 지침] 이전 지침 원문';
 delete plan.cuts[0].generatedRuleText;
 const updated = applyRulesToPlan(plan, '왼쪽 자연광만 사용', product)!;
 assert.equal(updated.cuts[0].prompt, '나만의 프롬프트');
});
