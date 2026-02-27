/**
 * @file TileMapData.ts
 * @description 连连看地图数据类型定义和工具函数
 * @category 游戏 10002 - 连连看
 */

/**
 * @interface Point
 * @description 坐标点
 * @property {number} row - 行坐标
 * @property {number} col - 列坐标
 */
export interface Point {
    row: number;
    col: number;
}

/**
 * @interface LineSegment
 * @description 直线段接口，包含起点和终点
 * @property {Point} start - 起点坐标
 * @property {Point} end - 终点坐标
 */
export interface LineSegment {
    start: Point;
    end: Point;
}

/**
 * @interface PathResult
 * @description 寻路结果
 * @property {boolean} canConnect - 是否可以连接
 * @property {LineSegment[]} lines - 路径线段数组，包含1-3条线段
 */
export interface PathResult {
    canConnect: boolean;
    lines: LineSegment[];
}

/**
 * @class TileUtils
 * @description 方块类型判断工具类
 * @category 工具类
 */
export class TileUtils {
    /**
     * @method isBlock
     * @description 判断是否为可消除方块（值在1-99之间）
     * @param {number} value - 方块值
     * @returns {boolean} 是否为可消除方块
     * @static
     */
    public static isBlock(value: number): boolean {
        return value > 0 && value < 100;
    }

    /**
     * @method isDecoration
     * @description 判断是否为装饰方块（值大于等于100）
     * @param {number} value - 方块值
     * @returns {boolean} 是否为装饰方块
     * @static
     */
    public static isDecoration(value: number): boolean {
        return value >= 100;
    }

    /**
     * @method isEmpty
     * @description 判断是否为空方块（值为0）
     * @param {number} value - 方块值
     * @returns {boolean} 是否为空方块
     * @static
     */
    public static isEmpty(value: number): boolean {
        return value === 0;
    }

    /**
     * @method isSameBlock
     * @description 判断两个方块是否是相同的可消除方块
     * @param {number} value1 - 第一个方块值
     * @param {number} value2 - 第二个方块值
     * @returns {boolean} 是否是相同的可消除方块
     * @static
     */
    public static isSameBlock(value1: number, value2: number): boolean {
        return this.isBlock(value1) && this.isBlock(value2) && value1 === value2;
    }

    /**
     * @method clonePoint
     * @description 克隆坐标点
     * @param {Point} point - 原始坐标点
     * @returns {Point} 克隆后的坐标点
     * @static
     */
    public static clonePoint(point: Point): Point {
        return { row: point.row, col: point.col };
    }

    /**
     * @method isSamePoint
     * @description 判断两个坐标点是否相同
     * @param {Point} p1 - 第一个坐标点
     * @param {Point} p2 - 第二个坐标点
     * @returns {boolean} 是否相同
     * @static
     */
    public static isSamePoint(p1: Point, p2: Point): boolean {
        return p1.row === p2.row && p1.col === p2.col;
    }
}

/**
 * @enum DIRECTION
 * @description 方向枚举
 */
export enum DIRECTION {
    UP = 0,
    RIGHT = 1,
    DOWN = 2,
    LEFT = 3,
    NONE = -1,
}

/**
 * @interface SearchState
 * @description BFS搜索状态
 * @property {number} row - 当前行
 * @property {number} col - 当前列
 * @property {DIRECTION} direction - 当前方向
 * @property {number} turnCount - 已转弯次数
 * @property {Point[]} path - 当前路径点数组
 */
export interface SearchState {
    row: number;
    col: number;
    direction: DIRECTION;
    turnCount: number;
    path: Point[];
}

/**
 * @constant DIRECTION_DELTAS
 * @description 方向偏移量数组
 * @type {Array<{row: number, col: number}>}
 */
export const DIRECTION_DELTAS = [
    { row: -1, col: 0 }, // 上
    { row: 0, col: 1 },  // 右
    { row: 1, col: 0 },  // 下
    { row: 0, col: -1 }, // 左
];
