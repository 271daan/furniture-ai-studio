import React from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowRight, Check, ChevronDown, Clipboard, Cloud, FileImage, FolderOpen, ImagePlus, Layers3, Lightbulb, LoaderCircle, Plus, Save, Settings2, Sparkles, Trash2, WandSparkles, X } from 'lucide-react';
import { applyRulesToPlan, createDemoPlan } from './planner';
import { defaultProduct, type Plan, type Product, type Project } from './types';
import { getCommonRules, getProjects, readPhoto, removeProject, saveCommonRules, saveProject } from './storage';
import './style.css';

const freshProject = (): Project => ({ id: crypto.randomUUID(), updatedAt: new Date().toISOString(), product: { ...defaultProduct }, photos: [], commonRules: getCommonRules(), plan: null });
const dateLabel = (date: string) => new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' }).format(new Date(date));

function App() {
  const [project, setProject] = React.useState<Project>(freshProject);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [selectedCut, setSelectedCut] = React.useState(1);
  const [activeTab, setActiveTab] = React.useState<'plan' | 'settings'>('plan');
  const [status, setStatus] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [aiAvailable, setAiAvailable] = React.useState(false);
  const [showProjects, setShowProjects] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const fileInput = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    getProjects().then(items => setProjects(items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))).catch(() => setStatus('프로젝트 저장소를 열 수 없습니다. 브라우저 저장소 설정을 확인하세요.'));
    if (import.meta.env.VITE_STATIC_DEMO !== 'true') {
      fetch('/api/status').then(response => response.json()).then(data => setAiAvailable(Boolean(data.aiAvailable))).catch(() => setAiAvailable(false));
    }
  }, []);

  const setField = (name: keyof Product, value: string) => setProject(current => ({ ...current, product: { ...current.product, [name]: value } }));
  const selected = project.plan?.cuts.find(cut => cut.id === selectedCut);

  async function addPhotos(files: FileList | File[]) {
    const incoming = Array.from(files);
    if (!incoming.length) return;
    if (project.photos.length + incoming.length > 6) return setStatus('사진은 최대 6장까지 등록할 수 있습니다.');
    if (incoming.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024)) return setStatus('JPG, PNG, WEBP 형식의 8MB 이하 사진을 선택하세요.');
    try {
      const photos = await Promise.all(incoming.map(async file => ({ id: crypto.randomUUID(), name: file.name, dataUrl: await readPhoto(file) })));
      setProject(current => ({ ...current, photos: [...current.photos, ...photos] }));
      setStatus(`${photos.length}장의 사진을 추가했습니다. 분석을 다시 실행하면 변경 내용이 반영됩니다.`);
    } catch { setStatus('사진을 읽지 못했습니다. 다시 시도하세요.'); }
  }

  async function save(rulesChanged = false) {
    try {
      const next = { ...project, plan: applyRulesToPlan(project.plan, project.commonRules, project.product), updatedAt: new Date().toISOString() };
      saveCommonRules(next.commonRules);
      await saveProject(next);
      setProject(next);
      setProjects(current => [next, ...current.filter(item => item.id !== next.id)]);
      setStatus(rulesChanged ? '공통 지침을 저장하고 현재 6컷 프롬프트에 반영했습니다.' : '이 브라우저에 프로젝트를 저장했습니다.');
    } catch { setStatus('저장에 실패했습니다. 브라우저의 저장 공간을 확인하세요.'); }
  }

  function makeDemo() {
    if (!project.product.name.trim() || !project.photos.length) return setStatus('제품명과 제품 사진을 먼저 등록하세요.');
    setProject(current => ({ ...current, plan: createDemoPlan(current.product, current.photos.length, current.commonRules) }));
    setSelectedCut(1);
    setActiveTab('plan');
    setStatus('데모 기획을 만들었습니다. 사진 내용은 분석하지 않았습니다.');
  }

  async function analyze() {
    if (!project.product.name.trim() || !project.photos.length) return setStatus('제품명과 제품 사진을 먼저 등록하세요.');
    setBusy(true); setStatus('사진과 제품 정보를 AI로 분석하고 있습니다…');
    try {
      const response = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product: project.product, photos: project.photos, commonRules: project.commonRules }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'AI 분석에 실패했습니다.');
      setProject(current => ({ ...current, plan: data as Plan }));
      setSelectedCut(1); setActiveTab('plan');
      setStatus('실제 AI 이미지 분석과 6컷 기획을 완료했습니다.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'AI 분석에 실패했습니다.'); }
    finally { setBusy(false); }
  }

  async function deleteSaved(id: string) {
    try {
      await removeProject(id);
      setProjects(current => current.filter(item => item.id !== id));
      if (id === project.id) setProject(freshProject());
      setStatus('저장된 프로젝트를 삭제했습니다.');
    } catch { setStatus('프로젝트를 삭제하지 못했습니다.'); }
  }

  async function copyPrompt() {
    if (!selected) return;
    try { await navigator.clipboard.writeText(selected.prompt); setStatus(`CUT ${String(selected.id).padStart(2, '0')} 프롬프트를 복사했습니다.`); }
    catch { setStatus('복사할 수 없습니다. 프롬프트를 선택해 직접 복사하세요.'); }
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Layers3 size={21} strokeWidth={1.8}/></div><div><strong>FURNITURE</strong><span>AI STUDIO</span></div></div>
      <div className="sidebar-label">WORKSPACE</div>
      <nav className="nav-list">
        <button className={activeTab === 'plan' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('plan')}><WandSparkles size={18}/> 스튜디오 <ArrowRight size={16} className="nav-arrow"/></button>
        <button className="nav-item" onClick={() => setShowProjects(true)}><FolderOpen size={18}/> 저장된 프로젝트 <span className="count">{projects.length}</span></button>
        <button className={activeTab === 'settings' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('settings')}><Settings2 size={18}/> 공통 지침</button>
      </nav>
      <div className="sidebar-bottom"><div className="side-note"><span className="note-icon"><Lightbulb size={17}/></span><strong>좋은 결과를 위한 팁</strong><p>제품의 정면과 측면이 보이는 사진을 함께 등록하면 구도 분석에 도움이 됩니다.</p></div><div className="sidebar-foot">© 2026 Furniture AI Studio <span>V 1.0</span></div></div>
    </aside>

    <main className="main">
      <header className="topbar"><div className="breadcrumb">WORKSPACE <span>/</span> <b>{activeTab === 'plan' ? '스튜디오' : '공통 지침'}</b></div><div className="top-actions"><span className={aiAvailable ? 'api-pill online' : 'api-pill'}><i/> {aiAvailable ? 'AI 연결됨' : '데모 모드'}</span><button className="top-save" onClick={() => save()}><Save size={16}/> 프로젝트 저장</button></div></header>
      {activeTab === 'settings' ? <section className="settings-page"><div className="eyebrow">GLOBAL GUIDELINES <span/></div><h1>공통 이미지 생성 지침</h1><p className="page-sub">모든 컷의 생성 프롬프트에 자동으로 포함되는 기준입니다.</p><div className="settings-card"><div className="card-top"><div className="icon-square"><Settings2 size={19}/></div><div><h2>브랜드 이미지 가이드</h2><p>제품의 일관성과 공간 연출 스타일을 설정하세요.</p></div></div><textarea className="rules-input" value={project.commonRules} onChange={event => setProject(current => ({ ...current, commonRules: event.target.value }))} rows={11}/><p className="helper">저장하면 현재 6컷 프롬프트에 바로 반영되고, 새 프로젝트에도 적용됩니다.</p></div><button className="primary-button settings-save" onClick={() => save(true)}><Save size={17}/> 지침 저장 및 반영</button></section> : <>
      <div className="page-heading"><div className="eyebrow">CREATE YOUR STORY <span/></div><h1>공간의 이야기를 설계하세요<span className="heading-dot">.</span></h1><p className="page-sub">제품 사진과 정보를 등록하면 상세페이지를 위한 6컷 스토리와 프롬프트를 만듭니다.</p></div>
      <div className="workspace-grid">
        <div className="input-column">
          <section className="panel product-panel"><div className="panel-title"><div className="step">01</div><div><h2>제품 정보</h2><p>제품의 기본 정보를 입력해 주세요</p></div></div><div className="form-body"><label className="field"><span>제품명 <em>*</em></span><input value={project.product.name} onChange={event => setField('name', event.target.value)} placeholder="예: 오크 라운지 체어"/></label><div className="field"><span>실제 사이즈 <small>mm 단위</small></span><div className="dimensions"><label>가로<input type="number" min="1" value={project.product.width} onChange={event => setField('width', event.target.value)} placeholder="W"/></label><b>×</b><label>깊이<input type="number" min="1" value={project.product.depth} onChange={event => setField('depth', event.target.value)} placeholder="D"/></label><b>×</b><label>높이<input type="number" min="1" value={project.product.height} onChange={event => setField('height', event.target.value)} placeholder="H"/></label></div></div><div className="two-fields"><label className="field"><span>소재</span><input value={project.product.material} onChange={event => setField('material', event.target.value)} placeholder="예: 화이트 오크"/></label><label className="field"><span>컬러</span><input value={project.product.color} onChange={event => setField('color', event.target.value)} placeholder="예: 내추럴 베이지"/></label></div><label className="field"><span>특징</span><textarea value={project.product.features} onChange={event => setField('features', event.target.value)} placeholder="제품의 디자인 포인트, 사용감, 마감 특징 등을 적어주세요" rows={3}/></label></div></section>
          <section className="panel upload-panel"><div className="panel-title"><div className="step">02</div><div><h2>제품 사진</h2><p>다양한 각도의 원본을 올려주세요 <span className="muted-count">{project.photos.length}/6</span></p></div></div><div className="upload-content"><input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={event => { if (event.target.files) addPhotos(event.target.files); event.target.value = ''; }}/><div className={dragging ? 'dropzone dragging' : 'dropzone'} onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); addPhotos(event.dataTransfer.files); }} onClick={() => fileInput.current?.click()} role="button" tabIndex={0} onKeyDown={event => { if (event.key === 'Enter') fileInput.current?.click(); }}><div className="upload-icon"><ImagePlus size={23}/></div><strong>이미지를 드래그하거나 클릭해 업로드</strong><span>JPG, PNG, WEBP · 장당 최대 8MB · 최대 6장</span></div>{project.photos.length > 0 && <div className="photo-list">{project.photos.map((photo, index) => <div className="photo-item" key={photo.id}><img src={photo.dataUrl} alt={`${project.product.name || '제품'} 사진 ${index + 1}`}/><div><strong>PHOTO {String(index + 1).padStart(2, '0')}</strong><span title={photo.name}>{photo.name}</span></div><button aria-label={`${photo.name} 삭제`} onClick={() => setProject(current => ({ ...current, photos: current.photos.filter(item => item.id !== photo.id) }))}><X size={16}/></button></div>)}</div>}</div></section>
          <div className="action-stack"><button className="primary-button" onClick={aiAvailable ? analyze : makeDemo} disabled={busy}>{busy ? <LoaderCircle size={18} className="spin"/> : <Sparkles size={18}/>} {busy ? '분석 중...' : aiAvailable ? 'AI로 6컷 기획하기' : '데모 6컷 기획하기'} <ArrowRight size={18} className="button-arrow"/></button>{aiAvailable && <button className="secondary-button" onClick={makeDemo}>API 없이 데모 기획 만들기</button>}<p>{aiAvailable ? '실제 AI가 사진 내용을 분석합니다. 오류 시 결과를 데모로 바꾸지 않습니다.' : '데모는 입력 정보만 사용합니다. 사진 속 디자인과 각도를 분석하지 않습니다.'}</p></div>
        </div>
        <div className="result-column"><section className="panel result-panel"><div className="result-header"><div><div className="mini-eyebrow">YOUR CREATIVE BLUEPRINT</div><h2>이미지 기획 보드</h2><p>분석부터 컷별 프롬프트까지 한곳에서 확인하세요.</p></div><div className="result-ornament"><Layers3 size={25}/></div></div>{project.plan ? <><div className={project.plan.source === 'ai' ? 'source-banner ai' : 'source-banner'}><div><span>{project.plan.source === 'ai' ? <Sparkles size={16}/> : <FileImage size={16}/>}</span><strong>{project.plan.source === 'ai' ? '실제 AI 분석 결과' : '데모 기획 결과'}</strong></div><small>{project.plan.source === 'ai' ? '업로드된 사진을 AI가 확인했습니다.' : '사진은 등록만 되었으며 내용은 판독하지 않았습니다.'}</small></div><div className="analysis-section"><div className="section-line"><h3>제품 분석</h3><span>ANALYSIS</span></div><p>{project.plan.analysis}</p>{project.plan.angles.length > 0 && <ul className="angle-list">{project.plan.angles.map((angle, index) => <li key={index}>{angle}</li>)}</ul>}</div><div className="recommend-grid"><div><div className="section-line"><h3>추천 공간</h3><span>03</span></div>{project.plan.spaces.map((item, index) => <div className="recommend-item" key={index}><i>{String(index + 1).padStart(2, '0')}</i><div><strong>{item.title}</strong><p>{item.detail}</p></div></div>)}</div><div><div className="section-line"><h3>추천 구도</h3><span>05</span></div>{project.plan.cameras.map((item, index) => <div className="recommend-item" key={index}><i>{String(index + 1).padStart(2, '0')}</i><div><strong>{item.title}</strong><p>{item.detail}</p></div></div>)}</div></div><div className="cuts-section"><div className="section-line"><h3>6컷 스토리보드</h3><span>CUT 01 — 06</span></div><div className="cut-tabs">{project.plan.cuts.map(cut => <button className={selectedCut === cut.id ? 'cut-tab selected' : 'cut-tab'} key={cut.id} onClick={() => setSelectedCut(cut.id)}><span>CUT</span><strong>{String(cut.id).padStart(2, '0')}</strong></button>)}</div>{selected && <div className="cut-detail"><div className="cut-detail-head"><div><span>CUT {String(selected.id).padStart(2, '0')}</span><h4>{selected.title}</h4></div><span className="cut-badge">{selected.space}</span></div><p>{selected.purpose}</p><div className="composition"><span>CAMERA</span> {selected.composition}</div><div className="prompt-head"><strong>이미지 생성 프롬프트</strong><button onClick={copyPrompt}><Clipboard size={15}/> 복사</button></div><textarea aria-label={`CUT ${selected.id} 프롬프트`} value={selected.prompt} onChange={event => setProject(current => ({ ...current, plan: current.plan ? { ...current.plan, cuts: current.plan.cuts.map(cut => cut.id === selected.id ? { ...cut, prompt: event.target.value } : cut) } : null }))} rows={8}/><small>프롬프트를 자유롭게 수정한 뒤 복사하거나 프로젝트에 저장하세요.</small></div>}</div></> : <div className="empty-state"><div className="empty-visual"><div className="empty-orbit orbit-one"/><div className="empty-orbit orbit-two"/><div className="empty-core"><Layers3 size={30} strokeWidth={1.4}/></div><span className="empty-star">✳</span></div><span className="empty-kicker">READY WHEN YOU ARE</span><h3>아직 기획이 시작되지 않았어요</h3><p>왼쪽에 제품 정보와 사진을 등록하고<br/>6컷 기획 버튼을 눌러보세요.</p><div className="empty-steps"><span><Check size={13}/> 제품 등록</span><ArrowRight size={13}/><span><Check size={13}/> 분석</span><ArrowRight size={13}/><span><Check size={13}/> 프롬프트</span></div></div>}</section></div>
      </div></>}
    </main>
    {status && <div className="toast" role="status"><span>{status}</span><button aria-label="알림 닫기" onClick={() => setStatus('')}><X size={15}/></button></div>}
    {showProjects && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setShowProjects(false); }}><div className="project-modal" role="dialog" aria-modal="true" aria-label="저장된 프로젝트"><div className="modal-header"><div><span>YOUR WORK</span><h2>저장된 프로젝트</h2></div><button onClick={() => setShowProjects(false)} aria-label="닫기"><X size={20}/></button></div><button className="new-project" onClick={() => { setProject(freshProject()); setSelectedCut(1); setActiveTab('plan'); setShowProjects(false); setStatus('새 프로젝트를 시작했습니다.'); }}><Plus size={18}/> 새 프로젝트 시작 <ArrowRight size={16}/></button><div className="saved-list">{projects.length ? projects.map(item => <div className="saved-project" key={item.id}><div className="saved-icon"><FileImage size={19}/></div><div><strong>{item.product.name || '이름 없는 프로젝트'}</strong><span>{dateLabel(item.updatedAt)} · 사진 {item.photos.length}장 · {item.plan ? item.plan.source === 'ai' ? 'AI 결과' : '데모 결과' : '기획 전'}</span></div><button className="open-button" onClick={() => { setProject({ ...item, commonRules: getCommonRules(), plan: applyRulesToPlan(item.plan, getCommonRules()) }); setSelectedCut(1); setActiveTab('plan'); setShowProjects(false); setStatus('프로젝트를 불러왔습니다.'); }}>열기</button><button className="delete-button" aria-label={`${item.product.name} 삭제`} onClick={() => { if (window.confirm('이 프로젝트를 삭제할까요?')) deleteSaved(item.id); }}><Trash2 size={16}/></button></div>) : <div className="no-saved">저장된 프로젝트가 없습니다.</div>}</div><p className="modal-note"><Cloud size={14}/> 프로젝트는 현재 브라우저에만 저장됩니다.</p></div></div>}
  </div>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
