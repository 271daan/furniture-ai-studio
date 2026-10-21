import assert from 'node:assert/strict';
import test from 'node:test';
import { createDemoPlan, dimensions } from './planner';
import { defaultProduct, defaultRules } from './types';

test('six unique editable prompts carry product scale and common rules', () => {
  const product = { ...defaultProduct, name: '라운지 체어', width: '800', depth: '750', height: '900', material: '오크', color: '그레이' };
  const plan = createDemoPlan(product, 2, defaultRules);
  assert.equal(plan.source, 'demo');
  assert.equal(plan.cuts.length, 6);
  assert.equal(new Set(plan.cuts.map(cut => cut.prompt)).size, 6);
  assert.ok(plan.cuts.every(cut => cut.prompt.includes('800 × 750 × 900 mm') && cut.prompt.includes('강한 노란빛')));
  assert.ok(plan.analysis.includes('이미지 내용은 판독하지 않았습니다'));
  assert.equal(dimensions(product), '800 × 750 × 900 mm (가로 × 깊이 × 높이)');
});
