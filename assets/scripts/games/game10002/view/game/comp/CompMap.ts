import FGUICompMap from "../../../../../fgui/game10002/FGUICompMap";
import FGUICompCube from "../../../../../fgui/game10002/FGUICompCube";
import * as fgui from "fairygui-cc";

/**
 * @class CompMap
 * @description 连连看地图组件，管理所有方块
 */
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
                }
            }
        }
    }

    /**
     * @method initMap
     * @description 根据地图数据初始化所有方块资源
     * @param {number[][]} map - 地图数据，number 代表方块资源 ID，0 表示空方块
     * @param {string} resPath - 资源前缀路径，格式如 "game10002"
     */
    initMap(map: number[][], resPath: string): void {
        if (!map || map.length === 0) {
            console.log("地图数据为空");
            return;
        }

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
        for (let row = 0; row < this._rows; row++) {
            for (let col = 0; col < this._cols; col++) {
                const cube = this.getCube(row, col);
                if (cube) {
                    cube.visible = false;
                    cube.UI_LOADER_ICOM.url = "";
                }
            }
        }
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
}
fgui.UIObjectFactory.setExtension(CompMap.URL, CompMap);
