import assert from 'node:assert/strict';
import test from 'node:test';
import { applyRulesToPlan, buildRuleNarrative, createDemoPlan, dimensions } from './planner';
import { defaultProduct, defaultRules } from './types';

test('six prompts reflect common rules without exposing the rule text', () => {
  const product = { ...defaultProduct, name: '라운지 체어', width: '800', depth: '750', height: '900', material: '오크', color: '그레이' };
  const plan = createDemoPlan(product, 2, defaultRules);
  assert.equal(plan.source, 'demo');
  assert.equal(plan.cuts.length, 6);
  assert.equal(new Set(plan.cuts.map(cut => cut.prompt)).size, 6);
  assert.ok(plan.cuts.every(cut => cut.prompt.includes('800 × 750 × 900 mm') && cut.prompt.includes('저채도')));
  assert.ok(plan.cuts.every(cut => !cut.prompt.includes('[공통 지침]') && !cut.prompt.includes(defaultRules)));
  assert.ok(plan.cuts.every(cut => !cut.prompt.includes('강한 노란빛과 붉은빛을 사용하지 않는다')));
  assert.ok(plan.analysis.includes('이미지 내용은 판독하지 않았습니다'));
  assert.equal(dimensions(product), '800 × 750 × 900 mm (가로 × 깊이 × 높이)');
});

test('new rules refresh cut prompts and preserve edited content', () => {
  const plan = createDemoPlan({ ...defaultProduct, name: '의자' }, 1, defaultRules);
  plan.cuts[0].prompt = plan.cuts[0].prompt.replace('[제품] 의자', '[제품] 사용자가 수정한 의자');
  const updated = applyRulesToPlan(plan, '푸른 회색 조명만 사용');
  assert.ok(updated?.cuts.every(cut => cut.prompt.includes('조명은 푸른 회색 계열로 제한')));
  assert.ok(updated?.cuts.every(cut => !cut.prompt.includes('푸른 회색 조명만 사용') && !cut.prompt.includes('[공통 지침]')));
  assert.ok(updated?.cuts.every(cut => !cut.prompt.includes('황색과 적색 기운')));
  assert.ok(updated?.cuts[0].prompt.includes('사용자가 수정한 의자'));
  assert.deepEqual(applyRulesToPlan(updated, '푸른 회색 조명만 사용'), updated);
});

test('legacy saved prompts lose the exposed rules when migrated', () => {
  const plan = createDemoPlan({ ...defaultProduct, name: '의자' }, 1, defaultRules);
  plan.cuts[0].prompt = '[제품] 사용자가 수정한 의자\n[장면] 거실.\n[공통 지침] 이전 지침 원문';
  delete plan.cuts[0].generatedRuleText;
  const updated = applyRulesToPlan(plan, '푸른 회색 조명만 사용');
  assert.ok(updated?.cuts[0].prompt.includes('사용자가 수정한 의자'));
  assert.ok(!updated?.cuts[0].prompt.includes('이전 지침 원문'));
  assert.ok(updated?.cuts[0].prompt.includes('조명은 푸른 회색 계열로 제한'));
  assert.ok(!buildRuleNarrative('푸른 회색 조명만 사용').includes('푸른 회색 조명만 사용'));
});
