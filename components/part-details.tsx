'use client';
import {
  ArrowUpRight,
  Battery,
  Box,
  Check,
  ChevronRight,
  CircuitBoard,
  Focus,
  Info,
  Layers3,
  RotateCcw,
  ShieldCheck,
  Wrench,
  X,
} from 'lucide-react';
import {
  teaching,
  sources,
  matchingMeshes,
  matchingCatalogue,
  type ModelPart,
  type CataloguePart,
  stageTitles,
} from '@/lib/tool-data';
type Props = {
  stage: number;
  mesh?: ModelPart;
  cataloguePart?: CataloguePart;
  isolated: boolean;
  onIsolate: () => void;
  onFocus: () => void;
  onClose: () => void;
  onNext: () => void;
  onReference: () => void;
  onSelect: (id: string) => void;
  completed: boolean;
};
export default function PartDetails({
  stage,
  mesh,
  cataloguePart,
  isolated,
  onIsolate,
  onFocus,
  onClose,
  onNext,
  onReference,
  onSelect,
  completed,
}: Props) {
  const current = teaching.stages[stage];
  const official =
    cataloguePart || (mesh ? matchingCatalogue(mesh) : undefined);
  if (mesh || cataloguePart) {
    const name = cataloguePart?.nameZh || mesh!.label;
    const Icon =
      mesh?.group === 'battery'
        ? Battery
        : mesh?.group === 'fasteners'
          ? Wrench
          : mesh?.group === 'controls'
            ? CircuitBoard
            : Box;
    const matches = official ? matchingMeshes(official) : [];
    return (
      <aside className="detail-panel part-detail">
        <div className="detail-kicker">
          零件详情
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="返回步骤说明"
          >
            <X size={17} />
          </button>
        </div>
        <div className="detail-illustration">
          <Icon size={47} strokeWidth={1} />
          <span>
            {mesh
              ? mesh.id.toUpperCase()
              : `POSITION ${official?.positions.join(' / ')}`}
          </span>
        </div>
        <span className={'status-chip ' + (official ? '' : 'structural')}>
          {official ? <Check size={12} /> : <Layers3 size={12} />}{' '}
          {official ? '官方备件资料' : '原始 CAD 几何'}
        </span>
        <h2>{name}</h2>
        {official && <p className="part-english">{official.nameEn}</p>}
        <dl className="part-facts">
          {official && (
            <>
              <div>
                <dt>备件编号</dt>
                <dd>{official.formattedPartNumber}</dd>
              </div>
              <div>
                <dt>图中位置</dt>
                <dd>{official.positions.join(' / ')}</dd>
              </div>
              <div>
                <dt>目录数量</dt>
                <dd>
                  {official.quantity}
                  {official.quantity === 9 ? ' 枚' : ' 件 / 套'}
                </dd>
              </div>
            </>
          )}
          {mesh && (
            <>
              <div>
                <dt>CAD 标识</dt>
                <dd>
                  {mesh.name.startsWith('Unnamed')
                    ? mesh.assemblyPath.at(-1)
                    : mesh.name}
                </dd>
              </div>
              <div>
                <dt>几何实例</dt>
                <dd>{mesh.id.toUpperCase()}</dd>
              </div>
            </>
          )}
        </dl>
        {official?.detail && (
          <p className="part-description">{official.detail}</p>
        )}
        {mesh && <p className="part-description">{mesh.note}</p>}
        {official?.serviceNotes.map((note, i) => (
          <div className="evidence-note" key={i}>
            <Wrench size={15} />
            <p>{note}</p>
          </div>
        ))}
        {official && !matches.length && (
          <div className="missing-geometry">
            <Info size={16} />
            <div>
              <strong>此总成没有对应的独立几何</strong>
              <p>在官方备件图中查看，避免将简化模型当作完整实物。</p>
            </div>
          </div>
        )}
        {official && matches.length > 1 && (
          <div className="instance-choices">
            <h3>选择独立实例</h3>
            <div>
              {matches.map((m, i) => (
                <button
                  key={m.id}
                  className={mesh?.id === m.id ? 'chosen' : ''}
                  onClick={() => onSelect(m.id)}
                  aria-label={`选择${m.label}`}
                >
                  {String(i + 1).padStart(2, '0')}
                </button>
              ))}
            </div>
          </div>
        )}
        {mesh && (
          <div className="part-actions">
            <button className="secondary-button" onClick={onFocus}>
              <Focus size={15} />
              聚焦
            </button>
            <button
              className={'secondary-button ' + (isolated ? 'selected' : '')}
              onClick={onIsolate}
            >
              {isolated ? <RotateCcw size={15} /> : <Box size={15} />}{' '}
              {isolated ? '显示全部' : '单件隔离'}
            </button>
          </div>
        )}
        <button className="text-button" onClick={onReference}>
          <Layers3 size={14} />
          查看官方备件图
          <ChevronRight size={14} />
        </button>
        {official && (
          <p className="scope-small">
            目录包含总成、附件和可选版本，数量不能直接相加为整机零件总数。
          </p>
        )}
      </aside>
    );
  }
  const Icon =
    stage === 1
      ? Battery
      : stage === 4
        ? Wrench
        : stage === 6 || stage === 7
          ? CircuitBoard
          : stage === 8
            ? ShieldCheck
            : Box;
  const ref =
    current.sourceRef.find((r) => r.id === 'manual') || current.sourceRef[0];
  const source = sources.find((s) => s.id === ref?.id);
  const sourceUrl =
    ref?.id === 'manual'
      ? `/reference/manual.pdf#page=${(ref as { pages?: number[] }).pages?.[0] ?? 231}`
      : source?.url;
  return (
    <aside className="detail-panel">
      <div className="detail-kicker">
        {stage === 0
          ? '开始探索'
          : current.status === 'structural'
            ? '结构观察'
            : '操作参考'}
        <span>{String(stage + 1).padStart(2, '0')}</span>
      </div>
      <div className="detail-illustration">
        <Icon size={49} strokeWidth={1} />
        <span>
          {stage === 0
            ? 'EXACT ION 2-700'
            : `STEP ${String(stage + 1).padStart(2, '0')}`}
        </span>
      </div>
      <span
        className={
          'status-chip ' + (current.status === 'structural' ? 'structural' : '')
        }
      >
        {current.status === 'verified' ? (
          <Check size={12} />
        ) : (
          <Layers3 size={12} />
        )}{' '}
        {current.status === 'verified'
          ? '官方资料支持'
          : '结构示意 · 非维修顺序'}
      </span>
      <h2>{stageTitles[stage]}</h2>
      <p className="detail-intro">{current.intro}</p>
      <div className="detail-divider" />
      <h3>
        {stage === 0
          ? '开始之前'
          : current.status === 'structural'
            ? '观察与核对'
            : '操作要点'}
      </h3>
      {current.checklist.map((item, i) => (
        <div className="instruction" key={item}>
          <span>{i + 1}</span>
          <p>{item}</p>
        </div>
      ))}
      {stage === 5 && (
        <div className="missing-geometry">
          <Info size={16} />
          <p>
            电机与行星齿轮没有独立 CAD 几何。
            <button onClick={onReference}>
              在官方图中查看
              <ArrowUpRight size={12} />
            </button>
          </p>
        </div>
      )}
      {(stage === 2 || stage === 3) && (
        <p className="scope-small">
          三维模型用于定位前端结构；未核实独立批头或记号环与当前备件的精确对应。
        </p>
      )}
      <div className="evidence-note">
        <ShieldCheck size={15} />
        <p>
          {current.status === 'structural'
            ? '内部展开动画用于结构学习。具体拆卸顺序与维修由合格专业人员核实。'
            : stage === 1
              ? '保持电池外壳完整。取下电池包不等于拆开电池包。'
              : '对工具进行任何工作前，先取下充电电池。'}
        </p>
      </div>
      <button className="primary-button" onClick={onNext}>
        {stage === 8
          ? completed
            ? '已记录 · 返回整体'
            : '完成核对'
          : stage === 0
            ? '开始探索'
            : '已了解，继续'}
        {stage === 8 ? <Check size={16} /> : <ChevronRight size={17} />}
      </button>
      {sourceUrl && (
        <a
          className="detail-source"
          target="_blank"
          rel="noreferrer"
          href={sourceUrl}
        >
          查看{ref?.id === 'manual' ? '说明书对应页' : '资料来源'}
          <ArrowUpRight size={13} />
        </a>
      )}
    </aside>
  );
}
