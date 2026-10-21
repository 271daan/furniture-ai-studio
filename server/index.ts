import express from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { buildPrompt } from '../src/planner';
import type { Cut, Photo, Plan, Product, Recommendation } from '../src/types';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (existsSync(path.join(root, '.env'))) process.loadEnvFile(path.join(root, '.env'));

const app = express();
app.disable('x-powered-by');
app.use('/api', express.json({ limit: '70mb' }));

app.get('/api/status', (_req, res) => res.json({ aiAvailable: Boolean(process.env.OPENAI_API_KEY), model: process.env.OPENAI_API_KEY ? (process.env.OPENAI_MODEL || 'gpt-4o-mini') : null }));

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function recommendations(value: unknown, count: number): Recommendation[] {
  if (!Array.isArray(value) || value.length !== count) throw new Error(`추천 항목은 ${count}개여야 합니다.`);
  return value.map(item => {
    const title = asText(item?.title), detail = asText(item?.detail);
    if (!title || !detail) throw new Error('추천 항목 형식이 올바르지 않습니다.');
    return { title, detail };
  });
}

app.post('/api/analyze', async (req, res) => {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(503).json({ error: 'AI API 키가 설정되지 않았습니다. 데모 모드를 사용하세요.' });
  const { product, photos, commonRules } = req.body as { product?: Product; photos?: Photo[]; commonRules?: string };
  if (!product || !asText(product.name) || !Array.isArray(photos) || photos.length < 1 || photos.length > 6 || typeof commonRules !== 'string') {
    return res.status(400).json({ error: '제품명, 사진 1~6장, 공통 지침을 확인하세요.' });
  }
  if (photos.some(photo => !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(photo.dataUrl) || photo.dataUrl.length > 11_300_000)) {
    return res.status(400).json({ error: 'JPG, PNG, WEBP 사진만 지원하며 장당 8MB 이하로 업로드하세요.' });
  }
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(90000),
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        temperature: 0.4,
        messages: [
          { role: 'system', content: `당신은 가구 브랜드의 상세페이지 아트 디렉터입니다. 사용자가 제공한 사진을 실제로 보고 보이는 형태, 소재, 색상, 촬영 방향을 조심스럽게 분석하세요. 사진에서 보이지 않는 사실은 단정하지 마세요. 입력한 크기(mm)를 장면의 실제 비율에 반영하세요. 한국어 JSON 객체만 반환하세요. 필드: analysis(문장), angles(사진별 관찰 문장 배열), spaces(정확히 3개의 {title,detail}), cameras(정확히 5개의 {title,detail}), cuts(정확히 6개의 {title,space,composition,purpose}). 각 컷은 서로 다른 역할이며, 기준 사진의 관찰 각도를 재현할 수 있는 구도를 사용하세요. 이미지 생성 결과를 만들었다고 주장하지 마세요.` },
          { role: 'user', content: [
            { type: 'text', text: `제품 정보: ${JSON.stringify(product)}. 사진은 업로드 순서대로 ${photos.length}장입니다. 이미지별 보이는 촬영 방향을 구분해서 적어주세요.` },
            ...photos.map(photo => ({ type: 'image_url', image_url: { url: photo.dataUrl, detail: 'high' } })),
          ] },
        ],
      }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => null) as { error?: { message?: string } } | null;
      return res.status(502).json({ error: `AI 요청 실패 (${response.status}): ${error?.error?.message || 'API 설정을 확인하세요.'}` });
    }
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const raw = JSON.parse(data.choices?.[0]?.message?.content || '{}') as Record<string, unknown>;
    const spaces = recommendations(raw.spaces, 3);
    const cameras = recommendations(raw.cameras, 5);
    if (!Array.isArray(raw.cuts) || raw.cuts.length !== 6 || !Array.isArray(raw.angles) || !asText(raw.analysis)) throw new Error('AI 응답의 필수 항목이 누락되었습니다.');
    const cuts: Cut[] = raw.cuts.map((item, index) => {
      const title = asText(item?.title), space = asText(item?.space), composition = asText(item?.composition), purpose = asText(item?.purpose);
      if (!title || !space || !composition || !purpose) throw new Error('컷 기획 형식이 올바르지 않습니다.');
      return { id: index + 1, title, space, composition, purpose, prompt: buildPrompt(product, commonRules, { title, space, composition, purpose }) };
    });
    const plan: Plan = {
      source: 'ai', analysis: asText(raw.analysis), angles: raw.angles.map(asText).filter(Boolean),
      spaces, cameras, cuts, generatedAt: new Date().toISOString(),
    };
    res.json(plan);
  } catch (error) {
    res.status(502).json({ error: `AI 분석을 완료하지 못했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}` });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(root, 'dist')));
  app.get('/{*path}', (_req, res) => res.sendFile(path.join(root, 'dist/index.html')));
} else {
  const vite = await createViteServer({ root, server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}

const port = Number(process.env.PORT || 3000);
app.listen(port, '0.0.0.0', () => console.log(`Furniture AI Studio: http://localhost:${port}`));
