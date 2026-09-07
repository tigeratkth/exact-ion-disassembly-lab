import rawModel from './data/model.json';
import rawCatalogue from './data/catalogue.json';
import rawTeaching from './data/teaching.json';
export type ModelPart = (typeof rawModel.meshes)[number] & {
  label: string;
  group: string;
  displayColor: string;
  note: string;
};
const labels = [
  '壳体 · A 侧',
  '壳体 · B 侧',
  '电池包 · 简化主体',
  '电池包外部几何 01',
  '电池包外部几何 02',
  '电池包外部几何 03',
  '电池包外部几何 04',
  '电池包外部几何 05',
  '顶部部件 01',
  '顶部部件 02',
  '前端轴组件',
  '前端薄环',
  '前端套件',
  '电池接口基体',
  '接口部件 01',
  '接口部件 02',
  '接口部件 03',
  '接口部件 04',
  '握柄下部件 01',
  '握柄下部件 02',
  '握柄内组件',
  '前端下部件 · 简化',
  '开关滑块',
  '推杆',
  '前端环件',
  ...Array.from(
    { length: 9 },
    (_, i) => `壳体螺钉 ${String(i + 1).padStart(2, '0')}`,
  ),
];
export const model = rawModel;
export const catalogue = rawCatalogue;
export type CataloguePart = (typeof catalogue.parts)[number];
export const teaching = rawTeaching;
export const sources = teaching.sources;
export const stageTitles = [
  '认识工具',
  '取下电池',
  '取出批头',
  '更换记号环',
  '展开壳体与螺钉',
  '查看传动结构',
  '查看控制组件',
  '核对组件版本',
  '复装与保养检查',
];
export const groupNames: Record<string, string> = {
  housing: '外壳',
  battery: '电池包',
  nose: '前端结构',
  interface: '电池接口',
  controls: '控制与握柄',
  fasteners: '紧固件',
};
export const parts: ModelPart[] = model.meshes.map((p) => {
  const i = p.index;
  const group =
    i < 2
      ? 'housing'
      : i < 8
        ? 'battery'
        : i >= 25
          ? 'fasteners'
          : (i >= 10 && i <= 12) || i === 24
            ? 'nose'
            : i >= 13 && i <= 19
              ? 'interface'
              : 'controls';
  const displayColor =
    i < 2
      ? '#12627e'
      : i >= 25
        ? '#7e8a97'
        : i === 2
          ? '#252f3d'
          : i >= 3 && i <= 7
            ? '#c45555'
            : i === 22 || i === 23
              ? '#d75c5e'
              : i === 24
                ? '#98be75'
                : i >= 10 && i <= 12
                  ? '#afb9c4'
                  : i >= 14 && i <= 17
                    ? '#c6ad72'
                    : i === 18
                      ? '#426b70'
                      : '#8b9caa';
  const note =
    i >= 25
      ? '官方目录位置 80：3 × 18 Torx 螺钉，共 9 枚。回装扭矩 0.8–1.1 Nm（官方图示）。'
      : i >= 2 && i <= 7
        ? '来自历史版电池包 CAD，保留简化外形；不提供电池包内部拆解。'
        : i === 22 || i === 23
          ? 'CAD 原编号与当前备件目录同号，仍需核对实机版本。'
          : '按 CAD 的外形或装配位置命名；原始几何不等于当前可采购的完整总成。';
  return { ...p, label: labels[i] || p.name, group, displayColor, note };
});
export function matchingMeshes(part: CataloguePart) {
  return parts.filter((p) =>
    part.cadExactMatchHints.namePrefixes.some((prefix) =>
      p.name.startsWith(prefix),
    ),
  );
}
export function matchingCatalogue(part: ModelPart) {
  return catalogue.parts.find((p) =>
    p.cadExactMatchHints.namePrefixes.some((prefix) =>
      part.name.startsWith(prefix),
    ),
  );
}
export function stageModelIds(stage: number): string[] {
  const groups: number[][] = [
    [],
    [2, 3, 4, 5, 6, 7],
    [10, 11, 12],
    [24],
    [0, 1, 25, 26, 27, 28, 29, 30, 31, 32, 33],
    [10, 11, 12, 21, 24],
    [13, 14, 15, 16, 17, 18, 19, 20, 22, 23],
    [],
    [],
  ];
  return groups[stage].map((i) => parts[i].id);
}
