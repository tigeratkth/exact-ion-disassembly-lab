'use client';
import {
  ArrowUpRight,
  FileText,
  Box,
  GitCompareArrows,
  ShieldCheck,
  Layers3,
  Info,
} from 'lucide-react';
import { sources } from '@/lib/tool-data';
export default function ReferencePanel() {
  const cards = [
    {
      id: 'manual',
      icon: FileText,
      heading: '使用说明书',
      body: '2025 年版 · 简体中文从第 231 页开始',
      local: '/reference/manual.pdf#page=231',
    },
    {
      id: 'parts',
      icon: Layers3,
      heading: '官方备件目录',
      body: '型号 3 602 D94 400 · 当前备件与版本',
    },
    {
      id: 'model',
      icon: Box,
      heading: '原始三维数据',
      body: '2013 年 STEP · LPack 电池版本',
    },
  ];
  return (
    <section className="references-panel">
      <div className="section-intro">
        <span className="eyebrow">SOURCE LIBRARY</span>
        <h2>每一处结构，都有出处。</h2>
        <p>结合机身铭牌、原厂图纸与说明书，核对手上的具体工具。</p>
      </div>
      <div className="source-cards">
        {cards.map((card) => {
          const s = sources.find((v) => v.id === card.id)!;
          return (
            <a
              key={s.id}
              href={card.local || s.url}
              target="_blank"
              rel="noreferrer"
            >
              <card.icon size={23} />
              <ArrowUpRight className="card-arrow" size={18} />
              <h3>{card.heading}</h3>
              <p>{card.body}</p>
              <span>打开资料</span>
            </a>
          );
        })}
      </div>
      <div className="reference-drawings">
        <article>
          <div className="drawing-heading">
            <Layers3 size={17} />
            <h3>整机备件爆炸图</h3>
            <a
              href="/reference/exploded-1.gif"
              target="_blank"
              rel="noreferrer"
            >
              查看原图
              <ArrowUpRight size={14} />
            </a>
          </div>
          <a href="/reference/exploded-1.gif" target="_blank" rel="noreferrer">
            <img
              src="/reference/exploded-1.gif"
              alt="Bosch EXACT ION 整机官方备件图，含螺钉回装扭矩与防静电维修要求"
            />
          </a>
        </article>
        <article>
          <div className="drawing-heading">
            <GitCompareArrows size={17} />
            <h3>电子组件版本适配</h3>
            <a
              href="/reference/exploded-2.gif"
              target="_blank"
              rel="noreferrer"
            >
              查看原图
              <ArrowUpRight size={14} />
            </a>
          </div>
          <a href="/reference/exploded-2.gif" target="_blank" rel="noreferrer">
            <img
              src="/reference/exploded-2.gif"
              alt="Bosch EXACT ION 旧版和新版电子组件转接线适配图"
            />
          </a>
        </article>
      </div>
      <div className="reference-notes">
        <div>
          <Info size={19} />
          <div>
            <h3>模型的覆盖范围</h3>
            <p>
              34 个几何部件来自官方
              CAD。电机、行星齿轮总成等没有可独立显示的精确几何，请查阅备件图。显示配色经过调整，部分
              CAD 为简化外形。
            </p>
          </div>
        </div>
        <div>
          <ShieldCheck size={19} />
          <div>
            <h3>操作与结构分开核对</h3>
            <p>
              电池、批头和记号环操作来自说明书。内部展开动画只呈现结构关系，不代表经过验证的拆卸顺序。整机维修及保养由合格专业人员进行。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
