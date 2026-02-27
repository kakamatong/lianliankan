import FGUICompOtherPlayer from "../../../../../fgui/game10002/FGUICompOtherPlayer";
import { CompPlayerHead } from "./CompPlayerHead";
import { CompMap } from "./CompMap";
import { ViewClass } from "db://assets/scripts/frameworks/Framework";
import { GAME_PLAYER_INFO } from "../../../data/InterfaceGameConfig";
import { Point, LineSegment } from "../../../logic/TileMapData";
import * as fgui from "fairygui-cc";

/**
 * @class CompOtherPlayer
 * @description 其他玩家组件，包含头像和小地图预览
 * @category 游戏 10002 - 连连看
 */
@ViewClass()
export class CompOtherPlayer extends FGUICompOtherPlayer {
    /**
     * @property {CompPlayerHead} _compHead
     * @description 头像组件
     * @private
     */
    private _compHead: CompPlayerHead;

    /**
     * @property {CompMap} _compMap
     * @description 地图组件
     * @private
     */
    private _compMap: CompMap;

    /**
     * @property {number} _seat
     * @description 服务器座位号
     * @private
     */
    private _seat: number = 0;

    /**
     * @method onConstruct
     * @description 组件构造完成时的初始化
     */
    protected onConstruct(): void {
        super.onConstruct();
        this._initComponents();
    }

    /**
     * @method _initComponents
     * @description 初始化子组件
     * @private
     */
    private _initComponents(): void {
        // 获取头像组件
        this._compHead = this.UI_COMP_HEAD as CompPlayerHead;
        
        // 获取地图组件并设置为只读模式
        this._compMap = this.UI_COMP_MAP as CompMap;
        this._compMap.setReadonly(true);
    }

    /**
     * @method setLocalSeat
     * @description 设置本地座位号
     * @param {number} localSeat - 本地座位号
     */
    setLocalSeat(localSeat: number): void {
        this._seat = localSeat;
        if (this._compHead) {
            this._compHead.setLocalSeat(localSeat);
        }
    }

    /**
     * @method getLocalSeat
     * @description 获取本地座位号
     * @returns {number} 本地座位号
     */
    getLocalSeat(): number {
        return this._seat;
    }

    /**
     * @method updatePlayerInfo
     * @description 更新玩家信息
     * @param {GAME_PLAYER_INFO} player - 玩家信息
     * @param {string} headurl - 头像URL
     */
    updatePlayerInfo(player: GAME_PLAYER_INFO, headurl: string): void {
        if (this._compHead) {
            // 其他玩家不是你自己
            this._compHead.updatePlayerInfo(player, false, headurl);
        }
    }

    /**
     * @method updateMap
     * @description 更新地图数据
     * @param {number[][]} mapData - 地图数据
     * @param {string} resPath - 资源路径，默认为 "resEmoji"
     */
    updateMap(mapData: number[][], resPath: string = "resEmoji"): void {
        if (this._compMap) {
            this._compMap.initMap(mapData, resPath);
        }
    }

    /**
     * @method removeTiles
     * @description 移除指定位置的方块（其他玩家消除时调用）
     * @param {Point} p1 - 第一个方块坐标
     * @param {Point} p2 - 第二个方块坐标
     * @param {LineSegment[]} lines - 连接路径，用于显示连线动画
     */
    removeTiles(p1: Point, p2: Point, lines?: LineSegment[]): void {
        if (this._compMap) {
            // 如果有连线数据，显示连线动画
            if (lines && lines.length > 0) {
                this._compMap.showOtherPlayerRemoveAnimation(p1, p2, lines);
            }
            // 在地图上隐藏这两个方块
            this._compMap.hideCube(p1.row, p1.col);
            this._compMap.hideCube(p2.row, p2.col);
        }
    }

    /**
     * @method show
     * @description 显示组件
     */
    show(): void {
        this.visible = true;
    }

    /**
     * @method hide
     * @description 隐藏组件
     */
    hide(): void {
        this.visible = false;
    }

    /**
     * @method reset
     * @description 重置组件状态
     */
    reset(): void {
        if (this._compHead) {
            this._compHead.reset();
        }
        if (this._compMap) {
            this._compMap.clearMap();
        }
        this._seat = 0;
    }

    /**
     * @method getHeadComponent
     * @description 获取头像组件
     * @returns {CompPlayerHead} 头像组件
     */
    getHeadComponent(): CompPlayerHead {
        return this._compHead;
    }

    /**
     * @method getMapComponent
     * @description 获取地图组件
     * @returns {CompMap} 地图组件
     */
    getMapComponent(): CompMap {
        return this._compMap;
    }
}
fgui.UIObjectFactory.setExtension(CompOtherPlayer.URL, CompOtherPlayer);
