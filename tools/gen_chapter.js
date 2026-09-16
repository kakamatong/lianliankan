/**
 * @file gen_chapter.js
 * @description 闯关章节配置生成脚本：根据模板库、逐关映射与数值公式，确定性生成 6 个章节配置文件
 * @category 工具脚本
 *
 * 运行方式：
 *   node tools/gen_chapter.js config/chapter
 *
 * 生成文件：
 *   config/chapter/chapter_0.json（章1：30 关，type=2，boss 9/19/29）
 *   config/chapter/chapter_1.json（章2：40 关，type=1，boss 39/49/59/69）
 *   config/chapter/chapter_2.json（章3：50 关，type 每 10 关轮换，boss 79/89/99/109/119）
 *   config/chapter/chapter_3.json（章4：60 关，type 每 10 关轮换，boss 129/139/149/159/169/179，开启挤压玩法）
 *   config/chapter/chapter_4.json（章5：60 关，type 每 10 关轮换，每组末 2 关 boss，仅 boss 开启挤压玩法）
 *   config/chapter/chapter_5.json（章6：60 关，type 每 10 关轮换，每组末 2 关 boss，仅 boss 开启挤压玩法；
 *                                 难度参数照抄章5，额外叠加障碍物：普通关 2 个、Boss 关 4/6/8 个）
 *
 * 规则：
 *  - 模板最小 48 块，外圈恒 0，1 恒双数
 *  - 章1-3 iconTypes = clamp(round(p*0.35)+boss*3, 6, 22)
 *  - 章1-4 仅 Boss 关开启 shiftDir + shiftEdge=2：方向按模板图形决定（三角 R 固定向下 3 保持轮廓，其余对称模板固定 seed 随机 2-5），普通关不移动
 *  - 章4 iconTypes 顶格 22，对子数 36 起步
 *  - 章5 iconTypes 顶格 22，对子数 40 起步，仅 Boss 开启 shiftDir（固定 seed 随机 2-5）+ shiftEdge=2，Boss 体力 10
 *  - 章1-3 type=2: starScore=[p, p+round(0.5p), 2p]；boss [p, p+round(0.7p), round(2.5p)]；targetScore=p / round(1.2p)
 *  - 章4 type=2: starScore=[round(1.1p), p+round(0.6p), round(2.2p)]；boss [round(1.3p), p+round(0.8p), round(2.8p)]
 *  - 章5 type=2: starScore=[2.5p, 3.5p, 4.5p]；boss [3p, 4p, 5p]；targetScore=2.5p / 3p
 *  - 章1-3 type=1: totalTime=6p+15, starTime=[15, 2p+15, 4p+15]；boss 5p+15 / [15, 2p+15, 3p+15]
 *  - 章4 type=1: totalTime=4p+15, starTime=[15, 1.5p+15, 2.5p+15]；boss 3p+15 / [15, p+15, 1.5p+15]
 *  - 章5 type=1: totalTime=4.5p, starTime=[p, 2p+15, 3p]；boss 3p+30 / [p, p+15, 2p+10]
 *  - 章6（chapter_5）：结构、type 轮换、体力、iconTypes、全部数值公式照抄章5；模板序列照抄章5，额外按下列规则摆放障碍物
 *      · 数量：普通关 2 个，Boss 关 4/6/8 个（组1-2 → 4、组3-4 → 6、组5-6 → 8），均为偶数
 *      · 落点：仅图案核心区（行 2-13、列 2-7），不碰外圈，保证外圈走位通路与外圈恒 0 规范
 *      · 优先级：空洞格 > 方块位（占空洞直接压缩连线通道；占方块位会减少对子数，公式按实际 p 计算）
 *      · 咽喉优先：候选格按"四邻不可通行数"打分，优先堵在井口、竖条间等通道口
 *      · 成对镜像：每关随机取左右/上下/中心对称，障碍物成对出现（数量恒为偶数、左右难度公平）
 *      · 互不相邻：障碍物之间切比雪夫距离 ≥ 2，避免 2×2 实心块与闭环（闭环会造成奇数区域无法通关）
 *      · 每关不同：seed 与关卡 index 绑定，并在"咽喉优先/中心优先/均匀分散"三种风格间轮换
 *      · 校验：数量范围、值=101、不越核心区、间距、填充位偶数、各连通区域填充数为偶数
 *  - 生成脚本内置全部校验断言，不满足即报错退出
 */
const fs = require("fs");
const path = require("path");

// ============ 模板 ============
function makeMap() {
  const m = [];
  for (let r = 0; r < 16; r++) m.push(new Array(10).fill(0));
  return m;
}
function set(m, rows, cols) {
  for (const r of rows) for (const c of cols) m[r][c] = 1;
}
function range(a, b) {
  const o = [];
  for (let i = a; i <= b; i++) o.push(i);
  return o;
}
const C18 = range(1, 8);

const T = {};
{
  // I 菱形 48
  let m = makeMap();
  set(m, [1], range(4, 5));
  set(m, [2], range(3, 6));
  set(m, [3], range(2, 7));
  set(m, [4, 5, 6], C18);
  set(m, [7], range(2, 7));
  set(m, [8], range(3, 6));
  set(m, [9], range(4, 5));
  T["I"] = m;
  // K 三宽带 48
  m = makeMap();
  set(m, [2, 3, 7, 8, 12, 13], C18);
  T["K"] = m;
  // H 棋盘 56
  m = makeMap();
  for (let r = 1; r <= 14; r++)
    for (let c = 1; c <= 8; c++) if ((r + c) % 2 === 0) m[r][c] = 1;
  T["H"] = m;
  // L 回字小 64
  m = makeMap();
  set(m, range(3, 12), C18);
  for (let r = 6; r <= 9; r++) for (let c = 3; c <= 6; c++) m[r][c] = 0;
  T["L"] = m;
  // M 四象限 72
  m = makeMap();
  for (const rs of [range(2, 7), range(9, 14)])
    for (const cs of [range(1, 3), range(6, 8)]) set(m, rs, cs);
  T["M"] = m;
  // N U形 72
  m = makeMap();
  set(m, range(1, 4), C18);
  set(m, range(5, 14), [1, 2]);
  set(m, range(5, 14), [7, 8]);
  T["N"] = m;
  // P 砖墙 80
  m = makeMap();
  const even = [];
  const odd = [];
  for (let r = 2; r <= 14; r += 2) even.push(r);
  for (let r = 3; r <= 13; r += 2) odd.push(r);
  set(m, even, C18);
  set(m, odd, [1, 2, 7, 8]);
  T["P"] = m;
  // O 六竖条 84
  m = makeMap();
  set(m, range(1, 14), [1, 2, 4, 5, 7, 8]);
  T["O"] = m;
  // Q 回字大 88
  m = makeMap();
  set(m, range(1, 14), C18);
  for (let r = 5; r <= 10; r++) for (let c = 3; c <= 6; c++) m[r][c] = 0;
  T["Q"] = m;
  // R 三角 100
  m = makeMap();
  set(m, [1], range(4, 5));
  set(m, [2], range(3, 6));
  set(m, [3], range(2, 7));
  set(m, range(4, 14), C18);
  T["R"] = m;
  // S 全满 112
  m = makeMap();
  set(m, range(1, 14), C18);
  T["S"] = m;
  // T45 大井四口 90（全满减 22 洞）
  m = makeMap();
  set(m, range(1, 14), C18);
  for (let r = 6; r <= 9; r++) for (let c = 3; c <= 6; c++) m[r][c] = 0; // 中央 4×4 洞
  for (const c of [4, 5]) {
    m[5][c] = 0;
    m[10][c] = 0; // 上/下小口
  }
  m[7][2] = 0;
  m[7][7] = 0; // 左/右小口
  T["T45"] = m;
  // T46 井字 92（全满减 20 洞）
  m = makeMap();
  set(m, range(1, 14), C18);
  for (let r = 6; r <= 9; r++) for (let c = 3; c <= 6; c++) m[r][c] = 0; // 中央 4×4 洞
  for (const c of [4, 5]) {
    m[5][c] = 0;
    m[10][c] = 0; // 上/下小口
  }
  T["T46"] = m;
  // T48 中央方井 96（全满减 16 洞）
  m = makeMap();
  set(m, range(1, 14), C18);
  for (let r = 6; r <= 9; r++) for (let c = 3; c <= 6; c++) m[r][c] = 0;
  T["T48"] = m;
  // T52 八孔 104（全满减 8 洞）
  m = makeMap();
  set(m, range(1, 14), C18);
  for (let r = 6; r <= 7; r++) for (const c of [2, 4, 5, 7]) m[r][c] = 0;
  T["T52"] = m;
  // T54 四窗 108（全满减 4 洞）
  m = makeMap();
  set(m, range(1, 14), C18);
  for (const r of [5, 10]) for (const c of [2, 7]) m[r][c] = 0;
  T["T54"] = m;
}

// ============ 每关映射 [模板, boss] ============
// 前期: 24,24,28,32,36,36,40,42,44 | boss 50
// 中期: 32,36,36,40,42,44,50,56,50 | boss 56
// 后期: 36,36,40,42,44,50,56,50,44 | boss 56
const PHASE_A = [["I", 0], ["K", 0], ["H", 0], ["L", 0], ["M", 0], ["N", 0], ["P", 0], ["O", 0], ["Q", 0]];
const PHASE_B = [["L", 0], ["M", 0], ["N", 0], ["P", 0], ["O", 0], ["Q", 0], ["R", 0], ["S", 0], ["R", 0]];
const PHASE_C = [["M", 0], ["N", 0], ["P", 0], ["O", 0], ["Q", 0], ["R", 0], ["S", 0], ["R", 0], ["Q", 0]];

const CH1 = [...PHASE_A.map(([t]) => [t, 0]), ["R", 1], ...PHASE_B.map(([t]) => [t, 0]), ["S", 1], ...PHASE_C.map(([t]) => [t, 0]), ["S", 1]];
const CH2 = [...PHASE_A.map(([t]) => [t, 0]), ["R", 1], ...PHASE_B.map(([t]) => [t, 0]), ["S", 1], ...PHASE_B.map(([t]) => [t, 0]), ["S", 1], ...PHASE_C.map(([t]) => [t, 0]), ["S", 1]];
// 章3 五组：type=2 组与 type=1 组交替（70-79 type2, 80-89 type1, 90-99 type2, 100-109 type1, 110-119 type2）
const CH3_GROUP = [
  { type: 2, boss: 9, levels: [...PHASE_A.map(([t]) => [t, 0]), ["R", 1]] },
  { type: 1, boss: 9, levels: [...PHASE_B.map(([t]) => [t, 0]), ["S", 1]] },
  { type: 2, boss: 9, levels: [...PHASE_B.map(([t]) => [t, 0]), ["S", 1]] },
  { type: 1, boss: 9, levels: [...PHASE_C.map(([t]) => [t, 0]), ["S", 1]] },
  { type: 2, boss: 9, levels: [...PHASE_B.map(([t]) => [t, 0]), ["S", 1]] },
];

// ============ 章4（chapter_3.json）：60 关，index 120-179，难度再增一档 ============
// 6 组每 10 关轮换 type=2/1（120-129 type2 ... 170-179 type1），每组末关 boss（129/139/149/159/169/179）
// 对子数起步抬高：组1-2 36 起步、组3-4 40 起步、组5-6 44 起步，boss 全 56
// iconTypes 顶格 22，仅 Boss 关开启挤压玩法（shiftDir 随机 2-5，shiftEdge=2）
// 公式：
//  - type=2: starScore=[round(1.1p), p+round(0.6p), round(2.2p)]；boss [round(1.3p), p+round(0.8p), round(2.8p)]；targetScore=round(1.1p)/round(1.3p)
//  - type=1: totalTime=4p+15, starTime=[15, 1.5p+15, 2.5p+15]；boss totalTime=3p+15, starTime=[15, p+15, 1.5p+15]
const CH4_GROUP = [
  { type: 2, levels: [["M", 0], ["N", 0], ["P", 0], ["O", 0], ["Q", 0], ["R", 0], ["S", 0], ["R", 0], ["Q", 0], ["S", 1]] },
  { type: 1, levels: [["N", 0], ["M", 0], ["P", 0], ["O", 0], ["Q", 0], ["R", 0], ["S", 0], ["Q", 0], ["R", 0], ["S", 1]] },
  { type: 2, levels: [["P", 0], ["O", 0], ["Q", 0], ["R", 0], ["S", 0], ["Q", 0], ["R", 0], ["S", 0], ["R", 0], ["S", 1]] },
  { type: 1, levels: [["O", 0], ["P", 0], ["Q", 0], ["R", 0], ["S", 0], ["R", 0], ["Q", 0], ["R", 0], ["Q", 0], ["S", 1]] },
  { type: 2, levels: [["Q", 0], ["R", 0], ["S", 0], ["R", 0], ["Q", 0], ["R", 0], ["S", 0], ["R", 0], ["Q", 0], ["S", 1]] },
  { type: 1, levels: [["R", 0], ["Q", 0], ["R", 0], ["S", 0], ["R", 0], ["Q", 0], ["R", 0], ["S", 0], ["R", 0], ["S", 1]] },
];

// ============ 章5（chapter_4.json）：60 关，index 180-239，Boss p=56，仅 Boss 关开启挤压玩法 ============
// 6 组每 10 关轮换 type=2/1（180-189 type2 ... 230-239 type1），每组末 2 关 Boss（8 普通 + 2 Boss）
// 对子数爬坡：组1-2 40 起步、组3-4 45 起步、组5-6 50 起步，Boss 全 56
// iconTypes 顶格 22；Boss 关体力 10（普通 5）；公式见 calcScoring5/calcTiming5
const CH5_GROUP = [
  { type: 2, levels: [["P", 0], ["O", 0], ["Q", 0], ["T46", 0], ["T48", 0], ["R", 0], ["T52", 0], ["T54", 0], ["S", 1], ["S", 1]] },
  { type: 1, levels: [["P", 0], ["O", 0], ["Q", 0], ["T46", 0], ["T48", 0], ["R", 0], ["T52", 0], ["T54", 0], ["S", 1], ["S", 1]] },
  { type: 2, levels: [["T45", 0], ["T46", 0], ["T48", 0], ["R", 0], ["T52", 0], ["T54", 0], ["S", 0], ["S", 0], ["S", 1], ["S", 1]] },
  { type: 1, levels: [["T45", 0], ["T46", 0], ["T48", 0], ["R", 0], ["T52", 0], ["T54", 0], ["S", 0], ["S", 0], ["S", 1], ["S", 1]] },
  { type: 2, levels: [["R", 0], ["T52", 0], ["T54", 0], ["S", 0], ["S", 0], ["S", 0], ["S", 0], ["S", 0], ["S", 1], ["S", 1]] },
  { type: 1, levels: [["R", 0], ["T52", 0], ["T54", 0], ["S", 0], ["S", 0], ["S", 0], ["S", 0], ["S", 0], ["S", 1], ["S", 1]] },
];

// ============ 章6（chapter_5.json）：60 关，index 240-299，难度参数照抄章5 + 障碍物 ============
// 结构 / 模板序列 / type 轮换 / 体力 / iconTypes / 全部数值公式均照抄章5（直接复用 CH5_GROUP 与 calcScoring5/calcTiming5）
// 额外叠加障碍物：普通关 组1-2 → 2 个、组3-6 → 4 个；Boss 关 组1-2 → 4 个、组3-4 → 6 个、组5-6 → 8 个（均为偶数）
const CH6_OBSTACLE_NORMAL = [2, 2, 4, 4, 4, 4];
const CH6_OBSTACLE_BOSS = [4, 4, 6, 6, 8, 8];
/** 实际对子数下限（按组）：障碍物占用方块位会让 p 比模板基准低，公式与下限都按实际 p 校验 */
const CH6_P_FLOOR = [
  { normal: 39, boss: 50 },
  { normal: 39, boss: 50 },
  { normal: 44, boss: 50 },
  { normal: 44, boss: 50 },
  { normal: 49, boss: 50 },
  { normal: 49, boss: 50 },
];
/** 障碍物 seed 基址：seed = 基址 + index × 131（逐关布局不同且可复现） */
const CH6_OBSTACLE_SEED = 240000;

/**
 * 固定 seed 伪随机（mulberry32），保证生成结果可复现
 */
function seededRandom(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = seededRandom(20260812);

/**
 * Boss 关移动方向映射：按模板图形决定，移动时尽量不破坏图形形状
 * R（三角，上窄下宽）：各列连续填充，向下压缩（3）前后形状完全不变，向上/左右会立即破坏轮廓 → 固定向下
 * 其余模板（如全满 S）图形对称：四个方向压缩效果等价 → 固定 seed 随机 2-5
 */
const BOSS_SHIFT_DIR = { R: 3 };
function pickShiftDir(tmplName, rnd) {
    if (BOSS_SHIFT_DIR[tmplName] !== undefined) return BOSS_SHIFT_DIR[tmplName];
    return 2 + Math.floor(rnd() * 4);
}

// ============ 数值公式 ============
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
function calcIcon(p, boss) {
  return clamp(Math.round(p * 0.35) + (boss ? 3 : 0), 6, 22);
}
function calcScoring(p, boss) {
  if (boss) {
    return {
      starScore: [p, p + Math.round(p * 0.7), Math.round(p * 2.5)],
      targetScore: Math.round(p * 1.2),
    };
  }
  return { starScore: [p, p + Math.round(p * 0.5), p * 2], targetScore: p };
}
function calcTiming(p, boss) {
  if (boss) {
    return { totalTime: 5 * p + 15, starTime: [15, 2 * p + 15, 3 * p + 15] };
  }
  return { totalTime: 6 * p + 15, starTime: [15, 2 * p + 15, 4 * p + 15] };
}
// 章4 进阶公式
function calcScoring4(p, boss) {
  if (boss) {
    return {
      starScore: [Math.round(p * 1.3), p + Math.round(p * 0.8), Math.round(p * 2.8)],
      targetScore: Math.round(p * 1.3),
    };
  }
  return { starScore: [Math.round(p * 1.1), p + Math.round(p * 0.6), Math.round(p * 2.2)], targetScore: Math.round(p * 1.1) };
}
function calcTiming4(p, boss) {
  if (boss) {
    return { totalTime: 3 * p + 15, starTime: [15, p + 15, 1.5 * p + 15] };
  }
  return { totalTime: 4 * p + 15, starTime: [15, 1.5 * p + 15, 2.5 * p + 15] };
}
// 章5 公式
function calcScoring5(p, boss) {
  if (boss) {
    return { starScore: [3 * p, 4 * p, 5 * p], targetScore: 3 * p };
  }
  return { starScore: [2.5 * p, 3.5 * p, 4.5 * p], targetScore: 2.5 * p };
}
function calcTiming5(p, boss) {
  if (boss) {
    return { totalTime: 3 * p + 30, starTime: [p, p + 15, 2 * p + 10] };
  }
  return { totalTime: 4.5 * p, starTime: [p, 2 * p + 15, 3 * p] };
}

// ============ 校验 ============
function countOnes(m) {
  let n = 0;
  for (let r = 0; r < 16; r++) for (let c = 0; c < 10; c++) if (m[r][c] === 1) n++;
  return n;
}
/** 统计障碍物数量（值 > 100） */
function countObstacles(m) {
  let n = 0;
  for (let r = 0; r < 16; r++) for (let c = 0; c < 10; c++) if (m[r][c] > 100) n++;
  return n;
}
function validateMap(name, m) {
  if (m.length !== 16) throw new Error(`${name}: 行数 != 16`);
  for (const row of m) if (row.length !== 10) throw new Error(`${name}: 列数 != 10`);
  for (let c = 0; c < 10; c++) {
    if (m[0][c] !== 0 || m[15][c] !== 0) throw new Error(`${name}: 外圈(上下)非 0`);
  }
  for (let r = 0; r < 16; r++) {
    if (m[r][0] !== 0 || m[r][9] !== 0) throw new Error(`${name}: 外圈(左右)非 0`);
  }
  const n = countOnes(m);
  if (n % 2 !== 0) throw new Error(`${name}: 1 的个数 ${n} 不是双数`);
  return n;
}

const expectedTiles = { I: 48, K: 48, H: 56, L: 64, M: 72, N: 72, P: 80, O: 84, Q: 88, R: 100, S: 112, T45: 90, T46: 92, T48: 96, T52: 104, T54: 108 };
for (const [k, m] of Object.entries(T)) {
  const n = validateMap(`模板${k}`, m);
  if (n !== expectedTiles[k]) throw new Error(`模板${k}: 方块数 ${n} != 期望 ${expectedTiles[k]}`);
}

// ============ 障碍物摆放（第六章） ============
/** 障碍物值（地图里 >100 即为障碍物，资源名 80_值；美术目前只提供 80_101） */
const OBSTACLE_VALUE = 101;
/** 对称样式数量：0=左右镜像、1=上下镜像、2=中心对称 */
const OBSTACLE_SYMMETRY_COUNT = 3;
/** 布局风格数量：0=咽喉优先、1=中心优先、2=均匀分散 */
const OBSTACLE_STYLE_COUNT = 3;
/** 障碍物可落区域：图案核心区（行 2-13、列 2-7），不碰外圈与最外一圈方块 */
const OBSTACLE_ROW_MIN = 2;
const OBSTACLE_ROW_MAX = 13;
const OBSTACLE_COL_MIN = 2;
const OBSTACLE_COL_MAX = 7;

/** 是否允许放障碍物（核心区内） */
function isObstacleCell(r, c) {
  return r >= OBSTACLE_ROW_MIN && r <= OBSTACLE_ROW_MAX && c >= OBSTACLE_COL_MIN && c <= OBSTACLE_COL_MAX;
}

/** 对称映射：把核心区内的 (r,c) 映射到对称位置（映射后仍在核心区内） */
function mirrorCell(r, c, mode) {
  if (mode === 0) return [r, 9 - c]; // 左右镜像
  if (mode === 1) return [15 - r, c]; // 上下镜像
  return [15 - r, 9 - c]; // 中心对称
}

/** 咽喉度：四邻中不可通行（方块或障碍物）的数量，越高越像通道口 */
function chokeScore(map, r, c) {
  let n = 0;
  for (const [nr, nc] of [
    [r - 1, c],
    [r + 1, c],
    [r, c - 1],
    [r, c + 1],
  ]) {
    if (map[nr][nc] !== 0) n++;
  }
  return n;
}

/** 中心度：到核心区边缘的最近距离，越大越靠中心 */
function centerScore(r, c) {
  return Math.min(r - OBSTACLE_ROW_MIN, OBSTACLE_ROW_MAX - r, c - OBSTACLE_COL_MIN, OBSTACLE_COL_MAX - c);
}

/** 逐关逐格确定性抖动（0~1）：同样的关卡+格子永远得到同样的值，用于让同一模板在不同关卡产生不同布局 */
function cellJitter(seed, r, c) {
  let h = (seed * 374761393 + r * 668265263 + c * 2147483647) >>> 0;
  h = ((h ^ (h >>> 13)) * 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * 摆放障碍物（就地修改 map）：按对称成对放置，空洞优先、咽喉优先、围绕本关锚点分布
 * @param {number[][]} map - 地图（1=方块，0=空洞）
 * @param {number} count - 障碍物数量（偶数）
 * @param {number} seed - 该关固定 seed（逐格抖动由此决定）
 * @param {number} mode - 对称样式
 * @param {number} style - 布局风格
 * @param {{r: number, c: number}} anchor - 本关布局锚点（核心区内的一个随机点，决定障碍物聚集区域）
 * @param {number} spreadPairs - 强制落在方块位上的对数（0=全部优先空洞；用于在需要时换出不同布局）
 * @returns {Array<Array<number>> | null} 落点数组，方案不可行时返回 null
 */
function placeObstacles(map, count, seed, mode, style, anchor, spreadPairs) {
  // 候选格打分：空洞优先（300 分，远高于其它项，保证尽量不减少对子数），再叠加风格权重、锚点距离与逐格抖动
  const scored = [];
  for (let r = OBSTACLE_ROW_MIN; r <= OBSTACLE_ROW_MAX; r++) {
    for (let c = OBSTACLE_COL_MIN; c <= OBSTACLE_COL_MAX; c++) {
      const v = map[r][c];
      if (v > 100) continue;
      const isVoid = v === 0;
      const choke = chokeScore(map, r, c);
      const center = centerScore(r, c);
      let score = isVoid ? 300 : 0;
      if (style === 0) score += choke * 8; // 咽喉优先：堵通道口
      else if (style === 1) score += center * 10 + choke * 2; // 中心优先：中间开花
      else score += choke * 2 + center * 2; // 均匀分散
      // 锚点偏好：越靠近本关锚点越优先 → 同一模板在不同关卡呈现不同布局
      score -= Math.max(Math.abs(r - anchor.r), Math.abs(c - anchor.c)) * 5;
      score += cellJitter(seed, r, c) * 40; // 逐格抖动：相同模板在不同关卡选出不同的落点
      scored.push({ r, c, score });
    }
  }
  scored.sort((a, b) => b.score - a.score);

  const placed = [];
  const freeCell = (r, c) => isObstacleCell(r, c) && map[r][c] <= 100;
  const farEnough = (r, c) => placed.every((p) => Math.max(Math.abs(p[0] - r), Math.abs(p[1] - c)) >= 2);

  /** 尝试以 cand 与其镜像点成对落子 */
  const tryPlace = (cand) => {
    const [mr, mc] = mirrorCell(cand.r, cand.c, mode);
    if (!freeCell(cand.r, cand.c) || !freeCell(mr, mc)) return false;
    if (Math.max(Math.abs(cand.r - mr), Math.abs(cand.c - mc)) < 2) return false; // 镜像点与自己太近
    if (map[cand.r][cand.c] !== map[mr][mc]) return false; // 成对落点必须同类型，保证占用方块位数量为偶数
    if (!farEnough(cand.r, cand.c) || !farEnough(mr, mc)) return false; // 与已放障碍物不相邻
    map[cand.r][cand.c] = OBSTACLE_VALUE;
    map[mr][mc] = OBSTACLE_VALUE;
    placed.push([cand.r, cand.c], [mr, mc]);
    return true;
  };

  const totalPairs = count / 2;
  const minTilePairs = Math.min(spreadPairs, totalPairs); // 至少留这么多对落在方块位（换布局用）
  const maxVoidPairs = totalPairs - minTilePairs;

  // 第一遍：尽量落在空洞格（不减少对子数），最多 maxVoidPairs 对
  let voidPairs = 0;
  for (const cand of scored) {
    if (voidPairs >= maxVoidPairs) break;
    if (map[cand.r][cand.c] !== 0) continue;
    if (tryPlace(cand)) voidPairs++;
  }

  // 第二遍：剩余的对落在方块位（模板没有足够空洞时如全满模板，全部落在这里）
  const needTilePairs = totalPairs - voidPairs;
  let tilePairs = 0;
  for (const cand of scored) {
    if (tilePairs >= needTilePairs) break;
    if (map[cand.r][cand.c] !== 1) continue;
    if (tryPlace(cand)) tilePairs++;
  }
  if (tilePairs < needTilePairs) return null; // 该方案放不下（间距/对称约束太紧）

  return placed;
}

/** 已用棋盘签名集合：保证本章任意两关的画面（可消除方块位置）都不完全相同 */
const usedLayoutSignatures = new Set();
/** 兜底次数：确实换不出新棋盘时沿用重复布局的关卡数（正常应为 0） */
let layoutFallbackCount = 0;

/** 棋盘签名：可消除方块（值=1）的位置集合，即玩家看到的图案 */
function layoutSignature(map) {
  let s = "";
  for (let r = 0; r < 16; r++) {
    for (let c = 0; c < 10; c++) {
      if (map[r][c] === 1) s += `${r},${c};`;
    }
  }
  return s;
}

/**
 * 在模板上摆放障碍物：
 *  1. 由关卡 seed 决定对称样式顺序、布局风格、布局锚点与逐格抖动（因此逐关不同）
 *  2. 三种对称样式各试一次，优先"全部落在空洞"（不减少对子数）
 *  3. 与已用布局重复时换一组子 seed 重试；仍重复则允许"多占 1 对方块位"（受 maxTiles 预算约束）
 * @param {number[][]} templateMap - 模板地图（不含障碍物）
 * @param {number} count - 障碍物数量（偶数）
 * @param {number} seed - 该关固定 seed
 * @param {number} maxTiles - 允许占用的方块位数量上限（偶数）
 * @returns {{map: number[][], mode: number, style: number, tilesUsed: number, anchor: object}}
 */
function applyObstacles(templateMap, count, seed, maxTiles) {
  let fallback = null;
  const maxAttempts = 32;
  const plainAttempts = 10; // 前 10 次只用空洞；之后逐步允许牺牲更多对方块位来换出不同布局

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const s = seed + attempt * 104729;
    const shuffleRng = seededRandom(s);
    const modeOrder = [0, 1, 2];
    for (let i = modeOrder.length - 1; i > 0; i--) {
      const j = Math.floor(shuffleRng() * (i + 1));
      [modeOrder[i], modeOrder[j]] = [modeOrder[j], modeOrder[i]];
    }
    const style = Math.floor(shuffleRng() * OBSTACLE_STYLE_COUNT);
    const anchor = {
      r: OBSTACLE_ROW_MIN + Math.floor(shuffleRng() * (OBSTACLE_ROW_MAX - OBSTACLE_ROW_MIN + 1)),
      c: OBSTACLE_COL_MIN + Math.floor(shuffleRng() * (OBSTACLE_COL_MAX - OBSTACLE_COL_MIN + 1)),
    };
    const spreadPairs = Math.max(0, Math.min(count / 2, Math.floor(attempt / plainAttempts)));

    for (const mode of modeOrder) {
      const map = templateMap.map((r) => r.slice());
      const placed = placeObstacles(map, count, s + (mode + 1) * 7919, mode, style, anchor, spreadPairs);
      if (!placed) continue;
      const tilesUsed = placed.filter(([r, c]) => templateMap[r][c] === 1).length;
      if (tilesUsed > maxTiles) continue;

      const candidate = { map, mode, style, tilesUsed, anchor };
      const signature = layoutSignature(map);
      if (!usedLayoutSignatures.has(signature)) {
        usedLayoutSignatures.add(signature);
        return candidate;
      }
      if (!fallback) fallback = candidate;
    }
  }

  // 兜底：确实换不出新棋盘时沿用第一个可行方案（并计数上报）
  usedLayoutSignatures.add(layoutSignature(fallback.map));
  layoutFallbackCount++;
  return fallback;
}

/** 障碍物校验：数量范围、取值、落点、间距、填充位偶数、各连通区域填充数为偶数 */
function validateObstacles(name, map, boss) {
  const cells = [];
  for (let r = 0; r < 16; r++) {
    for (let c = 0; c < 10; c++) {
      const v = map[r][c];
      if (v > 100) {
        if (v !== OBSTACLE_VALUE) throw new Error(`${name}: 障碍物值 ${v} != ${OBSTACLE_VALUE}`);
        if (!isObstacleCell(r, c)) throw new Error(`${name}: 障碍物越出核心区 (${r},${c})`);
        cells.push([r, c]);
      }
    }
  }
  const min = boss ? 4 : 2;
  const max = boss ? 8 : 4;
  if (cells.length < min || cells.length > max) throw new Error(`${name}: 障碍物数量 ${cells.length} 不在 [${min},${max}]`);
  if (cells.length % 2 !== 0) throw new Error(`${name}: 障碍物数量 ${cells.length} 不是偶数`);
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      if (Math.max(Math.abs(cells[i][0] - cells[j][0]), Math.abs(cells[i][1] - cells[j][1])) < 2) {
        throw new Error(`${name}: 障碍物 (${cells[i]}) 与 (${cells[j]}) 相邻`);
      }
    }
  }
  const n = countOnes(map);
  if (n % 2 !== 0) throw new Error(`${name}: 障碍物处理后填充位 ${n} 不是双数`);

  // 连通区域奇偶：障碍物围成的每个区域，填充位必须为偶数，否则区域内会剩单块无法消除
  const seen = Array.from({ length: 16 }, () => new Array(10).fill(false));
  const regions = [];
  for (let r = 0; r < 16; r++) {
    for (let c = 0; c < 10; c++) {
      if (seen[r][c] || map[r][c] > 100) continue;
      let fills = 0;
      const stack = [[r, c]];
      seen[r][c] = true;
      while (stack.length) {
        const [cr, cc] = stack.pop();
        if (map[cr][cc] === 1) fills++;
        for (const [nr, nc] of [
          [cr - 1, cc],
          [cr + 1, cc],
          [cr, cc - 1],
          [cr, cc + 1],
        ]) {
          if (nr < 0 || nr >= 16 || nc < 0 || nc >= 10) continue;
          if (seen[nr][nc] || map[nr][nc] > 100) continue;
          seen[nr][nc] = true;
          stack.push([nr, nc]);
        }
      }
      if (fills > 0) regions.push(fills);
    }
  }
  for (const fills of regions) {
    if (fills % 2 !== 0) throw new Error(`${name}: 存在奇数填充区域（区域填充数 [${regions}]）`);
  }
  return cells.length;
}

// ============ 生成 ============
/**
 * 章1-3 关卡构建：普通关不移动，Boss 关开启挤压玩法（方向按模板图形，shiftEdge=2）
 */
function buildEntry(chapter, index, tmplName, boss, type) {
  const map = T[tmplName].map((r) => r.slice());
  const p = countOnes(map) / 2;
  const iconTypes = calcIcon(p, boss);
  const e = { chapter, index, map, iconTypes, type, boss, energy: 5 };
  if (boss) {
    e.shiftDir = pickShiftDir(tmplName, rand);
    e.shiftEdge = 2;
  }
  if (type === 1) {
    const t = calcTiming(p, boss);
    const starTime = t.starTime.map((x) => Math.round(x));
    const totalTime = Math.round(t.totalTime);
    if (!(starTime[0] < starTime[1] && starTime[1] < starTime[2])) throw new Error(`L${index}: starTime 未递增`);
    if (!(starTime[2] < totalTime)) throw new Error(`L${index}: starTime[2] >= totalTime`);
    if (iconTypes > p) throw new Error(`L${index}: iconTypes(${iconTypes}) > p(${p})`);
    return { ...e, totalTime, starTime };
  } else {
    const s = calcScoring(p, boss);
    const starScore = s.starScore.map((x) => Math.round(x));
    if (!(starScore[0] < starScore[1] && starScore[1] < starScore[2])) throw new Error(`L${index}: starScore 未严格递增`);
    if (iconTypes > p) throw new Error(`L${index}: iconTypes(${iconTypes}) > p(${p})`);
    return { ...e, starScore, targetScore: Math.round(s.targetScore) };
  }
}

/**
 * 章4 关卡构建：难度再增一档，仅 Boss 关开启挤压玩法（方向按模板图形，shiftEdge=2），普通关不移动
 */
function buildEntry4(index, tmplName, boss, type) {
  const map = T[tmplName].map((r) => r.slice());
  const p = countOnes(map) / 2;
  const iconTypes = 22; // 顶格
  const e = { chapter: 3, index, map, iconTypes, type, boss, energy: 5 };
  if (boss) {
    e.shiftDir = pickShiftDir(tmplName, rand);
    e.shiftEdge = 2;
  }
  if (type === 1) {
    const t = calcTiming4(p, boss);
    const starTime = t.starTime.map((x) => Math.round(x));
    const totalTime = Math.round(t.totalTime);
    if (!(starTime[0] < starTime[1] && starTime[1] < starTime[2])) throw new Error(`L${index}: starTime 未递增`);
    if (!(starTime[2] < totalTime)) throw new Error(`L${index}: starTime[2] >= totalTime`);
    if (iconTypes > p) throw new Error(`L${index}: iconTypes(${iconTypes}) > p(${p})`);
    return { ...e, totalTime, starTime };
  } else {
    const s = calcScoring4(p, boss);
    const starScore = s.starScore.map((x) => Math.round(x));
    if (!(starScore[0] < starScore[1] && starScore[1] < starScore[2])) throw new Error(`L${index}: starScore 未严格递增`);
    if (iconTypes > p) throw new Error(`L${index}: iconTypes(${iconTypes}) > p(${p})`);
    return { ...e, starScore, targetScore: Math.round(s.targetScore) };
  }
}

const rand5 = seededRandom(20260813); // 章5 独立固定 seed，不影响章4 随机序列

/**
 * 章5 关卡构建：Boss 关开启挤压玩法（shiftDir 随机 2-5，shiftEdge=2）且体力 10，普通关不移动且体力 5
 */
function buildEntry5(index, tmplName, boss, type) {
  const map = T[tmplName].map((r) => r.slice());
  const p = countOnes(map) / 2;
  const iconTypes = 22; // 顶格
  const e = { chapter: 4, index, map, iconTypes, type, boss, energy: boss ? 10 : 5 };
  if (boss) {
    e.shiftDir = 2 + Math.floor(rand5() * 4);
    e.shiftEdge = 2;
  }
  if (type === 1) {
    const t = calcTiming5(p, boss);
    const starTime = t.starTime.map((x) => Math.round(x));
    const totalTime = Math.round(t.totalTime);
    if (!(starTime[0] < starTime[1] && starTime[1] < starTime[2])) throw new Error(`L${index}: starTime 未递增`);
    if (!(starTime[2] < totalTime)) throw new Error(`L${index}: starTime[2] >= totalTime`);
    if (iconTypes > p) throw new Error(`L${index}: iconTypes(${iconTypes}) > p(${p})`);
    return { ...e, totalTime, starTime };
  } else {
    const s = calcScoring5(p, boss);
    const starScore = s.starScore.map((x) => Math.round(x));
    if (!(starScore[0] < starScore[1] && starScore[1] < starScore[2])) throw new Error(`L${index}: starScore 未严格递增`);
    if (iconTypes > p) throw new Error(`L${index}: iconTypes(${iconTypes}) > p(${p})`);
    return { ...e, starScore, targetScore: Math.round(s.targetScore) };
  }
}

const rand6 = seededRandom(20260901); // 章6 独立固定 seed，不影响章1-5 的随机序列

/**
 * 章6 关卡构建：结构、体力、iconTypes、数值公式全部照抄章5，额外按关卡摆放障碍物
 * 障碍物布局由「关卡 index 绑定 seed」决定（对称样式 + 布局风格 + 抖动），因此逐关不同且可复现
 * @param {number} index - 关卡索引
 * @param {string} tmplName - 模板名
 * @param {number} boss - 是否 Boss 关
 * @param {number} type - 关卡规则（1=计时，2=计分）
 * @param {number} obstacleCount - 障碍物数量（偶数：普通 2/4，Boss 4/6/8）
 */
function buildEntry6(index, tmplName, boss, type, obstacleCount, pFloor) {
  // 障碍物：按关卡 seed 选对称样式、布局风格与布局锚点，并优先落在空洞格（尽量不减少对子数）
  const baseP = countOnes(T[tmplName]) / 2;
  const maxTiles = Math.max(0, (baseP - pFloor) * 2); // 该关允许占用的方块位上限（偶数，保证填充位仍为双数）
  const layout = applyObstacles(T[tmplName], obstacleCount, CH6_OBSTACLE_SEED + index * 131, maxTiles);
  const map = layout.map;
  validateObstacles(`L${index}`, map, boss);

  if (process.env.CH6_DEBUG) {
    const cells = [];
    for (let r = 0; r < 16; r++) for (let c = 0; c < 10; c++) if (map[r][c] > 100) cells.push(`(${r},${c})`);
    console.log(
      `[调试] L${index} ${tmplName} ${boss ? "BOSS" : "普通"} 模板p=${baseP} 实际p=${countOnes(map) / 2} 障碍=${obstacleCount} ` +
        `对称=${layout.mode} 风格=${layout.style} 锚点=(${layout.anchor.r},${layout.anchor.c}) 占方块位=${layout.tilesUsed} 落点=${cells.join(" ")}`
    );
  }

  // 实际对子数：占用方块位的障碍物会让 p 略低于模板基准值，公式按实际 p 计算
  const p = countOnes(map) / 2;
  if (p < pFloor) throw new Error(`L${index}: 实际对子数 ${p} 低于本章下限 ${pFloor}`);
  const iconTypes = 22; // 顶格（照抄章5）
  const e = { chapter: 5, index, map, iconTypes, type, boss, energy: boss ? 10 : 5 };
  if (boss) {
    e.shiftDir = 2 + Math.floor(rand6() * 4);
    e.shiftEdge = 2;
  }
  if (type === 1) {
    const t = calcTiming5(p, boss);
    const starTime = t.starTime.map((x) => Math.round(x));
    const totalTime = Math.round(t.totalTime);
    if (!(starTime[0] < starTime[1] && starTime[1] < starTime[2])) throw new Error(`L${index}: starTime 未递增`);
    if (!(starTime[2] < totalTime)) throw new Error(`L${index}: starTime[2] >= totalTime`);
    if (iconTypes > p) throw new Error(`L${index}: iconTypes(${iconTypes}) > p(${p})`);
    return { ...e, totalTime, starTime };
  } else {
    const s = calcScoring5(p, boss);
    const starScore = s.starScore.map((x) => Math.round(x));
    if (!(starScore[0] < starScore[1] && starScore[1] < starScore[2])) throw new Error(`L${index}: starScore 未严格递增`);
    if (iconTypes > p) throw new Error(`L${index}: iconTypes(${iconTypes}) > p(${p})`);
    return { ...e, starScore, targetScore: Math.round(s.targetScore) };
  }
}

const outDir = process.argv[2];
const files = [];
const allIndexes = [];

{
  const list = [];
  CH1.forEach(([t, b], i) => {
    const idx = i;
    allIndexes.push(idx);
    list.push(buildEntry(0, idx, t, b, 2));
  });
  files.push({ file: "chapter_0.json", list });
}
{
  const list = [];
  CH2.forEach(([t, b], i) => {
    const idx = 30 + i;
    allIndexes.push(idx);
    list.push(buildEntry(1, idx, t, b, 1));
  });
  files.push({ file: "chapter_1.json", list });
}
{
  const list = [];
  let base = 70;
  CH3_GROUP.forEach((g) => {
    g.levels.forEach(([t, b], i) => {
      const idx = base + i;
      allIndexes.push(idx);
      list.push(buildEntry(2, idx, t, b, g.type));
    });
    base += 10;
  });
  files.push({ file: "chapter_2.json", list });
}
{
  const list = [];
  let base = 120;
  CH4_GROUP.forEach((g) => {
    g.levels.forEach(([t, b], i) => {
      const idx = base + i;
      allIndexes.push(idx);
      list.push(buildEntry4(idx, t, b, g.type));
    });
    base += 10;
  });
  files.push({ file: "chapter_3.json", list });
}
{
  const list = [];
  let base = 180;
  CH5_GROUP.forEach((g) => {
    g.levels.forEach(([t, b], i) => {
      const idx = base + i;
      allIndexes.push(idx);
      list.push(buildEntry5(idx, t, b, g.type));
    });
    base += 10;
  });
  files.push({ file: "chapter_4.json", list });
}
{
  const list = [];
  let base = 240;
  CH5_GROUP.forEach((g, gi) => {
    g.levels.forEach(([t, b], i) => {
      const idx = base + i;
      allIndexes.push(idx);
      const obstacleCount = b === 1 ? CH6_OBSTACLE_BOSS[gi] : CH6_OBSTACLE_NORMAL[gi];
      const pFloor = b === 1 ? CH6_P_FLOOR[gi].boss : CH6_P_FLOOR[gi].normal;
      list.push(buildEntry6(idx, t, b, g.type, obstacleCount, pFloor));
    });
    base += 10;
  });
  files.push({ file: "chapter_5.json", list });
}

// index 全局连续性校验
for (let i = 0; i < allIndexes.length; i++) {
  if (allIndexes[i] !== i) throw new Error(`index 不连续: ${allIndexes[i]} != ${i}`);
}
if (allIndexes.length !== 300) throw new Error(`关卡总数 ${allIndexes.length} != 300`);

// 障碍物校验（章6）
{
  const ch6 = files.find((f) => f.file === "chapter_5.json");
  for (let gi = 0; gi < CH5_GROUP.length; gi++) {
    for (let i = 0; i < 10; i++) {
      const e = ch6.list[gi * 10 + i];
      const expect = e.boss === 1 ? CH6_OBSTACLE_BOSS[gi] : CH6_OBSTACLE_NORMAL[gi];
      const actual = countObstacles(e.map);
      if (actual !== expect) throw new Error(`L${e.index}: 障碍物数量 ${actual} != 计划 ${expect}`);

      // 实际对子数下限：按组分档校验（障碍物占用方块位会让 p 低于模板基准值）
      const actualP = countOnes(e.map) / 2;
      const floor = e.boss === 1 ? CH6_P_FLOOR[gi].boss : CH6_P_FLOOR[gi].normal;
      if (actualP < floor) throw new Error(`L${e.index}: 实际对子数 ${actualP} < ${floor}`);
    }
  }
  console.log(
    `章6 障碍物：普通关 ${CH6_OBSTACLE_NORMAL.join("/")} 个、Boss 关 ${CH6_OBSTACLE_BOSS.join("/")} 个（按组）；` +
      `棋盘去重后重复兜底 ${layoutFallbackCount} 关`
  );
}

// 挤压玩法校验：普通关必无 shiftDir，Boss 关必有 shiftDir(2-5) + shiftEdge=2（各章统一规则）
for (const f of files) {
  for (const e of f.list) {
    if (e.boss === 0) {
      if (e.shiftDir !== undefined || e.shiftEdge !== undefined) throw new Error(`L${e.index}: 普通关不应有 shiftDir/shiftEdge`);
    } else {
      if (e.shiftDir === undefined || e.shiftEdge === undefined) throw new Error(`L${e.index}: Boss 关缺少 shiftDir/shiftEdge`);
      if (!(e.shiftDir >= 2 && e.shiftDir <= 5)) throw new Error(`L${e.index}: shiftDir ${e.shiftDir} 越界`);
      if (e.shiftEdge !== 2) throw new Error(`L${e.index}: shiftEdge ${e.shiftEdge} != 2`);
    }
  }
}

// 写入（与仓库现有配置保持一致：压缩为单行 JSON，无多余空白）
for (const f of files) {
  const filePath = path.join(outDir, f.file);
  fs.writeFileSync(filePath, JSON.stringify(f.list), "utf8");
  console.log(`写入 ${f.file}: ${f.list.length} 关`);
}

// 摘要
for (const f of files) {
  const list = f.list;
  console.log(`\n=== ${f.file} ===`);
  for (const e of list) {
    const extra = e.type === 1 ? `totalTime=${e.totalTime} starTime=[${e.starTime}]` : `starScore=[${e.starScore}] target=${e.targetScore}`;
    const shift = e.shiftDir !== undefined ? ` shiftDir=${e.shiftDir} edge=${e.shiftEdge}` : "";
    const obstacles = countObstacles(e.map);
    const obs = obstacles > 0 ? ` 障碍=${obstacles}` : "";
    console.log(`L${String(e.index).padStart(3)} ${e.boss ? "BOSS " : "    "} type=${e.type} p=${countOnes(e.map) / 2} iconTypes=${e.iconTypes} ${extra}${shift}${obs}`);
  }
}
