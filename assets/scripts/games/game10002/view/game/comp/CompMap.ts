import FGUICompMap from "@fgui/game10002/FGUICompMap";
import * as fgui from "fairygui-cc";
import { PathFinder } from "../../../logic/PathFinder";
import { MapManager } from "../../../logic/MapManager";
import { Point, LineSegment, SHIFT_DIR, ShiftMoveInfo, computeShiftMoves } from "../../../logic/TileMapData";
import { CompCube, MoveTarget } from "./CompCube";
import { ViewClass } from "@frameworks/Framework";
import { GameSocketManager } from "@frameworks/GameSocketManager";
import { SprotoClickTiles } from "../../../../../../types/protocol/game10002/c2s";
import { TipsView } from "@view/common/TipsView";
import { GameData } from "../../../data/GameData";
import { ENUM_GAME_STEP } from "../../../data/InterfaceGameConfig";
import { Logger, SpinePlay } from "@frameworks/utils/Utils";
import { SoundManager } from "@frameworks/SoundManager";

/**
 * @interface ShiftMoveTask
 * @description 方块移动任务（含方块引用），由数据层移动计算产生，供动画层直接播放
 * @property {ShiftMoveInfo} move - 移动路径信息
 * @property {CompCube} cube - 对应方块对象
 */
interface ShiftMoveTask {
    move: ShiftMoveInfo;
    cube: CompCube;
}

/**
 * @class CompMap
 * @description 连连看地图组件，管理所有方块
 */
@ViewClass()
export class CompMap extends FGUICompMap {
    /**
     * @property {CompCube[][]} _cubeMap
     * @description 存储所有方块的二维数组（从节点移除的方块对应项为 null）
     * @private
     */
    private _cubeMap: CompCube[][] = [];

    /**
     * @property {CompCube[]} _allCubes
     * @description 所有方块引用表（无论是否挂在节点上），从节点移除的方块保留在此，供下一局复用
     * @private
     */
    private _allCubes: CompCube[] = [];

    /**
     * @property {Array<Array<{x: number, y: number, cx: number, cy: number}>>} _cellPositions
     * @description 每个格子（行列）对应的初始像素坐标表，x/y 为格子左上角（移动动画目标坐标），cx/cy 为格子中心（连线绘制坐标），不随方块移动改变
     * @private
     */
    private _cellPositions: Array<Array<{ x: number; y: number; cx: number; cy: number }>> = [];

    /**
     * @property {number} _rows
     * @description 地图行数
     * @private
     */
    private _rows: number = 0;

    /**
     * @property {number} _cols
     * @description 地图列数
     * @private
     */
    private _cols: number = 0;

    /**
     * @property {number} _cellW
     * @description 格子横向间距（像素），由初始布局中相邻格子推导，用于动态创建方块时定位
     * @private
     */
    private _cellW: number = 0;

    /**
     * @property {number} _cellH
     * @description 格子纵向间距（像素），由初始布局中相邻格子推导，用于动态创建方块时定位
     * @private
     */
    private _cellH: number = 0;

    /**
     * @property {number} _originX
     * @description 格子 (0,0) 的初始像素 x 坐标，用于动态创建方块时定位
     * @private
     */
    private _originX: number = 0;

    /**
     * @property {number} _originY
     * @description 格子 (0,0) 的初始像素 y 坐标，用于动态创建方块时定位
     * @private
     */
    private _originY: number = 0;

    /**
     * @property {MapManager} _mapManager
     * @description 地图数据管理器
     * @private
     */
    private _mapManager: MapManager = new MapManager();

    /**
     * @property {PathFinder} _pathFinder
     * @description 路径查找器
     * @private
     */
    private _pathFinder: PathFinder = new PathFinder();

    /**
     * @property {Array<{cube: CompCube, row: number, col: number}>} _selectedCubes
     * @description 当前选中的方块数组（最多2个）
     * @private
     */
    private _selectedCubes: Array<{ cube: CompCube; row: number; col: number }> = [];

    /**
     * @property {FGUICompLine[]} _pathLines
     * @description 当前显示的路径线条数组
     * @private
     */
    private _pathLines: fgui.GComponent[] = [];

    /**
     * @property {number} _selectScale
     * @description 选中时的缩放比例
     * @private
     */
    private readonly _selectScale: number = 1.2;

    /**
     * @property {number} _selectZOrder
     * @description 选中时的ZOrder值
     * @private
     */
    private readonly _selectZOrder: number = 999;

    /**
     * @property {number} _removeDelay
     * @description 消除延迟时间（秒）
     * @private
     */
    private readonly _removeDelay: number = 0.3;

    /**
     * @property {number} _waitIdleInterval
     * @description 等待地图空闲的轮询间隔（秒），用于打乱延迟执行时检测动画是否全部播放完毕
     * @private
     */
    private readonly _waitIdleInterval: number = 0.05;

    /**
     * @property {number} _waitIdleMaxTime
     * @description 等待地图空闲的最大时长（秒），超过后强制回调，防止状态异常导致打乱永远不执行
     * @private
     */
    private readonly _waitIdleMaxTime: number = 3;

    /**
     * @property {boolean} _readonly
     * @description 是否只读模式（仅显示，不可交互）
     * @private
     */
    private _readonly: boolean = false;

    /**
     * @property {number} _enterRowInterval
     * @description 入场动画行间隔（秒）：整图显示时从上到下逐行播放入场动画，每行间隔该时长
     * @private
     */
    private readonly _enterRowInterval: number = 0.05;

    /**
     * @property {number} _enterAnimDuration
     * @description 入场过渡动画单次播放总时长（秒），与 FGUI enter 过渡一致（9 帧，24fps 约 0.375s），用于恢复 GameData.isMapEntering 状态
     * @private
     */
    private readonly _enterAnimDuration: number = 0.4;

    /**
     * @property {Map<CompCube, number>} _pendingMoveCounts
     * @description 各方块待完成的移动任务计数（并发消除时同一方块可能入队多个移动），用于维护 GameData.isMapMoving 状态；方块移动被取消（stopMove）时同步清理，防止计数泄漏
     * @private
     */
    private _pendingMoveCounts: Map<CompCube, number> = new Map();

    /**
     * @property {Set<CompCube>} _explodingCubes
     * @description 爆炸特效播放中的方块集合（消除后延迟移除节点前），用于维护 GameData.isMapExploding 状态；方块被提前移除时同步清理，防止状态卡死
     * @private
     */
    private _explodingCubes: Set<CompCube> = new Set();

    /**
     * @property {Map<string, number>} _allreadyRemoved
     * @description 已经消除的方块坐标对记录表（key 为规范化坐标 key，value 为重复记录次数），客户端本地消除后记录，方便服务器返回确认时逐条消费，客户端不再重复消除
     * @private
     */
    private _allreadyRemoved: Map<string, number> = new Map();

    /**
     * @method onConstruct
     * @description 组件构造完成时的初始化
     */
    onConstruct(): void {
        super.onConstruct();
        this._initCubeMap();
    }

    /**
     * @method setReadonly
     * @description 设置只读模式
     * @param {boolean} readonly - 是否只读
     */
    setReadonly(readonly: boolean): void {
        this._readonly = readonly;
    }

    /**
     * @method isReadonly
     * @description 获取是否只读模式
     * @returns {boolean} 是否只读
     */
    isReadonly(): boolean {
        return this._readonly;
    }

    /**
     * @method _initCubeMap
     * @description 初始化方块二维数组，将所有 CUTE_X_Y 引用存入数组，并记录每个格子的初始像素坐标
     * @private
     */
    private _initCubeMap(): void {
        // 清空现有数据
        this._cubeMap = [];
        this._cellPositions = [];
        this._allCubes = [];

        const nums = this.numChildren;
        Logger.log(`CompMap 初始化方块，子节点数量: ${nums}`);

        // 遍历所有子节点，提取 CUTE_X_Y 格式的方块
        for (let i = 0; i < this.numChildren; i++) {
            const child = this.getChildAt(i) as CompCube;
            if (child && child.name && child.name.startsWith("CUTE_")) {
                const parts = child.name.split("_");
                if (parts.length === 3) {
                    const row = parseInt(parts[1]);
                    const col = parseInt(parts[2]);

                    // 确保行数组存在
                    if (!this._cubeMap[row]) {
                        this._cubeMap[row] = [];
                    }
                    if (!this._cellPositions[row]) {
                        this._cellPositions[row] = [];
                    }

                    // 存储方块引用（同时记录到全量表中，供从节点移除后复用）
                    this._cubeMap[row][col] = child;
                    this._allCubes.push(child);

                    // 记录格子初始像素坐标（布局坐标，不随方块移动改变；x/y 为左上角，cx/cy 为格子中心）
                    this._cellPositions[row][col] = {
                        x: child.x,
                        y: child.y,
                        cx: child.x + child.width / 2,
                        cy: child.y + child.height / 2,
                    };

                    // 记录方块初始坐标，方便一局结束后重置
                    child.setInitPosition(row, col);

                    // 更新地图尺寸
                    if (row >= this._rows) this._rows = row + 1;
                    if (col >= this._cols) this._cols = col + 1;

                    // 绑定点击事件
                    this._bindCubeClickEvent(child, row, col);
                }
            }
        }

        // 根据相邻格子推导格子间距与原点坐标（动态创建方块时定位用）
        const p00 = this._cellPositions[0] && this._cellPositions[0][0];
        const p01 = this._cellPositions[0] && this._cellPositions[0][1];
        const p10 = this._cellPositions[1] && this._cellPositions[1][0];
        if (p00) {
            this._originX = p00.x;
            this._originY = p00.y;
        }
        if (p00 && p01) {
            this._cellW = p01.x - p00.x;
        }
        if (p00 && p10) {
            this._cellH = p10.y - p00.y;
        }
    }

    /**
     * @method _getCellPos
     * @description 获取指定格子的初始像素坐标（左上角）
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @returns {{x: number, y: number}} 格子像素坐标
     * @private
     */
    private _getCellPos(row: number, col: number): { x: number; y: number } {
        const pos = this._computeCellPos(row, col);
        return { x: pos.x, y: pos.y };
    }

    /**
     * @method _getCellCenter
     * @description 获取指定格子的中心像素坐标（连线绘制用，不依赖方块对象，方块移动后依然准确）
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @returns {{x: number, y: number}} 格子中心像素坐标
     * @private
     */
    private _getCellCenter(row: number, col: number): { x: number; y: number } {
        const pos = this._computeCellPos(row, col);
        return { x: pos.cx, y: pos.cy };
    }

    /**
     * @method _computeCellPos
     * @description 获取指定格子的初始像素坐标，未记录时按格子间距推导并回填（动态方块定位、连线绘制用）
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @returns {{x: number, y: number, cx: number, cy: number}} 格子初始像素坐标
     * @private
     */
    private _computeCellPos(row: number, col: number): { x: number; y: number; cx: number; cy: number } {
        if (this._cellPositions[row] && this._cellPositions[row][col]) {
            return this._cellPositions[row][col];
        }

        // 按格子间距与原点推导（间距未推导出时回退为方块宽高）
        const cellW = this._cellW || (this._allCubes[0] ? this._allCubes[0].width : 0);
        const cellH = this._cellH || (this._allCubes[0] ? this._allCubes[0].height : 0);
        const x = this._originX + col * cellW;
        const y = this._originY + row * cellH;

        const pos = { x, y, cx: x + cellW / 2, cy: y + cellH / 2 };
        if (!this._cellPositions[row]) {
            this._cellPositions[row] = [];
        }
        this._cellPositions[row][col] = pos;
        return pos;
    }

    /**
     * @method _bindCubeClickEvent
     * @description 绑定方块的点击事件
     * @param {CompCube} cube - 方块对象
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @private
     */
    private _bindCubeClickEvent(cube: CompCube, row: number, col: number): void {
        cube.onClick(() => {
            this._onCubeClick(cube, row, col);
        }, this);
    }

    /**
     * @method _unbindCubeClickEvent
     * @description 移除方块的点击事件
     * @param {CompCube} cube - 方块对象
     * @private
     */
    private _unbindCubeClickEvent(cube: CompCube): void {
        cube.clearClick();
    }

    /**
     * @method _nullCubeEntry
     * @description 将指定格子的 _cubeMap 引用置空（仅当该格当前引用为此方块时，避免误清其他方块）
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @param {CompCube} cube - 期望的方块对象
     * @private
     */
    private _nullCubeEntry(row: number, col: number, cube: CompCube): void {
        if (this._cubeMap[row] && this._cubeMap[row][col] === cube) {
            this._cubeMap[row][col] = null;
        }
    }

    /**
     * @method _removeCubeFromNode
     * @description 将方块从节点移除（不销毁，保留引用复用），并清理点击、动画、选中态与资源
     * @param {CompCube} cube - 方块对象
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @private
     */
    private _removeCubeFromNode(cube: CompCube, row: number, col: number): void {
        this._unbindCubeClickEvent(cube);
        cube.stopMove();
        cube.ctrl_selected.selectedIndex = 0;
        cube.UI_LOADER_ICOM.url = "";
        cube.UI_SP_ANI.visible = false;
        if (cube.parent) {
            cube.removeFromParent();
        }
        // 仅当该格当前引用为此方块时置空，避免误清其他方块
        this._nullCubeEntry(row, col, cube);

        // 方块移动队列被取消（stopMove 丢弃完成回调）时清理计数，防止 isMapMoving 状态卡死
        if (this._pendingMoveCounts.delete(cube)) {
            this._updateMapMoving();
        }

        // 方块爆炸特效被提前中断（移除节点）时清理记录，防止 isMapExploding 状态卡死
        if (this._explodingCubes.delete(cube)) {
            this._updateExploding();
        }
    }

    /**
     * @method _applyRemoveWithShift
     * @description 立即应用一次消除的数据更新：更新地图数据、移除方块坐标引用、并计算出需移动的方块（不播动画）
     * @param {Point} p1 - 第一个方块坐标
     * @param {Point} p2 - 第二个方块坐标
     * @param {CompCube} cube1 - 第一个方块对象
     * @param {CompCube} cube2 - 第二个方块对象
     * @returns {ShiftMoveTask[]} 需移动的方块任务数组（数据层已完成移动，动画层待播放）
     * @private
     */
    private _applyRemoveWithShift(p1: Point, p2: Point, cube1: CompCube, cube2: CompCube): ShiftMoveTask[] {
        // 更新地图数据
        this._mapManager.removeTiles(p1, p2);
        this._pathFinder.setMap(this._mapManager.getMap());

        // 更新方块坐标引用（方块暂留节点上播放消除特效，稍后移除；先置空再移位，避免移位冲入的方块被误清）
        this._unbindCubeClickEvent(cube1);
        this._unbindCubeClickEvent(cube2);
        this._nullCubeEntry(p1.row, p1.col, cube1);
        this._nullCubeEntry(p2.row, p2.col, cube2);

        // 计算消除后需要移动的方块（数据层移动已完成，_cubeMap 同步到数据空间）
        return this._applyShiftData();
    }

    /**
     * @method _finishRemoveVisuals
     * @description 消除视觉收尾：移除两个方块节点并清理连线（爆炸特效播放完毕后调用）
     * @param {CompCube} cube1 - 第一个方块对象
     * @param {CompCube} cube2 - 第二个方块对象
     * @param {Point} p1 - 第一个方块坐标
     * @param {Point} p2 - 第二个方块坐标
     * @private
     */
    private _finishRemoveVisuals(cube1: CompCube, cube2: CompCube, p1: Point, p2: Point): void {
        // 从节点移除方块（保留引用，供下一局复用；内部会取消方块残留的移动队列）
        this._removeCubeFromNode(cube1, p1.row, p1.col);
        this._removeCubeFromNode(cube2, p2.row, p2.col);

        // 清理路径线条
        this._clearPathLines();
    }

    /**
     * @method _reattachCube
     * @description 从全量表中查找已被移除且网格坐标相同的方块并重新挂回节点
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @returns {CompCube | null} 重新挂回的方块，未找到返回 null
     * @private
     */
    private _reattachCube(row: number, col: number): CompCube | null {
        for (const cube of this._allCubes) {
            if (!cube.parent && cube.getRow() === row && cube.getCol() === col) {
                this.addChild(cube);
                cube.visible = true;
                cube.UI_SP_ANI.visible = false;
                if (!this._cubeMap[row]) {
                    this._cubeMap[row] = [];
                }
                this._cubeMap[row][col] = cube;
                return cube;
            }
        }
        return null;
    }

    /**
     * @method _onCubeClick
     * @description 处理方块点击事件
     * @param {CompCube} cube - 被点击的方块
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @private
     */
    private _onCubeClick(cube: CompCube, row: number, col: number): void {
        // 只读模式下不处理点击事件
        if (this._readonly) {
            return;
        }

        // 待执行打乱期间不处理点击事件（地图即将被打乱，旧视觉图与服务器新地图不一致）
        if (GameData.instance.isMapShufflePending) {
            return;
        }

        // 非 playing 阶段不处理点击事件
        if (GameData.instance.gameStep !== ENUM_GAME_STEP.PLAYING) {
            return;
        }

        SoundManager.instance.playSoundEffect("game10002/cubeClick");

        // 检查是否点击了已选中的方块
        const selectedIndex = this._selectedCubes.findIndex((item) => item.row === row && item.col === col);

        if (selectedIndex >= 0) {
            // 取消选中
            this._deselectCube(selectedIndex);
            return;
        }

        // 检查是否已经选中了2个方块
        if (this._selectedCubes.length >= 2) {
            // 已经有2个选中了，先取消第一个
            this._deselectCube(0);
        }

        // 选中新方块
        this._selectCube(cube, row, col);

        // 如果选中了2个方块，检查是否可以消除
        if (this._selectedCubes.length === 2) {
            this._checkAndRemove();
        }
    }

    /**
     * @method _selectCube
     * @description 选中方块
     * @param {CompCube} cube - 要选的方块
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @private
     */
    private _selectCube(cube: CompCube, row: number, col: number): void {
        // 记录选中的方块
        this._selectedCubes.push({ cube, row, col });

        // 设置选中控制器
        cube.ctrl_selected.selectedIndex = 1;
        cube.act.play();
    }

    /**
     * @method _deselectCube
     * @description 取消选中方块
     * @param {number} index - 在选中数组中的索引
     * @private
     */
    private _deselectCube(index: number): void {
        if (index < 0 || index >= this._selectedCubes.length) {
            return;
        }

        const selected = this._selectedCubes[index];

        // 取消选中控制器
        selected.cube.ctrl_selected.selectedIndex = 0;

        // 从选中数组中移除
        this._selectedCubes.splice(index, 1);
    }

    /**
     * @method _clearSelection
     * @description 清空所有选中状态
     * @private
     */
    private _clearSelection(): void {
        // 恢复所有选中方块的状态
        for (const selected of this._selectedCubes) {
            selected.cube.ctrl_selected.selectedIndex = 0;
        }

        // 清空选中数组
        this._selectedCubes = [];
    }

    /**
     * @method _checkAndRemove
     * @description 检查两个选中方块是否可以消除，并执行消除
     * @private
     */
    private _checkAndRemove(): void {
        if (this._selectedCubes.length !== 2) {
            return;
        }

        const first = this._selectedCubes[0];
        const second = this._selectedCubes[1];

        const p1: Point = { row: first.row, col: first.col };
        const p2: Point = { row: second.row, col: second.col };

        // 使用PathFinder检查是否可以连接
        const result = this._pathFinder.canConnect(p1, p2);

        if (result.canConnect) {
            // 立即更新地图数据与方块坐标，并计算出消除后需要移动的方块
            const shiftMoves = this._applyRemoveWithShift(p1, p2, first.cube, second.cube);

            // 记录已经消除的方块坐标，方便服务器返回确认时消费，客户端不再重复消除
            this._addAllreadyRemoved(p1, p2);

            // 立即播放移动动画（并发消除时新任务追加到对应方块的动画队列，依次执行）
            this._playShiftMoves(shiftMoves);

            // 显示路径线条与消除特效
            this._showPathLines(result.lines);
            first.cube.UI_SP_ANI.visible = true;
            second.cube.UI_SP_ANI.visible = true;
            SpinePlay(first.cube.UI_SP_ANI, "action", false);
            SpinePlay(second.cube.UI_SP_ANI, "action", false);
            this._startExplosion(first.cube, second.cube);
            !this._readonly && SoundManager.instance.playSoundEffect("game10002/bomb");
            // 清空选中数组
            this._selectedCubes = [];

            Logger.log(`消除方块: (${first.row},${first.col}) 和 (${second.row},${second.col})`);

            // 发送消除请求给服务器
            GameSocketManager.instance.sendToServer(
                SprotoClickTiles,
                {
                    row1: first.row,
                    col1: first.col,
                    row2: second.row,
                    col2: second.col,
                },
                (response: any) => {
                    if (response && response.code === 0) {
                        // 服务器返回错误，显示提示
                        TipsView.showView({ content: response.msg || "消除失败" });
                    }
                    // 成功时不处理，客户端自己管理消除逻辑
                }
            );

            // 延迟0.2秒后移除方块节点、清理连线（爆炸特效播放完毕）
            this.scheduleOnce(() => {
                this._finishRemoveVisuals(first.cube, second.cube, p1, p2);
            }, this._removeDelay);
        } else {
            // 不能消除，取消第一个方块的选中，保留第二个
            this._deselectCube(0);
        }
    }

    /**
     * @method _showPathLines
     * @description 显示连接路径线条（使用静态格位中心坐标绘制，方块移动后仍准确，不依赖方块对象）
     * @param {LineSegment[]} lines - 路径线段数组
     * @private
     */
    private _showPathLines(lines: LineSegment[]): void {
        // 先清理之前的路径线条
        this._clearPathLines();

        const lineThickness = 15; // 线条粗细固定

        for (const line of lines) {
            // 获取起点和终点对应的格子中心坐标（格位固定，方块移动不影响）
            const startPos = this._getCellCenter(line.start.row, line.start.col);
            const destPos = this._getCellCenter(line.dest.row, line.dest.col);

            // 计算线段差值
            const deltaX = destPos.x - startPos.x;
            const deltaY = destPos.y - startPos.y;

            // 创建线条节点
            const lineNode = fgui.UIPackage.createObject("game10002", "CompLine") as fgui.GComponent;

            // 判断是水平线还是垂直线
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // 水平线：通过改变 width 实现
                lineNode.width = Math.abs(deltaX);
                lineNode.height = lineThickness;
                lineNode.x = Math.min(startPos.x, destPos.x);
                lineNode.y = startPos.y - lineThickness / 2; // 居中对齐
            } else {
                // 垂直线：通过改变 height 实现
                lineNode.width = lineThickness;
                lineNode.height = Math.abs(deltaY);
                lineNode.x = startPos.x - lineThickness / 2; // 居中对齐
                lineNode.y = Math.min(startPos.y, destPos.y);
            }

            // 设置较高的sortingOrder确保线条显示在方块上方
            lineNode.sortingOrder = 1000;

            // 添加到地图
            this.addChild(lineNode);
            this._pathLines.push(lineNode);
        }
    }

    /**
     * @method _clearPathLines
     * @description 清理所有路径线条
     * @private
     */
    private _clearPathLines(): void {
        for (const line of this._pathLines) {
            if (line && !line.isDisposed) {
                line.removeFromParent();
                line.dispose();
            }
        }
        this._pathLines = [];
    }

    /**
     * @method _shiftAndPlay
     * @description 执行数据层移动（MapManager + PathFinder）并立即播放方块移动动画（并发消除时新任务追加到对应方块的动画队列，依次执行）
     * @private
     */
    private _shiftAndPlay(): void {
        this._playShiftMoves(this._applyShiftData());
    }

    /**
     * @method _applyShiftData
     * @description 执行数据层移动（MapManager + PathFinder）并计算方块移动任务（仅更新数据，不播放动画），同时将 _cubeMap 同步到数据空间
     * @returns {ShiftMoveTask[]} 方块移动任务数组（含方块引用），空数组表示没有方块需要移动
     * @private
     */
    private _applyShiftData(): ShiftMoveTask[] {
        const shiftDir = GameData.instance.shiftDir;
        if (shiftDir <= SHIFT_DIR.RANDOM) {
            return [];
        }

        const shiftEdge = GameData.instance.shiftEdge;

        // 移动前的地图快照
        const oldMap = this._mapManager.getMap();

        // 数据层移动（与服务器保持一致）
        this._mapManager.shiftBlocks(shiftDir, shiftEdge);

        // 更新PathFinder地图数据
        this._pathFinder.setMap(this._mapManager.getMap());

        // 计算每个方块的移动路径
        const moves = computeShiftMoves(oldMap, this._mapManager.getMap(), shiftDir);

        // 将 _cubeMap 同步到数据空间（先收集引用再写入，避免移位链中 from/dest 互相覆盖）
        const shiftMoves: ShiftMoveTask[] = [];
        const refs = moves.map((move) => this._cubeMap[move.from.row] && this._cubeMap[move.from.row][move.from.col]);
        moves.forEach((move, i) => {
            const cube = refs[i];
            if (!cube) {
                return;
            }
            if (this._cubeMap[move.from.row] && this._cubeMap[move.from.row][move.from.col] === cube) {
                this._cubeMap[move.from.row][move.from.col] = null;
            }
            const last = move.path[move.path.length - 1];
            if (!this._cubeMap[last.row]) {
                this._cubeMap[last.row] = [];
            }
            this._cubeMap[last.row][last.col] = cube;
            shiftMoves.push({ move, cube });
        });

        return shiftMoves;
    }

    /**
     * @method _playShiftMoves
     * @description 播放方块移动任务（数据层已移动，_cubeMap 已在数据空间）：将移动追加到对应方块的动画队列，移动期间不可点击，队列全部完成后重绑点击
     * @param {ShiftMoveTask[]} shiftMoves - 方块移动任务数组
     * @private
     */
    private _playShiftMoves(shiftMoves: ShiftMoveTask[]): void {
        if (shiftMoves.length === 0) {
            return;
        }

        for (const task of shiftMoves) {
            const cube = task.cube;
            // 移动期间不可点击
            this._unbindCubeClickEvent(cube);

            // 统计待完成移动任务数（用于维护 GameData.isMapMoving 状态）
            this._pendingMoveCounts.set(cube, (this._pendingMoveCounts.get(cube) ?? 0) + 1);

            const last = task.move.path[task.move.path.length - 1];

            // 将逐格路径转换为像素坐标目标队列
            const targets: MoveTarget[] = task.move.path.map((p) => {
                const cellPos = this._getCellPos(p.row, p.col);
                return { x: cellPos.x, y: cellPos.y, row: p.row, col: p.col };
            });

            // 播放移动动画队列（并发消除时新任务追加到队列尾部，依次执行，动画不交错）
            cube.playMoveQueue(targets, () => {
                // 数据空间 _cubeMap 已在 _applyShiftData 中更新，这里只同步逻辑坐标
                cube.setGridPos(last.row, last.col);

                // 队列中还有任务（并发消除追加）时保持不可点击，全部完成后再重绑
                if (!cube.isMoving()) {
                    this._bindCubeClickEvent(cube, last.row, last.col);
                }

                // 待完成数递减，全部完成且无其他方块移动时恢复 isMapMoving
                const count = (this._pendingMoveCounts.get(cube) ?? 1) - 1;
                if (count <= 0) {
                    this._pendingMoveCounts.delete(cube);
                } else {
                    this._pendingMoveCounts.set(cube, count);
                }
                this._updateMapMoving();
            });
        }

        this._updateMapMoving();
    }

    /**
     * @method _updateMapMoving
     * @description 同步地图方块移动中状态到 GameData（供道具面板拦截使用道具）
     * @private
     */
    private _updateMapMoving(): void {
        GameData.instance.isMapMoving = this._pendingMoveCounts.size > 0;
    }

    /**
     * @method _startExplosion
     * @description 登记两个方块进入爆炸特效状态（消除时调用），维护 GameData.isMapExploding 状态
     * @param {CompCube} cube1 - 第一个方块
     * @param {CompCube} cube2 - 第二个方块
     * @private
     */
    private _startExplosion(cube1: CompCube, cube2: CompCube): void {
        this._explodingCubes.add(cube1);
        this._explodingCubes.add(cube2);
        this._updateExploding();
    }

    /**
     * @method _updateExploding
     * @description 同步爆炸特效播放中状态到 GameData（供打乱延迟执行等模块判断地图是否空闲）
     * @private
     */
    private _updateExploding(): void {
        GameData.instance.isMapExploding = this._explodingCubes.size > 0;
    }

    /**
     * @method isAnimating
     * @description 判断地图是否正在播放动画（爆炸/移动/入场任意一种），动画期间不执行打乱
     * @returns {boolean} 是否正在播放动画
     */
    isAnimating(): boolean {
        return GameData.instance.isMapMoving || GameData.instance.isMapEntering || GameData.instance.isMapExploding;
    }

    /**
     * @method waitUntilIdle
     * @description 等待地图动画全部播放完毕（爆炸/移动/入场）后执行回调，期间每帧轮询；超过最大等待时长后强制回调，防止状态异常导致回调永远不执行
     * @param {() => void} callback - 动画全部结束后执行的回调
     */
    waitUntilIdle(callback: () => void): void {
        this._waitUntilIdle(callback, 0);
    }

    /**
     * @method _waitUntilIdle
     * @description waitUntilIdle 的内部轮询实现
     * @param {() => void} callback - 动画全部结束后执行的回调
     * @param {number} elapsed - 已等待时长（秒）
     * @private
     */
    private _waitUntilIdle(callback: () => void, elapsed: number): void {
        if (!this.isAnimating() || elapsed >= this._waitIdleMaxTime) {
            callback();
            return;
        }
        this.scheduleOnce(() => {
            this._waitUntilIdle(callback, elapsed + this._waitIdleInterval);
        }, this._waitIdleInterval);
    }

    /**
     * @method removeTilesWithShift
     * @description 消除两个方块并执行数据移动与移动动画（用于其他玩家小地图等只读场景），不发送网络请求
     * @param {Point} p1 - 第一个方块坐标
     * @param {Point} p2 - 第二个方块坐标
     */
    removeTilesWithShift(p1: Point, p2: Point): void {
        this.hideCube(p1.row, p1.col);
        this.hideCube(p2.row, p2.col);
        this._mapManager.removeTiles(p1, p2);
        this._pathFinder.setMap(this._mapManager.getMap());
        this._shiftAndPlay();
    }

    /**
     * @method _resetAllCubes
     * @description 重置所有方块到初始位置（一局结束后调用），并重建 _cubeMap 与重新绑定点击事件
     * @private
     */
    private _resetAllCubes(): void {
        // 清空移动动画队列与状态（新一局开始，丢弃未播放的移动任务）
        this._pendingMoveCounts.clear();
        GameData.instance.isMapMoving = false;
        GameData.instance.isMapEntering = false;
        this._explodingCubes.clear();
        GameData.instance.isMapExploding = false;

        // 停止所有移动动画并重置位置、解除点击事件（已从节点移除的方块重新挂回）
        for (const cube of this._allCubes) {
            if (!cube.parent) {
                this.addChild(cube);
            }
            cube.stopMove();
            cube.resetPosition();
            this._unbindCubeClickEvent(cube);
        }

        // 重建 _cubeMap 并重新绑定点击事件（按名称初始坐标）
        this._initCubeMap();
    }

    /**
     * @method initMap
     * @description 根据地图数据初始化所有方块资源，同时设置logic数据（打乱地图/开局/换地图统一入口：第一时间设置地图数据，停止所有方块动画与移动计时器，并立即设置新位置）
     * @param {number[][]} map - 地图数据，number 代表方块资源 ID，0 表示空方块
     * @param {string} resPath - 资源前缀路径，格式如 "game10002"
     */
    initMap(map: number[][], resPath: string): void {
        if (!map || map.length === 0) {
            Logger.log("地图数据为空");
            return;
        }

        // ① 第一时间设置地图数据
        this._mapManager.initMap(map);
        this._pathFinder.setMap(map);

        // ② 停止所有方块动画与移动计时器：
        //    取消本组件待执行的 scheduleOnce 回调（0.2s 消除收尾/连线清除等），防止打乱后误删新地图方块；
        //    _resetAllCubes 内对所有方块 stopMove()（停止移动动画与延迟启动计时器）、重置位置、清空移动计数与 isMapMoving
        this.unscheduleAllCallbacks();
        this._clearSelection();
        this._clearPathLines();
        this._resetAllCubes();

        // 清空已消除记录，防止上一局残留的坐标对被误消费
        this._allreadyRemoved.clear();

        // ③ 遍历地图数据立即设置每个方块的资源与新位置（同网格尺寸下 resetPosition 即新格位）
        for (let row = 0; row < map.length; row++) {
            for (let col = 0; col < map[row].length; col++) {
                const resId = map[row][col];
                const cube = this.getCube(row, col);

                if (cube) {
                    if (resId === 0) {
                        // 空方块，从节点移除
                        this._removeCubeFromNode(cube, row, col);
                    } else {
                        // 设置资源路径，格式: ui://resPath/80_resId
                        cube.visible = true;
                        cube.UI_SP_ANI.visible = false;
                        cube.UI_LOADER_ICOM.url = `ui://${resPath}/80_${resId}`;
                    }
                } else if (resId !== 0) {
                    // 布局中不存在该格（地图比布局大），动态创建方块
                    const newCube = this.createCube(row, col);
                    if (newCube) {
                        newCube.UI_SP_ANI.visible = false;
                        newCube.UI_LOADER_ICOM.url = `ui://${resPath}/80_${resId}`;
                    }
                }
            }
        }

        // ④ 播放入场动画：先隐藏所有方块，再从上到下逐行显示并播放 enter 过渡动画
        this._playEnterAnimation();
    }

    /**
     * @method _playEnterAnimation
     * @description 播放整图入场动画：先将所有在节点上的方块隐藏，再按行从上到下逐行显示并播放 enter 过渡动画，行间隔 _enterRowInterval 秒；initMap 开头的 unscheduleAllCallbacks 会取消未播完的延时回调，中断安全；播放期间置 GameData.isMapEntering 为 true，最后一行入场动画结束后恢复
     * @private
     */
    private _playEnterAnimation(): void {
        // 开局入场动画播放中，供道具面板等模块拦截操作
        GameData.instance.isMapEntering = true;

        // 按行收集当前在节点上的方块（空方块已被移除），并先全部隐藏
        const rowCubes: CompCube[][] = [];
        for (let row = 0; row < this._rows; row++) {
            const cubes: CompCube[] = [];
            for (let col = 0; col < this._cols; col++) {
                const cube = this._cubeMap[row] && this._cubeMap[row][col];
                if (cube && cube.parent === this) {
                    cube.visible = false;
                    cubes.push(cube);
                }
            }
            if (cubes.length > 0) {
                rowCubes.push(cubes);
            }
        }

        // 从上到下逐行延时显示并播放动画（行间隔 _enterRowInterval 秒）
        for (let i = 0; i < rowCubes.length; i++) {
            this.scheduleOnce(() => {
                for (const cube of rowCubes[i]) {
                    cube.playEnter();
                }
            }, i * this._enterRowInterval);
        }

        // 最后一行开始播放入场动画后再等待 _enterAnimDuration 秒，恢复状态（无方块时立即恢复）
        if (rowCubes.length > 0) {
            this.scheduleOnce(
                () => {
                    GameData.instance.isMapEntering = false;
                },
                (rowCubes.length - 1) * this._enterRowInterval + this._enterAnimDuration
            );
        } else {
            GameData.instance.isMapEntering = false;
        }
    }

    /**
     * @method createCube
     * @description 创建指定格子的方块（地图比布局大时动态补充，供下一局使用），优先复用已被移除且网格坐标相同的方块，否则通过 FGUI 包新建
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @returns {CompCube | null} 方块对象，创建失败返回 null
     */
    createCube(row: number, col: number): CompCube | null {
        // 该格已有方块，直接返回
        const exist = this.getCube(row, col);
        if (exist) {
            return exist;
        }

        // 优先复用已被移除且网格坐标相同的方块
        const reused = this._reattachCube(row, col);
        if (reused) {
            return reused;
        }

        // 从 FGUI 包创建新方块
        const cube = fgui.UIPackage.createObject("game10002", "CompCube") as CompCube;
        if (!cube) {
            Logger.error(`创建方块失败: (${row}, ${col})`);
            return null;
        }

        cube.name = `CUTE_${row}_${col}`;

        // 按格子像素坐标定位（布局未覆盖的格子按间距推导）
        const pos = this._computeCellPos(row, col);
        cube.x = pos.x;
        cube.y = pos.y;

        // 记录初始坐标，方便一局结束后重置
        cube.setInitPosition(row, col);

        cube.visible = true;
        cube.UI_SP_ANI.visible = false;

        // 挂到节点并登记
        this.addChild(cube);
        this._bindCubeClickEvent(cube, row, col);
        this._allCubes.push(cube);
        if (!this._cubeMap[row]) {
            this._cubeMap[row] = [];
        }
        this._cubeMap[row][col] = cube;

        // 更新地图尺寸
        if (row >= this._rows) this._rows = row + 1;
        if (col >= this._cols) this._cols = col + 1;

        return cube;
    }

    /**
     * @method getCube
     * @description 获取指定位置的方块
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @returns {CompCube | null} 方块对象，不存在则返回 null
     */
    getCube(row: number, col: number): CompCube | null {
        if (this._cubeMap[row] && this._cubeMap[row][col]) {
            return this._cubeMap[row][col];
        }
        return null;
    }

    /**
     * @method setCube
     * @description 设置指定位置的方块资源
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @param {number} resId - 资源 ID，0 表示空方块
     * @param {string} resPath - 资源前缀路径
     */
    setCube(row: number, col: number, resId: number, resPath: string): void {
        let cube = this.getCube(row, col);
        if (!cube) {
            if (resId === 0) {
                Logger.log(`方块位置 [${row}, ${col}] 不存在`);
                return;
            }
            // 布局中不存在该格，动态创建方块
            cube = this.createCube(row, col);
            if (!cube) {
                return;
            }
        }

        if (resId === 0) {
            // 空方块，从节点移除
            this._removeCubeFromNode(cube, row, col);
        } else {
            cube.visible = true;
            cube.UI_SP_ANI.visible = false;
            cube.UI_LOADER_ICOM.url = `ui://${resPath}/80_${resId}`;
        }
    }

    /**
     * @method clearMap
     * @description 清空整个地图，将所有方块从节点移除
     */
    clearMap(): void {
        // 取消本组件待执行的定时器（连线清除等），防止残留回调操作新地图
        this.unscheduleAllCallbacks();

        // 清空选中状态和路径线条
        this._clearSelection();
        this._clearPathLines();

        // 重置所有方块到初始位置
        this._resetAllCubes();

        // 将所有方块从节点移除
        for (const cube of this._allCubes) {
            this._removeCubeFromNode(cube, cube.getRow(), cube.getCol());
        }

        // 重置MapManager
        this._mapManager.reset();
    }

    /**
     * @method hideCube
     * @description 移除指定位置的方块（从节点移除，不销毁，下一局可复用）
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     */
    hideCube(row: number, col: number): void {
        const cube = this.getCube(row, col);
        if (cube) {
            this._removeCubeFromNode(cube, row, col);
        }
    }

    /**
     * @method showCube
     * @description 显示指定位置的方块（已被移除的方块重新挂回节点）
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     */
    showCube(row: number, col: number): void {
        const cube = this.getCube(row, col);
        if (cube) {
            cube.visible = true;
            return;
        }
        // 方块已从节点移除，从全量表中按网格坐标查找并重新挂回
        this._reattachCube(row, col);
    }

    /**
     * @method getRows
     * @description 获取地图行数
     * @returns {number} 行数
     */
    getRows(): number {
        return this._rows;
    }

    /**
     * @method getCols
     * @description 获取地图列数
     * @returns {number} 列数
     */
    getCols(): number {
        return this._cols;
    }

    /**
     * @method getAllCubes
     * @description 获取所有方块数据
     * @returns {CompCube[][]} 方块二维数组
     */
    getAllCubes(): CompCube[][] {
        return this._cubeMap;
    }

    /**
     * @method getMapManager
     * @description 获取地图管理器
     * @returns {MapManager} 地图管理器实例
     */
    getMapManager(): MapManager {
        return this._mapManager;
    }

    /**
     * @method getPathFinder
     * @description 获取路径查找器
     * @returns {PathFinder} 路径查找器实例
     */
    getPathFinder(): PathFinder {
        return this._pathFinder;
    }

    /**
     * @method hasHint
     * @description 获取提示，返回一组可以消除的方块
     * @returns {[Point, Point] | null} 可消除的方块对，如果没有则返回null
     */
    hasHint(): [Point, Point] | null {
        return this._pathFinder.getHint();
    }

    /**
     * @method hasAnyValidPair
     * @description 判断当前地图是否还存在可消除的方块对
     * @returns {boolean} 是否存在可消除的方块对
     */
    hasAnyValidPair(): boolean {
        return this._pathFinder.hasAnyValidPair();
    }

    /**
     * @method _pairKey
     * @description 规范化坐标对生成唯一 key，消除 (p1,p2) 与 (p2,p1) 映射到同一 key
     * @param {Point} p1 - 第一个方块坐标
     * @param {Point} p2 - 第二个方块坐标
     * @returns {string} 规范化 key
     * @private
     */
    private _pairKey(p1: Point, p2: Point): string {
        const a = p1.row * 1000 + p1.col;
        const b = p2.row * 1000 + p2.col;
        return Math.min(a, b) + "_" + Math.max(a, b);
    }

    /**
     * @method _addAllreadyRemoved
     * @description 记录一条已消除的方块坐标对，同一坐标对重复记录时次数累加
     * @param {Point} p1 - 第一个方块坐标
     * @param {Point} p2 - 第二个方块坐标
     * @private
     */
    private _addAllreadyRemoved(p1: Point, p2: Point): void {
        const key = this._pairKey(p1, p2);
        this._allreadyRemoved.set(key, (this._allreadyRemoved.get(key) ?? 0) + 1);
    }

    /**
     * @method checkClientRemoved
     * @description 检查指定的方块是否已经被客户端消除，每次服务器确认消耗一条记录
     * @param {Point} p1 - 第一个方块坐标
     * @param {Point} p2 - 第二个方块坐标
     * @returns {boolean} 如果已经被消除则返回 true，否则返回 false
     */
    checkClientRemoved(p1: Point, p2: Point): boolean {
        const key = this._pairKey(p1, p2);
        const count = this._allreadyRemoved.get(key);
        if (count === undefined) {
            return false;
        }

        Logger.log(`方块已被客户端消除: (${p1.row}, ${p1.col}) - (${p2.row}, ${p2.col})`);
        if (count <= 1) {
            this._allreadyRemoved.delete(key);
        } else {
            this._allreadyRemoved.set(key, count - 1);
        }
        return true;
    }

    /**
     * @method removeTilesWithAnimation
     * @description 服务器确认消除时，立即更新地图数据与方块坐标、计算出要移动的方块，再执行消除动画，不发送网络请求
     * @param {Point} p1 - 第一个方块坐标
     * @param {Point} p2 - 第二个方块坐标
     * @param {LineSegment[]} lines - 连接路径
     */
    removeTilesWithAnimation(p1: Point, p2: Point, lines: LineSegment[]): void {
        const firstCube = this.getCube(p1.row, p1.col);
        const secondCube = this.getCube(p2.row, p2.col);

        if (!firstCube || !secondCube) return;
        if (!firstCube.visible || !secondCube.visible) return;

        this._clearSelection();

        // 立即更新地图数据与方块坐标，并计算出消除后需要移动的方块
        const shiftMoves = this._applyRemoveWithShift(p1, p2, firstCube, secondCube);

        // 立即播放移动动画（并发消除时新任务追加到对应方块的动画队列，依次执行）
        this._playShiftMoves(shiftMoves);

        // 显示路径线条与消除特效
        this._showPathLines(lines);

        firstCube.UI_SP_ANI.visible = true;
        secondCube.UI_SP_ANI.visible = true;
        SpinePlay(firstCube.UI_SP_ANI, "action", false);
        SpinePlay(secondCube.UI_SP_ANI, "action", false);
        this._startExplosion(firstCube, secondCube);
        SoundManager.instance.playSoundEffect("game10002/bomb");

        // 延迟0.2秒后移除方块节点、清理连线（爆炸特效播放完毕）
        this.scheduleOnce(() => {
            this._finishRemoveVisuals(firstCube, secondCube, p1, p2);
        }, this._removeDelay);
    }

    /**
     * @method showOtherPlayerRemoveAnimation
     * @description 显示其他玩家消除的连线动画（不判断是否可以消除）
     * @param {Point} p1 - 第一个方块坐标
     * @param {Point} p2 - 第二个方块坐标
     * @param {LineSegment[]} lines - 连接路径
     */
    showOtherPlayerRemoveAnimation(p1: Point, p2: Point, lines: LineSegment[]): void {
        // 显示连线动画
        this._showPathLines(lines);

        // 延迟后清除连线
        this.scheduleOnce(() => {
            this._clearPathLines();
        }, this._removeDelay + 0.1);
    }
}
fgui.UIObjectFactory.setExtension(CompMap.URL, CompMap);
