/**
 * @file Gamedata.ts
 * @description 游戏数据：管理游戏 10002 的游戏数据
 * @category 游戏 10002
 */

import { DEFAULT_HEADURL } from "@datacenter/InterfaceConfig";
import { GAME_PLAYER_INFO, ENUM_GAME_STEP, GAME_DATA } from "./InterfaceGameConfig";

/**
 * @interface PLAYER_MAP_DATA
 * @description 玩家地图数据结构
 */
export interface PLAYER_MAP_DATA {
    seat: number;
    mapData: number[][];
    totalBlocks: number;
    col: number;
    row: number;
}

/**
 * @class GameData
 * @description 游戏数据类，管理游戏 10002 的游戏数据，使用单例模式
 * @category 游戏 10002
 * @singleton 单例模式
 */
export class GameData {
    private _playerInfoMap: Map<number, GAME_PLAYER_INFO> = new Map();
    private _selfSeat: number = 0;
    private _maxPlayer = 2;
    private _gameStep: ENUM_GAME_STEP = ENUM_GAME_STEP.NONE;
    private _roomEnd: boolean = false;
    private _gameStart = false;
    private _isPrivateRoom = false;
    private _gameData: GAME_DATA | null = null;
    private _owner = 0;
    private _record: Array<any> = [];
    private _privateNowCnt: number = 0; // 第几局
    private _privateMaxCnt: number = 0; // 最大局数
    /** 所有玩家的地图数据，key为服务器座位号 */
    private _playerMaps: Map<number, PLAYER_MAP_DATA> = new Map();
    /** 对局阶段时间（秒） */
    private _playingStepTime: number = 0;
    /** 单例实例 */
    private static _instance: GameData;

    /**
     * @description 获取 GameData 单例实例
     * @returns GameData 单例实例
     */
    public static get instance(): GameData {
        if (!this._instance) {
            this._instance = new GameData();
        }
        return this._instance;
    }

    private constructor() {}

    /**
     * @description 初始化游戏数据
     */
    init() {
        this.gameStep = ENUM_GAME_STEP.NONE;
        this._playerInfoMap.clear();
        this._selfSeat = 0;
        this.roomEnd = false;
        this.gameStart = false;
        this.isPrivateRoom = false;
        this.gameData = null;
        this._owner = 0;
        this._privateNowCnt = 0;
        this._playerMaps.clear();
        this._playingStepTime = 0;
    }

    get gameStep(): ENUM_GAME_STEP {
        return this._gameStep;
    }

    set gameStep(step: ENUM_GAME_STEP) {
        this._gameStep = step;
    }

    get maxPlayer(): number {
        return this._maxPlayer;
    }

    set maxPlayer(max: number) {
        this._maxPlayer = max;
    }

    getSelfSeat(): number {
        return this._selfSeat;
    }

    setSelfSeat(seat: number): void {
        this._selfSeat = seat;
    }

    /**
     * @description 设置玩家列表
     * @param list 玩家列表
     */
    set playerList(list: Array<GAME_PLAYER_INFO>) {
        this._playerInfoMap.clear();
        for (const player of list) {
            if (player && player.svrSeat) {
                this._playerInfoMap.set(player.svrSeat, player);
            }
        }
    }

    /**
     * @description 获取所有玩家列表
     * @returns 玩家列表
     */
    get playerList(): Array<GAME_PLAYER_INFO> {
        return Array.from(this._playerInfoMap.values());
    }

    /**
     * @description 添加玩家到列表
     * @param player 玩家信息
     */
    addPlayer(player: GAME_PLAYER_INFO): void {
        if (player && player.svrSeat) {
            this._playerInfoMap.set(player.svrSeat, player);
        }
    }

    /**
     * @description 根据服务器座位号移除玩家
     * @param svrSeat 服务器座位号
     */
    removePlayerBySeat(svrSeat: number): void {
        this._playerInfoMap.delete(svrSeat);
    }

    /**
     * @description 获取指定服务器座位的玩家头像
     * @param svrSeat 服务器座位号
     * @returns 头像 URL
     */
    getHeadurl(svrSeat: number): string {
        const player = this._playerInfoMap.get(svrSeat);
        if (!player || !player.headurl) {
            return DEFAULT_HEADURL;
        }
        return player.headurl;
    }

    getHeadurlByUserid(userid: number): string {
        const player = this.getPlayerByUserid(userid);
        if (!player) {
            return DEFAULT_HEADURL;
        }
        return this.getHeadurl(player.svrSeat);
    }

    getPlayerBySeat(seat: number): GAME_PLAYER_INFO | null {
        return this._playerInfoMap.get(seat) || null;
    }

    getPlayerByUserid(userid: number): GAME_PLAYER_INFO | null {
        for (const player of this._playerInfoMap.values()) {
            if (player.userid === userid) {
                return player;
            }
        }
        return null;
    }

    getPlayerCnt(): number {
        return this._playerInfoMap.size;
    }

    set roomEnd(end: boolean) {
        this._roomEnd = end;
    }

    get roomEnd(): boolean {
        return this._roomEnd;
    }

    set gameStart(start: boolean) {
        this._gameStart = start;
    }

    get gameStart(): boolean {
        return this._gameStart;
    }

    set isPrivateRoom(flag: boolean) {
        this._isPrivateRoom = flag;
    }

    get isPrivateRoom(): boolean {
        return this._isPrivateRoom;
    }

    set gameData(data: GAME_DATA | null) {
        this._gameData = data;
    }

    get gameData(): GAME_DATA | null {
        return this._gameData;
    }

    set owner(userid: number) {
        this._owner = userid;
    }

    get owner(): number {
        return this._owner;
    }

    set record(record: Array<any>) {
        this._record = record;
    }

    get record(): Array<any> {
        return this._record;
    }

    set privateNowCnt(cnt: number) {
        this._privateNowCnt = cnt;
    }

    get privateNowCnt(): number {
        return this._privateNowCnt;
    }

    set privateMaxCnt(cnt: number) {
        this._privateMaxCnt = cnt;
    }

    get privateMaxCnt(): number {
        return this._privateMaxCnt;
    }

    /**
     * @description 设置玩家地图数据
     * @param seat 服务器座位号
     * @param mapData 地图数据
     * @param totalBlocks 总方块数
     */
    setPlayerMapData(seat: number, mapData: number[][], totalBlocks: number, col: number, row: number): void {
        this._playerMaps.set(seat, {
            seat,
            mapData,
            totalBlocks,
            col,
            row,
        });
    }

    /**
     * @description 获取玩家地图数据
     * @param seat 服务器座位号
     * @returns 玩家地图数据
     */
    getPlayerMapData(seat: number): PLAYER_MAP_DATA | undefined {
        return this._playerMaps.get(seat);
    }

    /**
     * @description 获取所有玩家地图数据
     * @returns 所有玩家地图数据
     */
    getAllPlayerMaps(): Map<number, PLAYER_MAP_DATA> {
        return this._playerMaps;
    }

    /**
     * @description 清除所有玩家地图数据
     */
    clearAllPlayerMaps(): void {
        this._playerMaps.clear();
    }

    /**
     * @description 更新玩家地图中的方块（消除）
     * @param seat 服务器座位号
     * @param row1 第一个方块的行
     * @param col1 第一个方块的列
     * @param row2 第二个方块的行
     * @param col2 第二个方块的列
     */
    updatePlayerMapTilesRemoved(seat: number, row1: number, col1: number, row2: number, col2: number): void {
        const playerMap = this._playerMaps.get(seat);
        if (playerMap && playerMap.mapData) {
            if (row1 >= 0 && row1 < playerMap.mapData.length && col1 >= 0 && col1 < playerMap.mapData[0].length) {
                playerMap.mapData[row1][col1] = 0;
            }
            if (row2 >= 0 && row2 < playerMap.mapData.length && col2 >= 0 && col2 < playerMap.mapData[0].length) {
                playerMap.mapData[row2][col2] = 0;
            }
        }
    }

    /**
     * @description 获取对局阶段时间
     * @returns {number} 对局阶段时间（秒）
     */
    get playingStepTime(): number {
        return this._playingStepTime;
    }

    /**
     * @description 设置对局阶段时间
     * @param {number} value 对局阶段时间（秒）
     */
    set playingStepTime(value: number) {
        this._playingStepTime = value;
    }
}
