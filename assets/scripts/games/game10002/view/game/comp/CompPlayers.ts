import FGUICompPlayers from "../../../../../fgui/game10002/FGUICompPlayers";
import { CompOtherPlayer } from "./CompOtherPlayer";
import { ViewClass } from "db://assets/scripts/frameworks/Framework";
import { GAME_PLAYER_INFO } from "../../../data/InterfaceGameConfig";
import { Point } from "../../../logic/TileMapData";
import * as fgui from "fairygui-cc";

/**
 * @class CompPlayers
 * @description 其他玩家列表管理组件
 * @category 游戏 10002 - 连连看
 */
@ViewClass()
export class CompPlayers extends FGUICompPlayers {
    /**
     * @property {Map<number, CompOtherPlayer>} _playerMap
     * @description 本地座位号到其他玩家组件的映射
     * @private
     */
    private _playerMap: Map<number, CompOtherPlayer> = new Map();

    /**
     * @method onConstruct
     * @description 组件构造完成时的初始化
     */
    protected onConstruct(): void {
        super.onConstruct();
        this._initList();
    }

    /**
     * @method _initList
     * @description 初始化列表
     * @private
     */
    private _initList(): void {
        // 设置列表项渲染器
        this.UI_LIST_OTHER_PLAYERS.itemRenderer = this._renderListItem.bind(this);
    }

    /**
     * @method _renderListItem
     * @description 列表项渲染函数
     * @param {number} index - 索引
     * @param {fgui.GObject} obj - 列表项对象
     * @private
     */
    private _renderListItem(index: number, obj: fgui.GObject): void {
        // 列表项已经是 CompOtherPlayer 类型
        const otherPlayer = obj as CompOtherPlayer;
        if (!otherPlayer) {
            console.error(`列表项 ${index} 不是 CompOtherPlayer 类型`);
            return;
        }
    }

    /**
     * @method addOtherPlayer
     * @description 添加其他玩家
     * @param {number} localSeat - 本地座位号
     * @param {GAME_PLAYER_INFO} player - 玩家信息
     * @param {string} headurl - 头像URL
     * @returns {CompOtherPlayer} 创建的其他玩家组件
     */
    addOtherPlayer(localSeat: number, player: GAME_PLAYER_INFO, headurl: string): CompOtherPlayer {
        // 检查是否已存在
        if (this._playerMap.has(localSeat)) {
            console.warn(`本地座位 ${localSeat} 的玩家已存在，更新信息`);
            const existingPlayer = this._playerMap.get(localSeat)!;
            existingPlayer.updatePlayerInfo(player, headurl);
            return existingPlayer;
        }

        // 添加新的列表项
        const index = this.UI_LIST_OTHER_PLAYERS.numChildren;
        this.UI_LIST_OTHER_PLAYERS.addItemFromPool();

        // 获取刚添加的列表项
        const listItem = this.UI_LIST_OTHER_PLAYERS.getChildAt(index) as CompOtherPlayer;
        if (!listItem) {
            console.error(`无法获取列表项 ${index}`);
            return null;
        }

        // 设置本地座位号并更新信息
        listItem.setLocalSeat(localSeat);
        listItem.updatePlayerInfo(player, headurl);
        listItem.show();

        // 保存到映射表
        this._playerMap.set(localSeat, listItem);

        console.log(`添加其他玩家，本地座位: ${localSeat}, 列表索引: ${index}`);
        return listItem;
    }

    /**
     * @method removeOtherPlayer
     * @description 移除其他玩家
     * @param {number} localSeat - 本地座位号
     */
    removeOtherPlayer(localSeat: number): void {
        const otherPlayer = this._playerMap.get(localSeat);
        if (!otherPlayer) {
            console.warn(`本地座位 ${localSeat} 的玩家不存在`);
            return;
        }

        // 找到列表中的索引
        const index = this.UI_LIST_OTHER_PLAYERS.getChildIndex(otherPlayer);
        if (index >= 0) {
            // 从列表中移除
            this.UI_LIST_OTHER_PLAYERS.removeChildAt(index);
        }

        // 重置并清理
        otherPlayer.reset();

        // 从映射表中移除
        this._playerMap.delete(localSeat);

        console.log(`移除其他玩家，本地座位: ${localSeat}`);
    }

    /**
     * @method getOtherPlayer
     * @description 获取其他玩家组件
     * @param {number} localSeat - 本地座位号
     * @returns {CompOtherPlayer | null} 其他玩家组件，不存在返回 null
     */
    getOtherPlayer(localSeat: number): CompOtherPlayer | null {
        return this._playerMap.get(localSeat) || null;
    }

    /**
     * @method updateOtherPlayerHead
     * @description 更新其他玩家头像
     * @param {number} localSeat - 本地座位号
     * @param {GAME_PLAYER_INFO} player - 玩家信息
     * @param {string} headurl - 头像URL
     */
    updateOtherPlayerHead(localSeat: number, player: GAME_PLAYER_INFO, headurl: string): void {
        const otherPlayer = this._playerMap.get(localSeat);
        if (otherPlayer) {
            otherPlayer.updatePlayerInfo(player, headurl);
        } else {
            // 如果不存在则创建
            this.addOtherPlayer(localSeat, player, headurl);
        }
    }

    /**
     * @method updateOtherPlayerMap
     * @description 更新其他玩家地图
     * @param {number} localSeat - 本地座位号
     * @param {number[][]} mapData - 地图数据
     * @param {string} resPath - 资源路径
     */
    updateOtherPlayerMap(localSeat: number, mapData: number[][], resPath: string = "resEmoji"): void {
        const otherPlayer = this._playerMap.get(localSeat);
        if (otherPlayer) {
            otherPlayer.updateMap(mapData, resPath);
        } else {
            console.warn(`本地座位 ${localSeat} 的玩家不存在，无法更新地图`);
        }
    }

    /**
     * @method removeOtherPlayerTiles
     * @description 移除其他玩家的方块（其他玩家消除时调用）
     * @param {number} localSeat - 本地座位号
     * @param {Point} p1 - 第一个方块坐标
     * @param {Point} p2 - 第二个方块坐标
     */
    removeOtherPlayerTiles(localSeat: number, p1: Point, p2: Point): void {
        const otherPlayer = this._playerMap.get(localSeat);
        if (otherPlayer) {
            otherPlayer.removeTiles(p1, p2);
        } else {
            console.warn(`本地座位 ${localSeat} 的玩家不存在，无法移除方块`);
        }
    }

    /**
     * @method clear
     * @description 清空所有其他玩家
     */
    clear(): void {
        // 重置所有玩家
        for (const [localSeat, otherPlayer] of this._playerMap) {
            otherPlayer.reset();
        }

        // 清空映射表
        this._playerMap.clear();

        // 清空列表
        this.UI_LIST_OTHER_PLAYERS.removeChildrenToPool();

        console.log("清空所有其他玩家");
    }

    /**
     * @method getAllPlayers
     * @description 获取所有其他玩家组件
     * @returns {CompOtherPlayer[]} 其他玩家组件数组
     */
    getAllPlayers(): CompOtherPlayer[] {
        return Array.from(this._playerMap.values());
    }

    /**
     * @method hasPlayer
     * @description 检查是否存在指定座位的玩家
     * @param {number} localSeat - 本地座位号
     * @returns {boolean} 是否存在
     */
    hasPlayer(localSeat: number): boolean {
        return this._playerMap.has(localSeat);
    }
}
fgui.UIObjectFactory.setExtension(CompPlayers.URL, CompPlayers);
