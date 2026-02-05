# AGENTS.md - 连连看编码规范

## 项目概述

使用 TypeScript 和 FairyGUI 开发的 Cocos Creator 3.8.8 游戏项目，包含大厅和多种游戏模式的中国连连看游戏。

## 构建/开发命令

本项目使用 Cocos Creator IDE 进行构建，未定义 npm 构建脚本。

- **打开项目**：使用 Cocos Creator Dashboard 打开此文件夹
- **构建**：使用 Cocos Creator IDE → 项目 → 构建
- **预览**：使用 Cocos Creator IDE → 预览按钮或在浏览器/模拟器中运行
- **调试**：使用 Chrome DevTools 或 VS Code 调试器（参见 `.vscode/launch.json`）

### 测试

- 未配置自动化测试运行器
- 通过 Cocos Creator 预览模式进行手动测试
- 在目标平台上测试（Web、微信小程序等）

## 语言规范

### 所有交互使用中文

所有代码交互必须使用中文：
- **回复用户使用中文**：所有回复必须用中文编写
- **注释使用中文**：所有代码注释、文档和 JSDoc 使用中文
- **变量命名**：优先使用中文语义命名
- **UI 文本**：所有界面文本使用中文
- **日志输出**：调试日志和错误信息使用中文

```typescript
// 正确
/**
 * @description 获取用户数据
 */
getUserData(): 用户数据 {
    console.log("正在获取用户数据...");
    return this._用户数据;
}

// 错误
/**
 * @description Get user data
 */
getUserData(): UserData {
    console.log("Getting user data...");
    return this._userData;
}
```

## 代码风格指南

### TypeScript 配置

- 目标：ES2015
- 模块：ES2015
- 严格模式：false（在 `tsconfig.json` 中配置）
- 启用实验性装饰器
- 路径映射：`db://assets/*` 映射到项目资源

### 格式化（Prettier）

- 分号：**必需**
- 尾随逗号：ES5 兼容
- 引号：**双引号**（`"`）
- 打印宽度：140 个字符
- 制表符宽度：4 个空格
- 使用制表符：false（仅空格）
- 括号间距：true
- 箭头函数括号：始终
- 换行符：自动
- 引号属性：保留

### 命名规范

- **类**：PascalCase（例如：`DataCenter`、`SoundManager`）
- **接口**：UPPER_SNAKE_CASE（例如：`LOGIN_INFO`、`USER_DATA`）
- **枚举**：UPPER_SNAKE_CASE（例如：`ENUM_USER_STATUS`）
- **常量**：UPPER_SNAKE_CASE 或本地使用 camelCase
- **私有属性**：`_` 前缀（例如：`_instance`、`_userData`）
- **方法**：camelCase（例如：`getInstance`、`playSoundEffect`）
- **文件名**：与类名匹配的 PascalCase（例如：`DataCenter.ts`）

### 导入/导出模式

```typescript
// 首先导入 Cocos Creator
import { Director, Scene, sys } from "cc";

// 第三方导入
import * as fgui from "fairygui-cc";

// 项目导入（使用相对路径）
import { DataCenter } from "../../../datacenter/DataCenter";
import { SoundManager } from "../../SoundManager";

// 导出类
export class MyClass { }
export interface MY_INTERFACE { }
export enum MY_ENUM { }
```

### 单例模式

所有管理器类使用单例模式：

```typescript
export class ManagerClass {
    private static _instance: ManagerClass;
    
    public static get instance(): ManagerClass {
        if (!this._instance) {
            this._instance = new ManagerClass();
        }
        return this._instance;
    }
    
    private constructor() { }
}
```

### 文档标准

所有公共 API 使用 JSDoc：

```typescript
/**
 * @class 类名
 * @description 简要描述
 * @category 分类名称
 */

/**
 * @method 方法名
 * @description 功能描述
 * @param {类型} 参数名 - 描述
 * @returns {类型} 描述
 */

/**
 * @property {类型} 属性名 - 描述
 * @private
 */
```

### 错误处理

- 错误情况使用提前返回
- 使用 `console.log` 或 `cc` 中的 `log` 记录错误
- 访问属性前始终检查 null/undefined
- 使用可选链（`?.`）和空值合并（`??`）

```typescript
if (err) {
    log('错误信息', err);
    return;
}

// 或者
const value = maybeNull?.property ?? defaultValue;
```

### 代码组织

目录结构：
- `assets/scripts/datacenter/` - 全局数据管理（单例）
- `assets/scripts/frameworks/` - 核心框架（socket、声音、工具）
- `assets/scripts/games/gameXXXX/` - 游戏特定逻辑
- `assets/scripts/fgui/` - FairyGUI UI 组件
- `assets/scripts/view/` - 视图层组件
- `assets/scripts/scene/` - 场景管理
- `assets/types/` - TypeScript 类型定义

### 装饰器

可用的自定义装饰器：
- `@ViewClass({ curveScreenAdapt: boolean })` - 带屏幕适配的 UI 视图
- `@PackageLoad(['package1', 'package2'])` - 延迟加载 FairyGUI 包

### 事件系统

使用框架事件系统：

```typescript
import { AddEventListener, RemoveEventListener, DispatchEvent } from "../Framework";

// 监听
AddEventListener('事件名称', this.onEvent, this);

// 移除（在 onDestroy 中很重要）
RemoveEventListener('事件名称', this.onEvent);

// 分发
DispatchEvent('事件名称', arg1, arg2);
```

## 项目特定指南

1. **游戏 ID 约定**：使用数字 ID（10001、10002）表示游戏类型
2. **协议文件**：在 `assets/types/protocol/` 中自动生成
3. **FairyGUI 包**：存储在 `assets/fgui/` 中
4. **音频**：所有音频播放使用 `SoundManager.instance`
5. **数据持久化**：使用 `sys.localStorage` 存储本地数据
6. **场景切换**：使用框架中的 `ChangeScene()`
7. **Socket 通信**：使用 `LobbySocketManager` 或 `GameSocketManager`

## 常见陷阱

- 访问 UI 前始终检查 FairyGUI 包是否已加载
- 记得在组件 `onDestroy` 中清理事件监听器
- 使用节点组件中的 `scheduleOnce`/`schedule` 进行定时器
- 私人房间与匹配模式有不同的数据流
- 平台特定代码（微信小程序）应使用 `MiniGameUtils`
