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

// Rules remain separate from the visible prompt. Demo mode recognizes only the
// supported visual categories; arbitrary natural-language rules require the AI mode.
function sceneDirection(rules: string): string {
  const r = rules.toLowerCase();
  const notes: string[] = [];
  if (/차갑|중립|저채도|페일그레이|웜라이트그레이|라이트토프/.test(r)) notes.push('차분한 중성 계열의 벽과 바닥');
  if (/자연광|왼쪽.*빛|좌측.*빛/.test(r)) notes.push('왼쪽에서 들어오는 부드러운 자연광');
  if (/노란빛|붉은빛|웜톤/.test(r)) notes.push('색온도가 치우치지 않은 담백한 조명');
  if (/화병|화분|대형.*조명|천장 조명/.test(r)) notes.push('큰 장식물 없이 정돈된 가구 배치');
  if (/실제 크기|주변 가구.*비율/.test(r)) notes.push('실물 치수에 맞춘 주변 가구와의 크기 관계');
  if (/원본.*각도|촬영 각도/.test(r)) notes.push('참조 사진과 동일한 제품 방향과 시점');
  if (/콜라주|분할컷|하나의 공간/.test(r)) notes.push('하나의 연속된 실내 장면');
  if (/형태|소재|색상|비율/.test(r)) notes.push('원본과 동일한 제품 구조와 표면 질감');
  return notes.join(', ');
}

export function buildRuleNarrative(rules: string): string {
  return sceneDirection(rules);
}

// Template-only fallback. A genuine image-aware plan requires the AI backend.
const detailedScenes = [
  {
    room: '정돈된 화장대가 놓인 미니멀 침실 코너. 옅은 회색의 평평한 벽, 따뜻한 색조가 없는 아이보리 바닥, 벽에 붙인 간결한 화이트 화장대와 프레임이 얇은 거울을 배치한다.',
    layout: '제품은 화장대 앞, 화면의 중앙에서 조금 벗어난 전경에 놓고 화장대의 전면과 바닥 접지면을 함께 보여준다. 주변에는 접힌 얇은 패브릭과 작은 책 한 권만 배치한다.',
    camera: '제품 원본 사진의 방향과 시점에 맞춘 3/4 구도. 제품 전체와 화장대 일부를 함께 담고, 좌우 여백을 남기는 아이 레벨 중거리 촬영.',
  },
  {
    room: '가로로 긴 창가를 직접 노출하지 않는 밝은 침실의 드레싱 존. 매트한 라이트그레이 벽, 아이보리 타일 바닥, 폭이 좁은 드레싱 테이블과 낮은 수납 가구를 배치한다.',
    layout: '제품은 테이블 앞에서 약간 앞으로 빼 둔 상태로 놓고 동선을 표현한다. 프레임과 좌방석 전체가 가려지지 않도록 테이블 다리와 겹침을 최소화한다.',
    camera: '원본 촬영 방향을 유지한 아이 레벨 와이드. 제품이 과도하게 작아지지 않도록 전경에 배치하고 가구 간 거리를 명확히 보여준다.',
  },
  {
    room: '장식이 절제된 홈오피스와 화장대 겸용 공간. 밝은 무채색 벽과 동일한 톤의 타일 바닥, 얇은 상판의 데스크와 심플한 벽 선반만 사용한다.',
    layout: '제품을 데스크 전면의 독립된 위치에 놓고 실루엣과 다리 프레임이 명확하게 보이도록 배경 가구 사이에 간격을 둔다.',
    camera: '정면 사진이 제공되었다면 정면에 맞추고, 없으면 업로드된 가장 가까운 원본 시점을 유지한다. 왜곡 없는 중거리 제품 중심 구도.',
  },
  {
    room: '매트한 페일그레이 벽과 잔잔한 아이보리 타일을 배경으로 한 밝은 스튜디오형 실내 공간. 배경에는 작은 무지 책과 낮은 보조 테이블만 둔다.',
    layout: '제품의 원단과 프레임 마감이 함께 보이도록 주변 가구를 뒤로 물리고 표면의 그림자와 질감을 부드럽게 살린다.',
    camera: '참조 원본에서 확인 가능한 소재 면을 강조하되 없는 뒷면을 만들지 않는다. 제품의 주요 구조가 보이는 중간 클로즈업.',
  },
  {
    room: '정면 벽에 심플한 화장대를 붙인 실제 크기 비교용 침실 공간. 무광 라이트그레이 벽, 아이보리 타일 바닥, 상판이 얇은 화장대와 높이가 비교 가능한 서랍장을 함께 배치한다.',
    layout: '제품을 화장대 아래에 반쯤 들여놓아 좌방석과 상판의 높이 차이, 다리와 바닥의 접지, 제품 깊이와 화장대 하부 공간을 비교하기 쉽게 보여준다. 치수값 자체를 이미지 위에 쓰지 않는다.',
    camera: '원본 제품과 동일한 좌우 방향을 유지한 아이 레벨 중거리 측면 또는 3/4 구도. 화장대와 제품이 겹치거나 원근 때문에 상대적 크기가 왜곡되지 않게 촬영.',
  },
  {
    room: '조용한 미니멀 베드룸의 완성된 드레싱 공간. 차분한 회색 벽과 아이보리 타일, 심플한 화장대, 한쪽에 접어 둔 무채색 패브릭을 배치한다.',
    layout: '제품을 공간의 주인공으로 전경에 두고 여백을 활용한 브랜드 화보 구성을 만든다. 소품이 제품보다 눈에 띄지 않게 정돈한다.',
    camera: '참조 원본의 3/4 각도와 눈높이를 유지한 조금 넓은 프레이밍. 제품 전체가 잘리지 않는 1장짜리 실사 이미지.',
  },
] as const;

function brandStyling(rules: string): string {
  const mono = /모노그루브|M04|페일그레이/.test(rules);
  const furriden = /퍼리든|F05|라이트토프/.test(rules) && !mono;
  const wall = mono ? 'M04 페일그레이 벽과 아이보리 타일 바닥' : furriden ? 'F05 라이트토프 벽과 밝은 바닥' : '라이트그레이 벽과 아이보리 타일 바닥';
  const light = /좌측|왼쪽|자연광/.test(rules) ? '왼쪽에서 들어오는 부드러운 자연광' : '부드럽고 방향성이 일정한 자연광';
  return `${wall}, ${light}, 노란빛과 붉은빛이 없는 중립적인 화이트 밸런스`;
}

function scenePrompt(product: Product, rules: string, cut: Pick<Cut, 'id' | 'title' | 'space' | 'composition' | 'purpose'>): string {
  const scene = detailedScenes[Math.min(Math.max(cut.id - 1, 0), detailedScenes.length - 1)];
  const productName = product.name || '가구 제품';
  const material = product.material ? `실제 소재는 ${product.material}이며` : '실제 소재는 첨부 사진을 기준으로 하며';
  return `실사 가구 브랜드 상세페이지용 독립된 인테리어 이미지 1장.

제품: ${productName}. 실제 크기 ${dimensions(product)}. ${material}, 제품 컬러는 ${product.color || '첨부 원본의 컬러'}를 따른다.
제품의 특징: ${product.features || '첨부된 제품 원본 이미지로 확인 가능한 형태와 구조만 사용한다.'}

공간 연출: ${scene.room} 색채 및 조명 기준은 ${brandStyling(rules)}.
제품과 가구의 배치: ${scene.layout} 주변 가구의 크기는 제품의 입력 치수와 실제 사용 관계에 맞춘다.
촬영 구도: ${scene.camera} 업로드된 제품 사진 중 구도가 맞는 원본을 참조하되 임의로 원본 제품을 회전시키지 않는다.
디테일: 제품의 곡선, 프레임 형태, 좌방석 두께, 재질감, 색상을 원본 그대로 유지하고 실제 촬영한 것처럼 자연스러운 접지 그림자를 만든다.
제외 요소: 화병, 화분, 대형 천장 조명, 과도한 장식, 붉거나 노란 조명, 창문 자체의 노출, 텍스트, 분할 컷, 콜라주, 제품 변형, 부자연스러운 원근.
출력: 한 장의 독립된 실사 공간 연출 사진. 제품 전체와 지정된 주변 가구가 선명하며 실제 크기 관계가 자연스러운 장면.`;
}

export function buildPrompt(product: Product, _rules: string, cut: Pick<Cut, 'id' | 'title' | 'space' | 'composition' | 'purpose'>): string {
  return scenePrompt(product, _rules, cut);
}

export function applyRulesToPlan(plan: Plan | null, _rules: string, product?: Product): Plan | null {
  if (!plan) return null;
  return {
    ...plan,
    cuts: plan.cuts.map(cut => {
      // Recreate old automatically generated demo prompts instead of attempting
      // fragile string removal; this eliminates legacy appended guideline documents.
      if (plan.source === 'demo' && product && !cut.promptCustomized) {
        return { ...cut, prompt: scenePrompt(product, _rules, cut), generatedRuleText: '' };
      }
      // Keep manually edited prompts as authored, except an identifiable legacy appendix.
      const prompt = cut.prompt.replace(/\n?\[공통 지침\][\s\S]*$/, '').trimEnd();
      return { ...cut, prompt, generatedRuleText: '' };
    }),
  };
}

export function createDemoPlan(product: Product, photoCount: number, rules: string): Plan {
  const cuts: Cut[] = shotTemplates.map(([title, space, composition, purpose], index) => ({
    id: index + 1, title, space, composition, purpose,
    prompt: buildPrompt(product, rules, { id: index + 1, title, space, composition, purpose }),
    generatedRuleText: '',
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
