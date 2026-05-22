import { AddEventListener, DispatchEvent, RemoveEventListener } from "@frameworks/Framework";
import {
    SprotoGameStart,
    SprotoMapData,
    SprotoTilesRemoved,
    SprotoPlayerFinished,
    SprotoGameEnd,
    SprotoProgressUpdate,
    SprotoItemEffect,
    SprotoLogicInfo,
    SprotoComboSuccess,
    SprotoMapShuffled,
    SprotoPlayerInfos,
    SprotoPlayerEnter,
    SprotoStepId,
} from "../../types/protocol/game10002/s2c";
import {
    SprotoClickTiles,
    SprotoUseItem,
    SprotoGameReady,
    SprotoLeaveRoom,
    SprotoOwnerStartGame,
    SprotoClientReady,
} from "../../types/protocol/game10002/c2s";
import { RICH_TYPE } from "@datacenter/InterfaceConfig";
import { DataCenter } from "@datacenter/Datacenter";

/**
 * @class LocalSvr
 * @description 本地游戏模拟服务器，接管 GameSocketManager 在本地模式下的协议收发，
 *              模拟联网游戏的核心协议流程（方块消除、道具使用、游戏结束等）
 */
export class LocalSvr {
    /** 单例实例 */
    private static _instance: LocalSvr;

    /**
     * 获取 LocalSvr 单例
     */
    public static get instance(): LocalSvr {
        if (!this._instance) {
            this._instance = new LocalSvr();
        }
        return this._instance;
    }

    /** 服务器端维护的地图数据 */
    private _map: number[][] = [];
    /** 地图行数 */
    private _rows: number = 10;
    /** 地图列数 */
    private _cols: number = 10;
    /** 初始总方块数 */
    private _totalBlocks: number = 0;
    /** 已消除方块数 */
    private _eliminated: number = 0;
    /** 游戏开始时间戳 */
    private _startTime: number = 0;
    /** 当前回合数 */
    private _roundNum: number = 0;
    /** 连击计数 */
    private _comboCount: number = 0;
    /** 上次消除时间戳（用于连击判定） */
    private _lastRemoveTime: number = 0;
    /** 连击时间窗口（毫秒） */
    private readonly COMBO_WINDOW: number = 3000;

    constructor() {}

    /**
     * 启动本地服务器，注册所有 C2S 协议监听
     */
    start(): void {
        // 先清理旧监听，确保多次调用不累积
        this.destroy();

        AddEventListener(SprotoClientReady.Name, this.onClientReady, this);
        AddEventListener(SprotoClickTiles.Name, this.onClickTiles, this);
        AddEventListener(SprotoUseItem.Name, this.onUseItem, this);
        AddEventListener(SprotoGameReady.Name, this.onGameReady, this);
        AddEventListener(SprotoLeaveRoom.Name, this.onLeaveRoom, this);
        AddEventListener(SprotoOwnerStartGame.Name, this.onOwnerStartGame, this);
    }

    /**
     * 销毁本地服务器，移除所有监听
     */
    destroy(): void {
        RemoveEventListener(SprotoClientReady.Name, this.onClientReady);
        RemoveEventListener(SprotoClickTiles.Name, this.onClickTiles);
        RemoveEventListener(SprotoUseItem.Name, this.onUseItem);
        RemoveEventListener(SprotoGameReady.Name, this.onGameReady);
        RemoveEventListener(SprotoLeaveRoom.Name, this.onLeaveRoom);
        RemoveEventListener(SprotoOwnerStartGame.Name, this.onOwnerStartGame);
    }

    /** 分发响应事件（"resp" + 协议名，供 GameSocketManager 的回调使用） */
    dispatchEventResp(eventName: string, data?: any): void {
        DispatchEvent("resp" + eventName, data);
    }

    /** 分发广播事件（协议名，模拟服务器推送） */
    dispatchEvent(eventName: string, data?: any): void {
        DispatchEvent(eventName, data);
    }

    // ============================================
    // C2S 协议处理
    // ============================================

    /**
     * 客户端就绪 → 开始游戏
     */
    onClientReady(): void {
        this.startStepGame();
    }

    /**
     * 方块消除请求
     * 本地模式不做合法性校验，直接放行
     */
    onClickTiles(data: SprotoClickTiles.Request): void {
        const { row1, col1, row2, col2 } = data;
        const selfSeat = 1;

        // 更新服务器端地图
        this._map[row1][col1] = 0;
        this._map[row2][col2] = 0;
        this._eliminated += 2;

        const remaining = this._totalBlocks - this._eliminated;
        const now = Date.now();

        // 连击判定
        if (this._lastRemoveTime > 0 && now - this._lastRemoveTime < this.COMBO_WINDOW) {
            this._comboCount++;
        } else {
            this._comboCount = 1;
        }
        this._lastRemoveTime = now;

        // 发送 clickTiles 响应
        this.dispatchEventResp(SprotoClickTiles.Name, {
            code: 1,
            msg: "",
            eliminated: this._eliminated,
            remaining: remaining,
        });

        // 广播方块消除通知
        this.dispatchEvent(SprotoTilesRemoved.Name, {
            code: 1,
            p1: { row: row1, col: col1 },
            p2: { row: row2, col: col2 },
            lines: [],
            eliminated: this._eliminated,
            remaining: remaining,
            seat: selfSeat,
        });

        // 广播进度更新
        const percentage = this._totalBlocks > 0 ? Math.round((this._eliminated / this._totalBlocks) * 100) : 0;
        this.dispatchEvent(SprotoProgressUpdate.Name, {
            seat: selfSeat,
            eliminated: this._eliminated,
            remaining: remaining,
            percentage: percentage,
            finished: remaining === 0 ? 1 : 0,
            usedTime: now - this._startTime,
        });

        // 连击通知
        if (this._comboCount >= 2) {
            this.dispatchEvent(SprotoComboSuccess.Name, {
                seat: selfSeat,
                comboCount: this._comboCount,
                comboTime: now,
                comboDuration: this.COMBO_WINDOW,
            });
        }

        // 检查游戏结束
        if (remaining <= 0) {
            this.onGameFinished();
        }
    }

    /**
     * 道具使用请求
     */
    onUseItem(data: SprotoUseItem.Request): void {
        const { itemId } = data;

        switch (itemId) {
            case RICH_TYPE.UPSET:
                this.handleUpset(itemId);
                break;
            case RICH_TYPE.AUTO_REMOVE:
                this.handleAutoRemove(itemId);
                break;
            default:
                // 未知道具，返回成功但不做处理
                this.dispatchEventResp(SprotoUseItem.Name, { code: 1, msg: "", richNum: 0 });
                break;
        }
    }

    /**
     * 游戏准备请求
     */
    onGameReady(_data: any): void {
        this.dispatchEventResp(SprotoGameReady.Name, { code: 1, msg: "" });
    }

    /**
     * 离开房间请求
     */
    onLeaveRoom(_data: any): void {
        this.dispatchEventResp(SprotoLeaveRoom.Name, { code: 1, msg: "" });
    }

    /**
     * 房主开始游戏请求
     */
    onOwnerStartGame(_data: any): void {
        this.dispatchEventResp(SprotoOwnerStartGame.Name, { code: 1, msg: "", notReadyUserids: [] });
    }

    // ============================================
    // 游戏流程
    // ============================================

    /**
     * 开始一局游戏
     */
    startStepGame(): void {
        this._startTime = Date.now();
        this._roundNum++;
        this._eliminated = 0;
        this._comboCount = 0;
        this._lastRemoveTime = 0;

        this.dispatchEvent(SprotoGameStart.Name, {});
        this.dispatchEvent(SprotoStepId.Name, { step: 2 });
        this.dispatchEvent(SprotoLogicInfo.Name, { playerCnt: 1, playingStepTime: 0, ext: "" });

        // 下发自己的用户信息
        this.dispatchSelfPlayerInfo();

        this.randomMap();
    }

    /**
     * 下发本地玩家的用户信息（playerInfos + playerEnter）
     */
    dispatchSelfPlayerInfo(): void {
        const dc = DataCenter.instance;
        const userData = dc.userData;
        const selfSeat = 1;

        // 构造 PlayerInfo
        const playerInfo = {
            userid: dc.userid,
            nickname: userData?.nickname ?? "",
            headurl: dc.headurl,
            sex: userData?.sex ?? 0,
            province: userData?.province ?? "",
            city: userData?.city ?? "",
            ip: userData?.ip ?? "",
            status: 0,
            cp: 0,
            ext: "",
        };

        // 广播玩家信息列表
        this.dispatchEvent(SprotoPlayerInfos.Name, { infos: [playerInfo] });

        // 广播玩家进入
        this.dispatchEvent(SprotoPlayerEnter.Name, { userid: dc.userid, seat: selfSeat });
    }

    /**
     * 生成随机地图并广播
     */
    randomMap(): void {
        const map: number[][] = [];

        // 初始化地图（全部设为0）
        for (let i = 0; i < this._rows; i++) {
            map[i] = new Array(this._cols).fill(0);
        }

        // 内部区域为8x8（行1-8，列1-8），需要填充64个格子
        // 生成32对方块，每对随机类型1-max
        let pairIndex = 0;
        const max = 10;
        const pairs: number[] = [];
        for (let i = 0; i < 32; i++) {
            const type = ++pairIndex;
            pairs.push(type, type); // 添加一对
            if (pairIndex >= max) pairIndex = 0;
        }

        // 打乱顺序
        for (let i = pairs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
        }

        // 填充到内部区域
        let index = 0;
        for (let row = 1; row < this._rows - 1; row++) {
            for (let col = 1; col < this._cols - 1; col++) {
                map[row][col] = pairs[index++];
            }
        }

        // 保存到服务器端状态
        this._map = map;
        this._totalBlocks = 64;

        const strMap = JSON.stringify(map);
        const data = {
            mapData: strMap,
            totalBlocks: this._totalBlocks,
            seat: 1,
            row: this._rows,
            col: this._cols,
        };

        this.dispatchEvent(SprotoMapData.Name, data);
    }

    /**
     * 游戏完成处理
     */
    onGameFinished(): void {
        const usedTime = Math.round((Date.now() - this._startTime) / 1000);
        const selfSeat = 1;

        // 广播玩家完成
        this.dispatchEvent(SprotoPlayerFinished.Name, {
            seat: selfSeat,
            usedTime: usedTime,
            rank: 1,
        });

        // 广播游戏结束
        this.dispatchEvent(SprotoGameEnd.Name, {
            roundNum: this._roundNum,
            endTime: Date.now(),
            endType: 1,
            rankings: [
                {
                    seat: selfSeat,
                    usedTime: usedTime,
                    eliminated: this._eliminated,
                    rank: 1,
                    maxCombo: this._comboCount,
                },
            ],
            scores: [
                {
                    seat: selfSeat,
                    newScore: 0,
                    delta: 0,
                },
            ],
        });
    }

    // ============================================
    // 道具处理
    // ============================================

    /**
     * 处理打乱道具：收集剩余方块 → 随机重排 → 下发新地图
     */
    handleUpset(itemId: number): void {
        const selfSeat = 1;

        // 收集所有非零方块
        const tiles: number[] = [];
        for (let row = 1; row < this._rows - 1; row++) {
            for (let col = 1; col < this._cols - 1; col++) {
                if (this._map[row][col] !== 0) {
                    tiles.push(this._map[row][col]);
                }
            }
        }

        // 打乱
        for (let i = tiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
        }

        // 重新填充
        let index = 0;
        for (let row = 1; row < this._rows - 1; row++) {
            for (let col = 1; col < this._cols - 1; col++) {
                this._map[row][col] = index < tiles.length ? tiles[index++] : 0;
            }
        }

        // 响应道具使用
        this.dispatchEventResp(SprotoUseItem.Name, { code: 1, msg: "", richNum: 0 });

        // 广播道具效果
        this.dispatchEvent(SprotoItemEffect.Name, {
            seat: selfSeat,
            itemId: itemId,
            effect: "shuffle",
        });

        // 广播打乱通知
        this.dispatchEvent(SprotoMapShuffled.Name, {
            seat: selfSeat,
            reason: 1,
        });

        // 下发新地图（客户端通过 onSvrMapData 重新渲染）
        const strMap = JSON.stringify(this._map);
        const mapData = {
            mapData: strMap,
            totalBlocks: this._totalBlocks,
            seat: selfSeat,
            row: this._rows,
            col: this._cols,
        };
        this.dispatchEvent(SprotoMapData.Name, mapData);
    }

    /**
     * 处理自动消除道具：找到两个同类型方块 → 直接消除
     */
    handleAutoRemove(itemId: number): void {
        const selfSeat = 1;

        // 查找任意两个同类型方块
        let found: { row1: number; col1: number; row2: number; col2: number } | null = null;

        for (let row = 1; row < this._rows - 1 && !found; row++) {
            for (let col = 1; col < this._cols - 1 && !found; col++) {
                const type = this._map[row][col];
                if (type === 0) continue;

                // 从当前位置之后查找同类型
                for (let r2 = row; r2 < this._rows - 1 && !found; r2++) {
                    const startCol = r2 === row ? col + 1 : 1;
                    for (let c2 = startCol; c2 < this._cols - 1 && !found; c2++) {
                        if (this._map[r2][c2] === type) {
                            found = { row1: row, col1: col, row2: r2, col2: c2 };
                        }
                    }
                }
            }
        }

        if (found) {
            // 响应道具使用
            this.dispatchEventResp(SprotoUseItem.Name, { code: 1, msg: "", richNum: 0 });

            // 直接调用消除逻辑
            this.onClickTiles({ row1: found.row1, col1: found.col1, row2: found.row2, col2: found.col2 });

            // 广播道具效果
            this.dispatchEvent(SprotoItemEffect.Name, {
                seat: selfSeat,
                itemId: itemId,
                effect: "autoRemove",
            });
        } else {
            // 没有可消除的方块对
            this.dispatchEventResp(SprotoUseItem.Name, { code: 0, msg: "没有可消除的方块对", richNum: 0 });
        }
    }
}
