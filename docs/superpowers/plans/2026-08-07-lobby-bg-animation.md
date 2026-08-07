# 大厅背景动效实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为大厅背景实现方块雨动效：26 条方块行以 10px/s 匀速下移，移出屏幕底部后回卷到顶部并重新随机方块图案

**Architecture:** 四个业务子类分别继承 FGUI 基类并通过 `UIObjectFactory.setExtension` 覆盖注册；CompBgCubePage 重写 `GObject.onUpdate()` 每帧驱动行下移，回卷阈值与行间距对齐（80px×26=2080px 无缝循环）

**Tech Stack:** Cocos Creator 3.8.8、FairyGUI（fairygui-cc）、TypeScript

**验证方式:** 项目无 npm 测试/构建脚本，验证 = Cocos Creator 编辑器编译无错误 + 大厅预览人工检查

---

## 文件结构

```
assets/scripts/view/lobbyBg/          # 新建目录
├── CompLobbyBg.ts                    # 入口：启动页面动画
└── comp/
    ├── CompBgCube.ts                 # 方块：randomIndex()
    ├── CompBgCubeLine.ts             # 行：randomLine() 遍历 14 个方块
    └── CompBgCubePage.ts             # 页：下移动画 + 回卷随机
assets/scripts/view/lobby/LobbyView.ts  # 修改：副作用导入注册
```

布局参数（来自 FGUI XML）：Cube 80×80，Line 14 个方块横向 0~1040（间距80），Page 26 条 Line 纵向 -389~1611（间距80），Page 高 1688。回卷公式：`TOP_Y = min(y) = -389`，`SPAN = 26×80 = 2080`，`WRAP_Y = TOP_Y + SPAN = 1691`（此时行底边 1731 > 1688 已完全出屏，且 `y -= 2080` 精确落回原网格位置，不会破坏 80px 对齐）。

---

### Task 1: 创建 CompBgCube

**Files:**
- Create: `assets/scripts/view/lobbyBg/comp/CompBgCube.ts`

- [ ] **Step 1: 创建文件**

```typescript
/**
 * @file CompBgCube.ts
 * @description 大厅背景单个方块组件：提供随机图片索引接口
 * @category 大厅背景
 */

import FGUICompBgCube from "@fgui/lobbyBg/FGUICompBgCube";
import * as fgui from "fairygui-cc";
import { PackageLoad, ViewClass } from "@frameworks/Framework";

/**
 * @class CompBgCube
 * @description 大厅背景单个方块，ctrl_img 控制器 index 0-21 对应 22 种图片
 * @category 大厅背景
 */
@PackageLoad(["lobbyBg"])
@ViewClass()
export class CompBgCube extends FGUICompBgCube {
    /**
     * @method randomIndex
     * @description 随机一个图片 index（0-21）
     */
    randomIndex(): void {
        this.ctrl_img.selectedIndex = Math.floor(Math.random() * 22);
    }
}
fgui.UIObjectFactory.setExtension(CompBgCube.URL, CompBgCube);
```

- [ ] **Step 2: 提交**

```bash
git add assets/scripts/view/lobbyBg/comp/CompBgCube.ts
git commit -m "feat: 新增大厅背景方块组件，实现随机图片索引接口"
```

---

### Task 2: 创建 CompBgCubeLine

**Files:**
- Create: `assets/scripts/view/lobbyBg/comp/CompBgCubeLine.ts`

- [ ] **Step 1: 创建文件**

```typescript
/**
 * @file CompBgCubeLine.ts
 * @description 大厅背景方块行组件：由 14 个 CompBgCube 组成，提供整行随机接口
 * @category 大厅背景
 */

import FGUICompBgCubeLine from "@fgui/lobbyBg/FGUICompBgCubeLine";
import * as fgui from "fairygui-cc";
import { PackageLoad, ViewClass } from "@frameworks/Framework";
import { CompBgCube } from "./CompBgCube";

/**
 * @class CompBgCubeLine
 * @description 大厅背景方块行，包含 14 个方块（工厂注册后实际实例为 CompBgCube）
 * @category 大厅背景
 */
@PackageLoad(["lobbyBg"])
@ViewClass()
export class CompBgCubeLine extends FGUICompBgCubeLine {
    /** 本行的 14 个方块引用 @private */
    private _cubes: CompBgCube[] = [];

    onConstruct() {
        super.onConstruct();
        this._cubes = [
            this.UI_COMP_CUBE_0,
            this.UI_COMP_CUBE_1,
            this.UI_COMP_CUBE_2,
            this.UI_COMP_CUBE_3,
            this.UI_COMP_CUBE_4,
            this.UI_COMP_CUBE_5,
            this.UI_COMP_CUBE_6,
            this.UI_COMP_CUBE_7,
            this.UI_COMP_CUBE_8,
            this.UI_COMP_CUBE_9,
            this.UI_COMP_CUBE_10,
            this.UI_COMP_CUBE_11,
            this.UI_COMP_CUBE_12,
            this.UI_COMP_CUBE_13,
        ] as CompBgCube[];
    }

    /**
     * @method randomLine
     * @description 随机整行方块：遍历所有方块调用随机接口
     */
    randomLine(): void {
        for (const cube of this._cubes) {
            cube.randomIndex();
        }
    }
}
fgui.UIObjectFactory.setExtension(CompBgCubeLine.URL, CompBgCubeLine);
```

- [ ] **Step 2: 提交**

```bash
git add assets/scripts/view/lobbyBg/comp/CompBgCubeLine.ts
git commit -m "feat: 新增大厅背景方块行组件，实现整行随机接口"
```

---

### Task 3: 创建 CompBgCubePage（核心动画）

**Files:**
- Create: `assets/scripts/view/lobbyBg/comp/CompBgCubePage.ts`

- [ ] **Step 1: 创建文件**

```typescript
/**
 * @file CompBgCubePage.ts
 * @description 大厅背景方块页动画：26 条方块行自上而下循环移动，回卷到顶部时重新随机
 * @category 大厅背景
 */

import { director } from "cc";
import * as fgui from "fairygui-cc";
import FGUICompBgCubePage from "@fgui/lobbyBg/FGUICompBgCubePage";
import { PackageLoad, ViewClass } from "@frameworks/Framework";
import { CompBgCubeLine } from "./CompBgCubeLine";

/**
 * @class CompBgCubePage
 * @description 大厅背景动画主体，驱动 26 条方块行匀速下移并无缝循环回卷
 * @category 大厅背景
 */
@PackageLoad(["lobbyBg"])
@ViewClass()
export class CompBgCubePage extends FGUICompBgCubePage {
    /** 行间距（与编辑器布局一致，单位 px） @private */
    private static readonly LINE_PITCH: number = 80;

    /** 移动速度（px/s），可动态修改以配置动效快慢 */
    public static ANIM_SPEED: number = 10;

    /** 全部方块行引用 @private */
    private _lines: CompBgCubeLine[] = [];

    /** 顶部行的初始 y（编辑器布局的最小值） @private */
    private _topY: number = 0;

    /** 回卷阈值：行移动到该位置视为移出屏幕底部 @private */
    private _wrapY: number = 0;

    /** 一个循环周期的总跨度（行数 × 行间距） @private */
    private _span: number = 0;

    /** 动画运行标记 @private */
    private _running: boolean = false;

    onConstruct() {
        super.onConstruct();
        this._lines = [
            this.UI_COMP_CUBE_LINE_0,
            this.UI_COMP_CUBE_LINE_1,
            this.UI_COMP_CUBE_LINE_2,
            this.UI_COMP_CUBE_LINE_3,
            this.UI_COMP_CUBE_LINE_4,
            this.UI_COMP_CUBE_LINE_5,
            this.UI_COMP_CUBE_LINE_6,
            this.UI_COMP_CUBE_LINE_7,
            this.UI_COMP_CUBE_LINE_8,
            this.UI_COMP_CUBE_LINE_9,
            this.UI_COMP_CUBE_LINE_10,
            this.UI_COMP_CUBE_LINE_11,
            this.UI_COMP_CUBE_LINE_12,
            this.UI_COMP_CUBE_LINE_13,
            this.UI_COMP_CUBE_LINE_14,
            this.UI_COMP_CUBE_LINE_15,
            this.UI_COMP_CUBE_LINE_16,
            this.UI_COMP_CUBE_LINE_17,
            this.UI_COMP_CUBE_LINE_18,
            this.UI_COMP_CUBE_LINE_19,
            this.UI_COMP_CUBE_LINE_20,
            this.UI_COMP_CUBE_LINE_21,
            this.UI_COMP_CUBE_LINE_22,
            this.UI_COMP_CUBE_LINE_23,
            this.UI_COMP_CUBE_LINE_24,
            this.UI_COMP_CUBE_LINE_25,
        ] as CompBgCubeLine[];
        this._topY = Math.min(...this._lines.map((line) => line.y));
        this._span = this._lines.length * CompBgCubePage.LINE_PITCH;
        this._wrapY = this._topY + this._span;
        this.randomAll();
    }

    /**
     * @method startAnimation
     * @description 启动下移动画
     */
    startAnimation(): void {
        this._running = true;
    }

    /**
     * @method stopAnimation
     * @description 停止下移动画
     */
    stopAnimation(): void {
        this._running = false;
    }

    /**
     * @method randomAll
     * @description 随机所有方块行（初始画面与手动触发用）
     * @private
     */
    private randomAll(): void {
        for (const line of this._lines) {
            line.randomLine();
        }
    }

    /**
     * @method onUpdate
     * @description 每帧驱动方块行下移，移出屏幕底部后回卷到顶部并重新随机
     * @private
     */
    protected onUpdate(): void {
        super.onUpdate();
        if (!this._running) {
            return;
        }
        const dt = director.getDeltaTime();
        for (const line of this._lines) {
            line.y += CompBgCubePage.ANIM_SPEED * dt;
            if (line.y >= this._wrapY) {
                line.y -= this._span;
                line.randomLine();
            }
        }
    }
}
fgui.UIObjectFactory.setExtension(CompBgCubePage.URL, CompBgCubePage);
```

- [ ] **Step 2: 提交**

```bash
git add assets/scripts/view/lobbyBg/comp/CompBgCubePage.ts
git commit -m "feat: 新增大厅背景方块页动画，实现下移循环回卷随机"
```

---

### Task 4: 创建 CompLobbyBg 入口

**Files:**
- Create: `assets/scripts/view/lobbyBg/CompLobbyBg.ts`

- [ ] **Step 1: 创建文件**

```typescript
/**
 * @file CompLobbyBg.ts
 * @description 大厅背景入口组件：负责启动方块页动画
 * @category 大厅背景
 */

import * as fgui from "fairygui-cc";
import FGUICompLobbyBg from "@fgui/lobbyBg/FGUICompLobbyBg";
import { PackageLoad, ViewClass } from "@frameworks/Framework";
import { CompBgCubePage } from "./comp/CompBgCubePage";

/**
 * @class CompLobbyBg
 * @description 大厅背景入口，控制背景动画的启停
 * @category 大厅背景
 */
@PackageLoad(["lobbyBg"])
@ViewClass()
export class CompLobbyBg extends FGUICompLobbyBg {
    onConstruct() {
        super.onConstruct();
        (this.UI_COMP_CUBE_PAGE as CompBgCubePage).startAnimation();
    }
}
fgui.UIObjectFactory.setExtension(CompLobbyBg.URL, CompLobbyBg);
```

> 说明：`CompLobbyBg` import `CompBgCubePage` → 链式触发 `CompBgCubeLine` → `CompBgCube` 的模块副作用注册，保证所有业务子类在 UI 创建前完成 `setExtension`。基类 `UI_COMP_CUBE_PAGE` 类型标注为 `FGUICompBgCubePage`，实际实例为业务类，故需类型断言。

- [ ] **Step 2: 提交**

```bash
git add assets/scripts/view/lobbyBg/CompLobbyBg.ts
git commit -m "feat: 新增大厅背景入口组件，启动背景动画"
```

---

### Task 5: LobbyView 接入注册

**Files:**
- Modify: `assets/scripts/view/lobby/LobbyView.ts`（在 `import * as fgui` 之后新增一行）

- [ ] **Step 1: 增加副作用导入**

```typescript
import FGUILobbyView from "@fgui/lobby/FGUILobbyView";
import * as fgui from "fairygui-cc";
import { PackageLoad, ViewClass } from "@frameworks/Framework";
import "../lobbyBg/CompLobbyBg";
```

> LobbyView.xml 已内嵌 CompLobbyBg（n17 子节点，xy=0,0），且 LobbyView 已 `@PackageLoad(["lobbyBg"])`。导入 CompLobbyBg 使业务注册先于 `LobbyView.showView()` 执行，树创建时自动实例化业务子类并启动动画。

- [ ] **Step 2: 提交**

```bash
git add assets/scripts/view/lobby/LobbyView.ts
git commit -m "feat: 大厅视图接入背景动效组件"
```

---

### Task 6: 验证（手动，需 Cocos Creator）

- [ ] **Step 1: 编辑器编译检查**
  在 Cocos Creator 中打开项目，等待编辑器编译完成，确认控制台无 TS 报错、无 `setExtension` 冲突警告

- [ ] **Step 2: 大厅预览检查清单**
  点击预览进入大厅，逐项确认：
  1. 背景出现 26 行多彩方块（首屏即为随机图案，非默认色）
  2. 方块行以约 10px/s 匀速向下移动（一个完整循环约 208 秒）
  3. 行移出屏幕底部后从顶部重新出现，且图案重新随机
  4. 移动过程网格对齐无缝隙错位（80px 间距保持）
  5. 切换到游戏场景再返回大厅，动画正常恢复

- [ ] **Step 3: 速度可配置性验证**
  将 `CompBgCubePage.ANIM_SPEED` 改为 40 后重新预览，确认速度变化生效（验证后改回 10 并提交）

```bash
git add assets/scripts/view/lobbyBg/comp/CompBgCubePage.ts
git commit -m "feat: 调整背景动画速度配置"
```
