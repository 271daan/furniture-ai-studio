import { type Cut, type Plan, type Product, type Recommendation } from './types';

const spaceTemplates: Recommendation[] = [
  { title: '미니멀 리빙룸', detail: '정돈된 벽면과 낮은 가구로 제품의 형태를 강조합니다.' },
  { title: '모던 스튜디오', detail: '부드러운 확산광과 절제된 소품으로 소재를 보여줍니다.' },
  { title: '어반 레지던스', detail: '실제 생활 공간의 깊이감으로 크기와 쓰임새를 전달합니다.' },
];

const cameraTemplates: Recommendation[] = [
  { title: '원본 정면 구도', detail: '기준 사진의 수평선과 높이를 유지해 형태를 정확하게 전달' },
  { title: '원본 3/4 구도', detail: '기준 사진의 좌우 방향과 원근감을 유지하며 입체감 표현' },
  { title: '아이 레벨 와이드', detail: '제품 전체와 주변 가구의 크기 관계를 함께 표시' },
  { title: '소재 클로즈업', detail: '원본에서 보이는 면을 중심으로 표면 질감 강조' },
  { title: '공간 컨텍스트', detail: '원본 각도를 유지하면서 여백을 넓혀 공간 활용 제안' },
];

const shotTemplates = [
  ['히어로 컷', '미니멀 리빙룸', '원본 3/4 구도', '첫 화면에서 제품의 실루엣과 분위기 전달'],
  ['공간 제안', '어반 레지던스', '아이 레벨 와이드', '생활 공간 속 실제 사용 장면 제시'],
  ['디자인 포커스', '모던 스튜디오', '원본 정면 구도', '형태와 비율을 명확하게 설명'],
  ['소재 디테일', '모던 스튜디오', '소재 클로즈업', '표면 질감과 마감의 특징 강조'],
  ['사이즈 가이드', '어반 레지던스', '공간 컨텍스트', '주변 가구와 비교하여 실제 크기 체감'],
  ['마무리 무드', '미니멀 리빙룸', '원본 3/4 구도', '브랜드 화보처럼 사용 장면 마무리'],
] as const;

export function dimensions(product: Product): string {
  const values = [product.width, product.depth, product.height];
  return values.every(Boolean) ? `${values.join(' × ')} mm (가로 × 깊이 × 높이)` : '입력된 실제 치수';
}

export function buildPrompt(product: Product, rules: string, cut: Pick<Cut, 'title' | 'space' | 'composition' | 'purpose'>): string {
  return `[제품] ${product.name || '가구 제품'} / 크기 ${dimensions(product)} / 소재 ${product.material || '원본 참조'} / 색상 ${product.color || '원본 참조'} / 특징 ${product.features || '원본 참조'}.
[장면] ${cut.space}. ${cut.title}: ${cut.purpose}. ${cut.composition}로 촬영한다. 업로드한 제품 사진을 제품의 정확한 참조 이미지로 사용한다. 기준 사진에서 보이는 제품의 면과 촬영 방향을 유지한다.
[공통 지침] ${rules.trim()}`;
}

export function applyRulesToPlan(plan: Plan | null, rules: string): Plan | null {
  if (!plan) return null;
  return {
    ...plan,
    cuts: plan.cuts.map(cut => ({
      ...cut,
      prompt: `${cut.prompt.replace(/\n?\[공통 지침\][\s\S]*$/, '').trimEnd()}\n[공통 지침] ${rules.trim()}`,
    })),
  };
}

export function createDemoPlan(product: Product, photoCount: number, rules: string): Plan {
  const cuts: Cut[] = shotTemplates.map(([title, space, composition, purpose], index) => ({
    id: index + 1, title, space, composition, purpose,
    prompt: buildPrompt(product, rules, { title, space, composition, purpose }),
  }));
  return {
    source: 'demo',
    analysis: `데모 분석: ${photoCount}장의 사진이 등록되었습니다. 이미지 내용은 판독하지 않았습니다. ${product.name || '제품'}의 입력 정보(${product.material || '소재 미입력'}, ${product.color || '색상 미입력'})를 바탕으로 일반적인 가구 상세페이지 구성을 제안합니다.`,
    angles: ['데모에서는 사진 속 실제 촬영 각도를 식별하지 않습니다.', '구도 추천은 제품 사진의 기준 각도를 유지한다는 전제로 작성되었습니다.'],
    spaces: spaceTemplates,
    cameras: cameraTemplates,
    cuts,
    generatedAt: new Date().toISOString(),
  };
}
