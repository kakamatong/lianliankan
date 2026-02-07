import FGUICompMap from "../../../../../fgui/game10002/FGUICompMap";
import FGUICompCube from "../../../../../fgui/game10002/FGUICompCube";
import * as fgui from "fairygui-cc";
import { PathFinder } from "../../../logic/PathFinder";
import { MapManager } from "../../../logic/MapManager";
import { Point, LineSegment } from "../../../logic/TileMapData";
import { ViewClass } from "db://assets/scripts/frameworks/Framework";

/**
 * @class CompMap
 * @description 连连看地图组件，管理所有方块
 */
@ViewClass()
export class CompMap extends FGUICompMap {
    /**
     * @property {FGUICompCube[][]} _cubeMap
     * @description 存储所有方块的二维数组
     * @private
     */
    private _cubeMap: FGUICompCube[][] = [];

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
     * @property {Array<{cube: FGUICompCube, row: number, col: number}>} _selectedCubes
     * @description 当前选中的方块数组（最多2个）
     * @private
     */
    private _selectedCubes: Array<{ cube: FGUICompCube; row: number; col: number }> = [];

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
    private readonly _removeDelay: number = 0.2;

    /**
     * @method onConstruct
     * @description 组件构造完成时的初始化
     */
    onConstruct(): void {
        super.onConstruct();
        this._initCubeMap();
    }

    /**
     * @method _initCubeMap
     * @description 初始化方块二维数组，将所有 CUTE_X_Y 引用存入数组
     * @private
     */
    private _initCubeMap(): void {
        // 清空现有数据
        this._cubeMap = [];

        // 遍历所有子节点，提取 CUTE_X_Y 格式的方块
        for (let i = 0; i < this.numChildren; i++) {
            const child = this.getChildAt(i) as FGUICompCube;
            if (child && child.name && child.name.startsWith("CUTE_")) {
                const parts = child.name.split("_");
                if (parts.length === 3) {
                    const row = parseInt(parts[1]);
                    const col = parseInt(parts[2]);

                    // 确保行数组存在
                    if (!this._cubeMap[row]) {
                        this._cubeMap[row] = [];
                    }

                    // 存储方块引用
                    this._cubeMap[row][col] = child;

                    // 更新地图尺寸
                    if (row >= this._rows) this._rows = row + 1;
                    if (col >= this._cols) this._cols = col + 1;

                    // 绑定点击事件
                    this._bindCubeClickEvent(child, row, col);
                }
            }
        }
    }

    /**
     * @method _bindCubeClickEvent
     * @description 绑定方块的点击事件
     * @param {FGUICompCube} cube - 方块对象
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @private
     */
    private _bindCubeClickEvent(cube: FGUICompCube, row: number, col: number): void {
        cube.onClick(() => {
            this._onCubeClick(cube, row, col);
        }, this);
    }

    /**
     * @method _onCubeClick
     * @description 处理方块点击事件
     * @param {FGUICompCube} cube - 被点击的方块
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @private
     */
    private _onCubeClick(cube: FGUICompCube, row: number, col: number): void {
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
     * @param {FGUICompCube} cube - 要选的方块
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @private
     */
    private _selectCube(cube: FGUICompCube, row: number, col: number): void {
        // 记录选中的方块
        this._selectedCubes.push({ cube, row, col });

        // 设置放大效果
        cube.setScale(this._selectScale, this._selectScale);

        // 设置最高zOrder
        cube.sortingOrder = this._selectZOrder;
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

        // 恢复方块大小
        selected.cube.setScale(1, 1);

        // 恢复zOrder
        selected.cube.sortingOrder = 0;

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
            selected.cube.setScale(1, 1);
            selected.cube.sortingOrder = 0;
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
            // 可以消除，显示路径线条，然后延迟消除
            this._showPathLines(result.lines);

            // 延迟0.2秒后执行消除
            this.scheduleOnce(() => {
                this._removeCubesWithLines(first, second, p1, p2);
            }, this._removeDelay);
        } else {
            // 不能消除，取消第一个方块的选中，保留第二个
            this._deselectCube(0);
        }
    }

    /**
     * @method _showPathLines
     * @description 显示连接路径线条
     * @param {LineSegment[]} lines - 路径线段数组
     * @private
     */
    private _showPathLines(lines: LineSegment[]): void {
        // 先清理之前的路径线条
        this._clearPathLines();

        // 获取第一个方块作为参考，计算方块中心点间距
        const firstCube = this._selectedCubes[0]?.cube;
        if (!firstCube) return;

        const cubeWidth = firstCube.width;
        const cubeHeight = firstCube.height;
        const lineThickness = 15; // 线条粗细固定

        for (const line of lines) {
            const [start, end] = line;

            // 计算起点和终点的像素坐标（方块中心）
            const startX = start.col * cubeWidth + cubeWidth / 2;
            const startY = start.row * cubeHeight + cubeHeight / 2;
            const endX = end.col * cubeWidth + cubeWidth / 2;
            const endY = end.row * cubeHeight + cubeHeight / 2;

            // 计算线段差值
            const deltaX = endX - startX;
            const deltaY = endY - startY;

            // 创建线条节点
            const lineNode = fgui.UIPackage.createObject("game10002", "CompLine") as fgui.GComponent;

            // 判断是水平线还是垂直线
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // 水平线：通过改变 width 实现
                lineNode.width = Math.abs(deltaX);
                lineNode.height = lineThickness;
                lineNode.x = Math.min(startX, endX);
                lineNode.y = startY - lineThickness / 2; // 居中对齐
            } else {
                // 垂直线：通过改变 height 实现
                lineNode.width = lineThickness;
                lineNode.height = Math.abs(deltaY);
                lineNode.x = startX - lineThickness / 2; // 居中对齐
                lineNode.y = Math.min(startY, endY);
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
     * @method _removeCubesWithLines
     * @description 消除两个方块并清理线条
     * @param {Object} first - 第一个选中的方块信息
     * @param {Object} second - 第二个选中的方块信息
     * @param {Point} p1 - 第一个方块坐标
     * @param {Point} p2 - 第二个方块坐标
     * @private
     */
    private _removeCubesWithLines(
        first: { cube: FGUICompCube; row: number; col: number },
        second: { cube: FGUICompCube; row: number; col: number },
        p1: Point,
        p2: Point
    ): void {
        // 在MapManager中执行消除
        this._mapManager.removeTiles(p1, p2);

        // 更新PathFinder的地图数据
        this._pathFinder.setMap(this._mapManager.getMap());

        // 隐藏方块（重置为初始状态）
        first.cube.visible = false;
        first.cube.setScale(1, 1);
        first.cube.sortingOrder = 0;
        first.cube.UI_LOADER_ICOM.url = "";

        second.cube.visible = false;
        second.cube.setScale(1, 1);
        second.cube.sortingOrder = 0;
        second.cube.UI_LOADER_ICOM.url = "";

        // 清理路径线条
        this._clearPathLines();

        // 清空选中数组
        this._selectedCubes = [];

        console.log(`消除方块: (${first.row},${first.col}) 和 (${second.row},${second.col})`);
    }

    /**
     * @method initMap
     * @description 根据地图数据初始化所有方块资源，同时设置logic数据
     * @param {number[][]} map - 地图数据，number 代表方块资源 ID，0 表示空方块
     * @param {string} resPath - 资源前缀路径，格式如 "game10002"
     */
    initMap(map: number[][], resPath: string): void {
        if (!map || map.length === 0) {
            console.log("地图数据为空");
            return;
        }

        // 清空之前的选中状态和路径线条
        this._clearSelection();
        this._clearPathLines();

        // 初始化MapManager
        this._mapManager.initMap(map);

        // 初始化PathFinder
        this._pathFinder.setMap(map);

        // 遍历地图数据设置每个方块的资源
        for (let row = 0; row < map.length; row++) {
            for (let col = 0; col < map[row].length; col++) {
                const resId = map[row][col];
                const cube = this.getCube(row, col);

                if (cube) {
                    if (resId === 0) {
                        // 空方块，隐藏或清空
                        cube.visible = false;
                        cube.UI_LOADER_ICOM.url = "";
                    } else {
                        // 设置资源路径，格式: ui://resPath/80_resId
                        cube.visible = true;
                        cube.UI_LOADER_ICOM.url = `ui://${resPath}/80_${resId}`;
                    }
                }
            }
        }
    }

    /**
     * @method getCube
     * @description 获取指定位置的方块
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @returns {FGUICompCube | null} 方块对象，不存在则返回 null
     */
    getCube(row: number, col: number): FGUICompCube | null {
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
        const cube = this.getCube(row, col);
        if (!cube) {
            console.log(`方块位置 [${row}, ${col}] 不存在`);
            return;
        }

        if (resId === 0) {
            cube.visible = false;
            cube.UI_LOADER_ICOM.url = "";
        } else {
            cube.visible = true;
            cube.UI_LOADER_ICOM.url = `ui://${resPath}/80_${resId}`;
        }
    }

    /**
     * @method clearMap
     * @description 清空整个地图，隐藏所有方块
     */
    clearMap(): void {
        // 清空选中状态和路径线条
        this._clearSelection();
        this._clearPathLines();

        for (let row = 0; row < this._rows; row++) {
            for (let col = 0; col < this._cols; col++) {
                const cube = this.getCube(row, col);
                if (cube) {
                    cube.visible = false;
                    cube.UI_LOADER_ICOM.url = "";
                }
            }
        }

        // 重置MapManager
        this._mapManager.reset();
    }

    /**
     * @method hideCube
     * @description 隐藏指定位置的方块
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     */
    hideCube(row: number, col: number): void {
        const cube = this.getCube(row, col);
        if (cube) {
            cube.visible = false;
        }
    }

    /**
     * @method showCube
     * @description 显示指定位置的方块
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     */
    showCube(row: number, col: number): void {
        const cube = this.getCube(row, col);
        if (cube) {
            cube.visible = true;
        }
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
     * @returns {FGUICompCube[][]} 方块二维数组
     */
    getAllCubes(): FGUICompCube[][] {
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
}
fgui.UIObjectFactory.setExtension(CompMap.URL, CompMap);
