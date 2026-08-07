# 大厅背景动效设计文档

日期：2026-08-07

## 背景

大厅背景组件 `assets/scripts/fgui/lobbyBg/`（FairyGUI 自动生成基类）已就绪，由 4 层结构组成：

- **CompBgCube**：最小方块，80×80，`ctrl_img` 控制器 index 0-21 对应 22 种图片
- **CompBgCubeLine**：14 个 CompBgCube 组成一行（横向 0~1040，间距 80px）
- **CompBgCubePage**：26 条 CompBgCubeLine 组成一页（纵向 -389~1611，间距 80px，页面高 1688）
- **CompLobbyBg**：顶层组件，已内嵌于 LobbyView.xml（n17 子节点，xy=0,0），LobbyView 已 `@PackageLoad(["lobbyBg"])`

目标：实现方块背景动效 — 26 条行自上而下匀速移动，移出屏幕底部后回卷到顶部并重新随机方块图案。

## 需求

1. 业务子类分别继承 UI 基类，逻辑放在 `scripts/view/lobbyBg/comp/`
2. CompBgCube：实现接口随机一个 index（0-21）
3. CompBgCubeLine：遍历 14 个 CompBgCube 调用随机接口
4. CompBgCubePage：实现动画 — 26 条 line 从上往下移动，最下面移出屏幕时回卷到最上面并调用 line 的随机接口
5. 移动速度 10px/s，可配置
6. 创建时先对所有 line 随机一次（首屏即为多彩效果）

## 方案

### 动画驱动：GObject.onUpdate() 每帧驱动（选定方案）

- CompBgCubePage 重写 `protected onUpdate()`（GObject 内置钩子，onStage 时每帧调用）
- 每帧 `line.y += 速度 × dt`，dt 取 `cc.director.getDeltaTime()`
- 回卷判断：`line.y >= WRAP_Y` 时 `line.y -= SPAN` 并调用 `line.randomLine()`
- 备选方案 GTween（26 个 tween 链）未采用：对象多、需 onDestroy 清理、回卷逻辑分散

### 回卷数学

- 布局：行初始 y 从 -389 到 1611，间距 80px，共 26 行
- `TOP_Y = min(初始 y) = -389`
- `SPAN = 26 × 80 = 2080`
- `WRAP_Y = TOP_Y + SPAN = 1691`（此时行底边 = 1691+40 = 1731 > 1688 已完全出屏）
- 回卷 `y -= 2080` 后精确落回原网格位置（-389 + k×80），保持 80px 对齐无缝循环

### 注册链

- 每个业务子类文件末尾 `fgui.UIObjectFactory.setExtension(Xxx.URL, Xxx)` 覆盖基类注册（现有模式，如 CompGm）
- `CompLobbyBg.ts` import `CompBgCubePage` → 链式 import `CompBgCubeLine` → `CompBgCube`，保证所有注册先于 UI 创建
- `view/lobby/LobbyView.ts` 增加副作用导入 `import "../lobbyBg/CompLobbyBg"`，注册先于 `LobbyView.showView()` 执行
- LobbyView.xml 内嵌的 CompLobbyBg 子节点创建时自动实例化为业务类并启动动画

### 类型断言

基类属性类型为基类（如 `UI_COMP_CUBE_PAGE: FGUICompBgCubePage`），实际实例由工厂注册为业务类，调用业务接口（`randomLine`、`startAnimation`）时需类型断言。

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

## 接口约定

| 类 | 接口 | 说明 |
|---|---|---|
| CompBgCube | `randomIndex(): void` | `ctrl_img.selectedIndex = Math.floor(Math.random() * 22)` |
| CompBgCubeLine | `randomLine(): void` | 遍历 14 个方块调用 `randomIndex()` |
| CompBgCubePage | `startAnimation()` / `stopAnimation()` | 启停动画；`static ANIM_SPEED = 10`（px/s 可配置） |
| CompLobbyBg | `onConstruct()` | `super` 后调用 page `startAnimation()` |

## 约定遵守

- 中文注释、JSDoc（`@file/@class/@method/@description` 等）
- 私有属性 `_` 前缀；4 空格缩进、双引号、分号、140 宽度
- `@ViewClass()` + `@PackageLoad(["lobbyBg"])` 装饰器
- 日志使用 Logger（本功能无需日志）

## 验证

- 项目无 npm 测试/构建脚本，验证 = Cocos Creator 编辑器编译无错误 + 大厅预览人工检查
- 检查点：首屏随机、10px/s 下移、回顶随机、网格对齐无错位、场景切换后动画恢复、速度可配置
