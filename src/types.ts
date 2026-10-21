export type Product = {
  name: string;
  width: string;
  depth: string;
  height: string;
  material: string;
  color: string;
  features: string;
};

export type Photo = { id: string; name: string; dataUrl: string };
export type Recommendation = { title: string; detail: string };
export type Cut = { id: number; title: string; space: string; composition: string; purpose: string; prompt: string };
export type Plan = {
  source: 'demo' | 'ai';
  analysis: string;
  angles: string[];
  spaces: Recommendation[];
  cameras: Recommendation[];
  cuts: Cut[];
  generatedAt: string;
};
export type Project = {
  id: string;
  updatedAt: string;
  product: Product;
  photos: Photo[];
  commonRules: string;
  plan: Plan | null;
};

export const defaultProduct: Product = {
  name: '', width: '', depth: '', height: '', material: '', color: '', features: '',
};

export const defaultRules = `제품의 형태, 비율, 소재, 색상을 원본 그대로 유지한다.
원본 촬영 각도를 유지하고, 실제 크기와 주변 가구의 비율을 반영한다.
가구 브랜드의 실사 인테리어 화보 스타일. 차갑고 중립적인 색감.
강한 노란빛과 붉은빛을 사용하지 않는다.
화병, 화분, 대형 천장 조명을 배치하지 않는다.
콜라주 및 분할컷 없이 한 이미지에 하나의 공간만 연출한다.`;
