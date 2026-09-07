'use client';
import { useEffect, useReducer, useState } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  Box,
  Check,
  ChevronRight,
  CircleHelp,
  Expand,
  Eye,
  Focus,
  Layers3,
  ListTree,
  MousePointer2,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ToolViewer from './tool-viewer';
import PartDetails from './part-details';
import ReferencePanel from './reference-panel';
import { initialState, transition } from '@/lib/exploration.mjs';
import {
  catalogue,
  parts,
  groupNames,
  matchingMeshes,
  stageTitles,
  stageModelIds,
  type CataloguePart,
} from '@/lib/tool-data';
import { useWebMCP } from '@/lib/use-webmcp';

export default function Workbench() {
  const [state, dispatch] = useReducer(transition, initialState);
  const [tab, setTab] = useState('guide');
  const [cataloguePart, setCataloguePart] = useState<CataloguePart>();
  const [dialog, setDialog] = useState<'parts' | 'help' | null>(null);
  const [ready, setReady] = useState(false);
  const [focusRevision, setFocusRevision] = useState(0);
  const selected = parts.find((p) => p.id === state.selected);
  const showGuide = () => {
    setTab('guide');
    setCataloguePart(undefined);
  };
  useWebMCP(state, dispatch, showGuide);
  useEffect(() => {
    if (!state.playing) return;
    const timer = window.setInterval(
      () => dispatch({ type: 'tick', delta: 0.0125 }),
      50,
    );
    return () => clearInterval(timer);
  }, [state.playing]);
  const pick = (id: string | null) => {
    dispatch({ type: 'select', id });
    setCataloguePart(undefined);
  };
  const selectStage = (value: number) => {
    dispatch({ type: 'stage', value });
    setCataloguePart(undefined);
  };
  const pickCatalogue = (part: CataloguePart) => {
    setCataloguePart(part);
    const targets = matchingMeshes(part);
    dispatch({ type: 'select', id: targets[0]?.id || null });
  };
  const navigateTab = (value: unknown) => {
    const v = String(value);
    setTab(v);
    if (v === 'catalogue' && !cataloguePart) pickCatalogue(catalogue.parts[0]);
  };
  const next = () => {
    dispatch({ type: 'complete' });
    if (state.stage < 8) selectStage(state.stage + 1);
    else if (state.completed.includes(8)) selectStage(0);
  };
  const play = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      dispatch({ type: 'amount', value: state.amount >= 1 ? 0 : 1 });
    else dispatch({ type: 'play' });
  };
  const reassemble = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      dispatch({ type: 'amount', value: 0 });
    else dispatch({ type: 'reverse' });
  };
  return (
    <main className="workbench">
      <header className="topbar">
        <a className="brand" href="/" aria-label="拆解实验室首页">
          <span className="brand-symbol">
            <Box size={22} />
          </span>
          <span>
            拆解实验室<span className="brand-en">DISASSEMBLY LAB</span>
          </span>
        </a>
        <div className="header-center">
          <span className="live-dot" />
          交互式技术学习
        </div>
        <a
          className="subtle-link"
          href="https://www.bosch-professional.com/gb/en/products/exact-ion-2-700-0602494400"
          target="_blank"
          rel="noreferrer"
        >
          博世官方资料
          <ArrowUpRight size={16} />
        </a>
      </header>
      <section className="product-header">
        <div>
          <div className="eyebrow">
            <span className="bosch-word">BOSCH</span>
            <span>PROFESSIONAL</span>
            <span className="small-divider" />
            工业电动工具
          </div>
          <h1>
            EXACT ION <span>2-700</span>
          </h1>
          <p>
            中握式充电起子机 <span>／</span> 三维结构与拆解参考
          </p>
        </div>
        <div className="spec-strip">
          <div>
            <strong>
              18<span> V</span>
            </strong>
            <small>锂电平台</small>
          </div>
          <div>
            <strong>
              0.5–2<span> Nm</span>
            </strong>
            <small>扭矩范围</small>
          </div>
          <div>
            <strong>
              70–700<span> rpm</span>
            </strong>
            <small>转速范围</small>
          </div>
        </div>
      </section>
      <div className="workspace-shell">
        <Tabs
          value={tab}
          onValueChange={navigateTab}
          className="workbench-tabs"
        >
          <div className="workspace-nav">
            <TabsList variant="line" className="nav-tabs">
              <TabsTrigger value="guide" className="nav-tab">
                <Layers3 size={16} />
                拆解引导
              </TabsTrigger>
              <TabsTrigger value="catalogue" className="nav-tab">
                <Box size={16} />
                零件目录
              </TabsTrigger>
              <TabsTrigger value="sources" className="nav-tab">
                <BookOpen size={16} />
                参考资料
              </TabsTrigger>
            </TabsList>
            <span className="model-code">TYPE 3 602 D94 400</span>
          </div>
          <TabsContent value={tab} className="workspace-tab-content">
            {tab === 'sources' ? (
              <ReferencePanel />
            ) : (
              <div className="workspace-grid">
                <aside className="steps-panel">
                  {tab === 'guide' ? (
                    <>
                      <div className="panel-heading">
                        <span>探索步骤</span>
                        <span className="micro">
                          {String(state.stage + 1).padStart(2, '0')} / 09
                        </span>
                      </div>
                      <ol className="step-list">
                        {stageTitles.map((title, i) => (
                          <li key={title}>
                            <button
                              onClick={() => selectStage(i)}
                              className={`step-button ${state.stage === i ? 'current' : ''} ${state.completed.includes(i) ? 'done' : ''}`}
                              aria-current={
                                state.stage === i ? 'step' : undefined
                              }
                            >
                              <span className="step-number">
                                {state.completed.includes(i) &&
                                state.stage !== i ? (
                                  <Check size={11} />
                                ) : (
                                  String(i + 1).padStart(2, '0')
                                )}
                              </span>
                              <span>
                                {title}
                                {i === state.stage && (
                                  <small>
                                    {i === 0
                                      ? '从整体，了解每一处细节'
                                      : i >= 4 && i <= 7
                                        ? '结构观察 · 图纸核对'
                                        : '说明书支持的操作'}
                                  </small>
                                )}
                              </span>
                              {i === state.stage && <ChevronRight size={13} />}
                            </button>
                          </li>
                        ))}
                      </ol>
                      <div className="guide-progress">
                        <span>
                          学习进度 <b>{state.completed.length} / 9</b>
                        </span>
                        <Progress
                          value={(state.completed.length / 9) * 100}
                          aria-label="已了解的步骤比例"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="panel-heading">
                        <span>官方备件</span>
                        <span className="count-pill">36</span>
                      </div>
                      <p className="catalogue-scope">含总成、附件与可选版本</p>
                      <div
                        className="catalogue-list"
                        aria-label="全部官方备件目录"
                      >
                        {catalogue.parts.map((p) => (
                          <button
                            key={p.id}
                            className={`catalogue-item ${cataloguePart?.id === p.id ? 'active' : ''}`}
                            onClick={() => pickCatalogue(p)}
                          >
                            <span className="position-number">
                              {p.positions[0]}
                            </span>
                            <span>
                              <strong>{p.nameZh}</strong>
                              <small>{p.partNumber}</small>
                            </span>
                            {p.category !== 'core' && (
                              <span
                                className="variant-dot"
                                title={
                                  catalogue.categories[
                                    p.category as keyof typeof catalogue.categories
                                  ]
                                }
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  <button
                    className="model-list-button"
                    onClick={() => setDialog('parts')}
                  >
                    <ListTree size={16} />
                    <span>模型部件</span>
                    <b>34</b>
                    <ChevronRight size={14} />
                  </button>
                  <div className="left-bottom">
                    <ShieldCheck size={17} />
                    <div>
                      <strong>先断电，再操作</strong>
                      <p>开始前取下电池。内部维修需合格专业人员。</p>
                    </div>
                  </div>
                </aside>
                <section className="viewer-panel">
                  <div className="viewer-top">
                    <span className="viewer-label">
                      <span className="live-dot" />
                      {state.isolated
                        ? '单件隔离'
                        : state.amount > 0.01
                          ? '结构展开视图'
                          : '完整组装视图'}
                    </span>
                    <span className="micro">
                      {ready ? '34 CAD COMPONENTS' : 'LOADING MODEL'}
                    </span>
                  </div>
                  <div className="viewer-stage">
                    <ToolViewer
                      amount={state.amount}
                      selected={state.selected}
                      isolated={state.isolated}
                      cameraRevision={state.cameraRevision}
                      focusRevision={focusRevision}
                      highlightIds={stageModelIds(state.stage)}
                      onSelect={pick}
                      onReady={setReady}
                    />
                    <div className="viewer-tools">
                      <button
                        className="icon-button"
                        disabled={!ready}
                        onClick={() => dispatch({ type: 'camera' })}
                        aria-label="重置视角"
                        title="重置视角"
                      >
                        <RotateCcw size={17} />
                      </button>
                      <button
                        className="icon-button"
                        disabled={!selected || !ready}
                        onClick={() => setFocusRevision((v) => v + 1)}
                        aria-label="聚焦选中部件"
                        title="聚焦选中部件"
                      >
                        <Focus size={17} />
                      </button>
                      <button
                        className={
                          'icon-button ' + (state.isolated ? 'selected' : '')
                        }
                        disabled={!selected || !ready}
                        onClick={() => dispatch({ type: 'isolate' })}
                        aria-label={
                          state.isolated ? '显示全部部件' : '隔离选中部件'
                        }
                        title={state.isolated ? '显示全部部件' : '隔离选中部件'}
                      >
                        {state.isolated ? <Eye size={17} /> : <Box size={17} />}
                      </button>
                      <span />
                      <button
                        className="icon-button"
                        onClick={() => setDialog('help')}
                        aria-label="模型操作说明"
                        title="操作说明"
                      >
                        <CircleHelp size={17} />
                      </button>
                    </div>
                    <div className="scene-tag">
                      <span>01—34</span>
                      <i />
                      精密结构 / 自由探索
                    </div>
                    {selected && (
                      <div className="selection-tag">
                        <span className="live-dot" />
                        <div>
                          <strong>{selected.label}</strong>
                          <small>{selected.id.toUpperCase()}</small>
                        </div>
                        <button
                          onClick={() => pick(null)}
                          aria-label="取消零件选择"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="viewer-bottom">
                    <span>
                      <MousePointer2 size={14} />
                      拖拽旋转
                    </span>
                    <span>滚轮缩放</span>
                    <span>点击部件查看详情</span>
                  </div>
                  <div className="explosion-control">
                    <div className="playback-row">
                      <button
                        className="play-button"
                        disabled={!ready}
                        onClick={play}
                      >
                        {state.playing ? (
                          <Pause size={14} fill="currentColor" />
                        ) : (
                          <Play size={14} fill="currentColor" />
                        )}
                        {state.playing
                          ? '暂停动画'
                          : state.direction < 0 && state.amount > 0
                            ? '播放收拢'
                            : '自动展开'}
                      </button>
                      <button
                        className="playback-text"
                        disabled={!ready || state.amount === 0}
                        onClick={reassemble}
                      >
                        <RotateCcw size={14} />
                        复装回放
                      </button>
                      <button
                        className="playback-text expand-action"
                        disabled={!ready}
                        onClick={() => {
                          dispatch({
                            type: 'amount',
                            value: state.amount > 0.99 ? 0 : 1,
                          });
                        }}
                      >
                        <Expand size={14} />
                        {state.amount > 0.99 ? '全部收拢' : '全部展开'}
                      </button>
                    </div>
                    <div className="control-title">
                      <Layers3 size={15} />
                      <span id="explosion-degree-label">展开程度</span>
                      <b>
                        {Math.round(state.amount * 100)}
                        <span>%</span>
                      </b>
                    </div>
                    <Slider
                      value={[state.amount * 100]}
                      min={0}
                      max={100}
                      step={1}
                      disabled={!ready || state.isolated}
                      aria-labelledby="explosion-degree-label"
                      onValueChange={(value) =>
                        dispatch({
                          type: 'amount',
                          value:
                            (Array.isArray(value) ? value[0] : value) / 100,
                        })
                      }
                    />
                    <div className="range-labels">
                      <span>完整组装</span>
                      <span>结构全展开</span>
                    </div>
                  </div>
                </section>
                <PartDetails
                  stage={state.stage}
                  mesh={selected}
                  cataloguePart={cataloguePart}
                  isolated={state.isolated}
                  onIsolate={() => dispatch({ type: 'isolate' })}
                  onFocus={() => setFocusRevision((v) => v + 1)}
                  onClose={() => {
                    pick(null);
                    setTab('guide');
                  }}
                  onNext={next}
                  onReference={() => setTab('sources')}
                  onSelect={(id) => dispatch({ type: 'select', id })}
                  completed={state.completed.includes(state.stage)}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
        <div className="workspace-footer">
          <span>
            <span className="live-dot" />
            基于博世官方 CAD 与备件资料
            <span className="footer-separator">/</span>几何不覆盖全部内部总成
          </span>
          <button
            onClick={() => {
              dispatch({ type: 'reset' });
              setCataloguePart(undefined);
              setTab('guide');
            }}
          >
            <RotateCcw size={11} />
            重新开始
          </button>
        </div>
      </div>
      <footer className="page-footer">
        <span>精密结构，逐一理解。</span>
        <span>独立教学项目 · 非博世官方服务平台</span>
      </footer>
      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      >
        <DialogContent
          className={dialog === 'parts' ? 'parts-dialog' : 'help-dialog'}
        >
          <DialogHeader>
            <DialogTitle>
              {dialog === 'parts' ? '模型部件 · 34 个几何实例' : '模型操作说明'}
            </DialogTitle>
            <DialogDescription>
              {dialog === 'parts'
                ? '每个实例都可以单独选择。名称按形状或位置标注，原始 CAD 编号保留。'
                : '通过三维模型理解位置关系，并用原厂资料核对实机。'}
            </DialogDescription>
          </DialogHeader>
          {dialog === 'parts' ? (
            <div className="model-tree">
              {Object.entries(groupNames).map(([group, name]) => (
                <section key={group}>
                  <h3>
                    {name}
                    <span>{parts.filter((p) => p.group === group).length}</span>
                  </h3>
                  <div>
                    {parts
                      .filter((p) => p.group === group)
                      .map((p) => (
                        <button
                          key={p.id}
                          className={selected?.id === p.id ? 'chosen' : ''}
                          onClick={() => {
                            pick(p.id);
                            if (tab === 'sources') setTab('guide');
                            setDialog(null);
                          }}
                        >
                          <span
                            className="part-color"
                            style={{ background: p.displayColor }}
                          />
                          <span>
                            <strong>{p.label}</strong>
                            <small>
                              {p.name.startsWith('Unnamed') ? p.id : p.name}
                            </small>
                          </span>
                          <ChevronRight size={14} />
                        </button>
                      ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="help-body">
              <p>
                <MousePointer2 size={19} />
                <span>
                  <b>旋转与缩放</b>
                  鼠标左键拖拽旋转，滚轮缩放；触屏可单指旋转、双指缩放。
                </span>
              </p>
              <p>
                <Box size={19} />
                <span>
                  <b>选择与隔离</b>
                  点击三维部件，或打开「模型部件」列表。选择后可聚焦或单独观察。
                </span>
              </p>
              <p>
                <Layers3 size={19} />
                <span>
                  <b>拆解与复装</b>
                  拖动展开滑杆，或播放展开、收拢动画。动画路径用于观察，不是实机拆卸顺序。
                </span>
              </p>
              <p>
                <BookOpen size={19} />
                <span>
                  <b>核对缺失的内部总成</b>
                  模型没有独立电机和行星齿轮几何。请在零件目录和参考资料中查看官方图。
                </span>
              </p>
              <p className="help-keyboard">
                键盘可用 Tab
                访问控件，方向键调整滑杆；模型部件列表提供完整的键盘选择方式。
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
