import FGUICompGameMain from "@fgui/game10002/FGUICompGameMain";
import { GameSocketManager } from "@frameworks/GameSocketManager";
import { AddEventListener, ChangeScene, LogColors, RemoveEventListener, ViewClass } from "@frameworks/Framework";
import { DataCenter } from "@datacenter/Datacenter";
import { GameData } from "../../../data/GameData";
import {
    PLAYER_STATUS,
    ROOM_END_FLAG,
    ROOM_TYPE,
    CTRL_BTN_INDEX,
    GAME_MODE_TXT,
    GAME_PLAYER_INFO,
} from "../../../data/InterfaceGameConfig";
import * as fgui from "fairygui-cc";
import { CompTimeLeft } from "./CompTimeLeft";
import { CompFinshInfo } from "./CompFinshInfo";
import { PopMessageView } from "@view/common/PopMessageView";
import { ENUM_POP_MESSAGE_TYPE } from "@datacenter/InterfaceConfig";
import { FW_EVENT_NAMES } from "@frameworks/config/Config";
import { ResultView } from "../../result/ResultView";
import { UserStatus } from "@modules/UserStatus";
import { MatchView } from "@view/match/MatchView";
import { Match } from "@modules/Match";
import { LobbySocketManager } from "@frameworks/LobbySocketManager";
import { AuthGame } from "@modules/AuthGame";
import { TotalResultView } from "../../result/TotalResultView";
import { MiniGameUtils } from "@frameworks/utils/sdk/MiniGameUtils";
import { CompPlayerHead } from "./CompPlayerHead";
import { CompPlayers } from "./CompPlayers";
import {
    SprotoForwardMessage,
    SprotoGameClock,
    SprotoGameEnd,
    SprotoGameRecord,
    SprotoGameRelink,
    SprotoGameStart,
    SprotoItemEffect,
    SprotoLogicInfo,
    SprotoMapData,
    SprotoPlayerEnter,
    SprotoPlayerFinished,
    SprotoPlayerInfos,
    SprotoPlayerLeave,
    SprotoPlayerStatusUpdate,
    SprotoPrivateInfo,
    SprotoProgressUpdate,
    SprotoRoomEnd,
    SprotoRoomInfo,
    SprotoStepId,
    SprotoTilesRemoved,
    SprotoTotalResult,
} from "../../../../../../types/protocol/game10002/s2c";
import {
    SprotoClientReady,
    SprotoGameReady,
    SprotoLeaveRoom,
    SprotoUseItem,
    SprotoVoteDisbandRoom,
    SprotoOwnerStartGame,
} from "../../../../../../types/protocol/game10002/c2s";
import { SprotoGameRoomReady } from "../../../../../../types/protocol/lobby/s2c";
import { TALK_LIST, FORWARD_MESSAGE_TYPE } from "../../talk/TalkConfig";
import { TalkView } from "../../talk/TalkView";
import { CompMap } from "./CompMap";
import { LineSegment } from "../../../logic/TileMapData";
import FGUICompMedal from "@fgui/gameCommon/FGUICompMedal";
import { Logger } from "@frameworks/utils/Utils";

/**
 * 游戏主体组件
 */
@ViewClass({ curveScreenAdapt: true })
export class CompGameMain extends FGUICompGameMain {
    public UI_COMP_SELF_MEDAL: FGUICompMedal;
    /**
     * 组件构造完成时的初始化
     */
    onConstruct() {
        super.onConstruct();
        this.init();
        this.initListeners();

        // 默认隐藏时钟组件，收到时钟协议后再显示
        this.UI_COMP_CLOCK.visible = false;

        // 客户端进入完成
        if (GameData.instance.isPrivateRoom) {
            this.ctrl_roomtype.selectedIndex = ROOM_TYPE.PRIVATE;
        }

        // 延迟发送客户端进入完成
        this.scheduleOnce(() => {
            GameSocketManager.instance.sendToServer(SprotoClientReady, {});
        }, 0);
    }

    /**
     * 初始化游戏数据
     */
    init() {
        GameData.instance.init();
        GameData.instance.maxPlayer = 2;
        if (DataCenter.instance.shortRoomid) {
            GameData.instance.isPrivateRoom = true;
        }

        //this.testRandomMap();
    }

    /**
     * 测试随机地图
     * 生成10x10地图，最外圈为空，内部随机填充1-max的方块（确保成对出现）
     */
    testRandomMap() {
        const rows = 10;
        const cols = 10;
        const map: number[][] = [];

        // 初始化地图（全部设为0）
        for (let i = 0; i < rows; i++) {
            map[i] = new Array(cols).fill(0);
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
        for (let row = 1; row < rows - 1; row++) {
            for (let col = 1; col < cols - 1; col++) {
                map[row][col] = pairs[index++];
            }
        }

        // 初始化地图组件
        (this.UI_COMP_MAP as CompMap).initMap(map, "resFruit");
        Logger.log("随机地图生成完成", map);
    }

    /**
     * 初始化所有服务器消息监听器
     */
    initListeners() {
        GameSocketManager.instance.addServerListen(SprotoRoomInfo, this.onRoomInfo.bind(this));
        GameSocketManager.instance.addServerListen(SprotoRoomEnd, this.onRoomEnd.bind(this));
        GameSocketManager.instance.addServerListen(SprotoPlayerInfos, this.onSvrPlayerInfos.bind(this));
        GameSocketManager.instance.addServerListen(SprotoGameStart, this.onSvrGameStart.bind(this));
        GameSocketManager.instance.addServerListen(SprotoGameEnd, this.onSvrGameEnd.bind(this));
        GameSocketManager.instance.addServerListen(SprotoPlayerEnter, this.onSvrPlayerEnter.bind(this));
        GameSocketManager.instance.addServerListen(SprotoPlayerStatusUpdate, this.onSvrPlayerStatusUpdate.bind(this));
        GameSocketManager.instance.addServerListen(SprotoPlayerLeave, this.onSvrPlayerLeave.bind(this));
        GameSocketManager.instance.addServerListen(SprotoGameClock, this.onSvrGameClock.bind(this));
        GameSocketManager.instance.addServerListen(SprotoPrivateInfo, this.onSvrPrivateInfo.bind(this));
        GameSocketManager.instance.addServerListen(SprotoTotalResult, this.onSvrTotalResult.bind(this));
        GameSocketManager.instance.addServerListen(SprotoGameRecord, this.onSvrGameRecord.bind(this));
        GameSocketManager.instance.addServerListen(SprotoForwardMessage, this.onSvrForwardMessage.bind(this));
        GameSocketManager.instance.addServerListen(SprotoStepId, this.onSvrStepId.bind(this));
        // 连连看游戏协议
        GameSocketManager.instance.addServerListen(SprotoLogicInfo, this.onSvrLogicInfo.bind(this));
        GameSocketManager.instance.addServerListen(SprotoMapData, this.onSvrMapData.bind(this));
        GameSocketManager.instance.addServerListen(SprotoTilesRemoved, this.onSvrTilesRemoved.bind(this));
        GameSocketManager.instance.addServerListen(SprotoPlayerFinished, this.onSvrPlayerFinished.bind(this));
        GameSocketManager.instance.addServerListen(SprotoGameRelink, this.onSvrGameRelink.bind(this));
        GameSocketManager.instance.addServerListen(SprotoProgressUpdate, this.onSvrProgressUpdate.bind(this));
        GameSocketManager.instance.addServerListen(SprotoItemEffect, this.onSvrItemEffect.bind(this));
        LobbySocketManager.instance.addServerListen(SprotoGameRoomReady, this.onSvrGameRoomReady.bind(this));
        AddEventListener(FW_EVENT_NAMES.GAME_SOCKET_DISCONNECT, this.onGameSocketDisconnect, this);
    }

    /**
     * 组件销毁时的清理
     */
    onDestroy() {
        super.onDestroy();
        this.removeListeners();
    }

    /**
     * 移除所有服务器消息监听器
     */
    removeListeners(): void {
        GameSocketManager.instance.removeServerListen(SprotoRoomInfo);
        GameSocketManager.instance.removeServerListen(SprotoRoomEnd);
        GameSocketManager.instance.removeServerListen(SprotoPlayerInfos);
        GameSocketManager.instance.removeServerListen(SprotoGameStart);
        GameSocketManager.instance.removeServerListen(SprotoGameEnd);
        GameSocketManager.instance.removeServerListen(SprotoPlayerEnter);
        GameSocketManager.instance.removeServerListen(SprotoPlayerStatusUpdate);
        GameSocketManager.instance.removeServerListen(SprotoPlayerLeave);
        GameSocketManager.instance.removeServerListen(SprotoGameClock);
        GameSocketManager.instance.removeServerListen(SprotoPrivateInfo);
        GameSocketManager.instance.removeServerListen(SprotoTotalResult);
        GameSocketManager.instance.removeServerListen(SprotoGameRecord);
        GameSocketManager.instance.removeServerListen(SprotoForwardMessage);
        GameSocketManager.instance.removeServerListen(SprotoStepId);
        // 连连看游戏协议
        GameSocketManager.instance.removeServerListen(SprotoLogicInfo);
        GameSocketManager.instance.removeServerListen(SprotoMapData);
        GameSocketManager.instance.removeServerListen(SprotoTilesRemoved);
        GameSocketManager.instance.removeServerListen(SprotoPlayerFinished);
        GameSocketManager.instance.removeServerListen(SprotoGameRelink);
        GameSocketManager.instance.removeServerListen(SprotoProgressUpdate);
        GameSocketManager.instance.removeServerListen(SprotoItemEffect);
        LobbySocketManager.instance.removeServerListen(SprotoGameRoomReady);
        RemoveEventListener(FW_EVENT_NAMES.GAME_SOCKET_DISCONNECT, this.onGameSocketDisconnect);
    }

    /**
     * 服务器消息转发处理
     * @param data 转发消息数据
     */
    onSvrForwardMessage(data: SprotoForwardMessage.Request) {
        Logger.log(data);
        this.forwardMessage(data);
    }

    /**
     * 步骤ID处理
     * @param data 步骤ID数据
     */
    onSvrStepId(data: SprotoStepId.Request) {
        GameData.instance.gameStep = data.step;
    }

    /**
     * 游戏记录处理
     * @param data 游戏记录数据
     */
    onSvrGameRecord(data: any) {
        GameData.instance.record = data;
    }

    /**
     * 总结果处理
     * @param data 总结果数据
     */
    onSvrTotalResult(data: SprotoTotalResult.Request) {
        const time = 1;
        this.scheduleOnce(() => {
            TotalResultView.showView(data);
        }, time);
    }

    /**
     * 私人房信息处理
     * @param data 私人房数据
     */
    onSvrPrivateInfo(data: any) {
        if (!data) {
            return;
        }
        if (GameData.instance.isPrivateRoom) {
            if (data.maxCnt === 9999) {
                this.UI_COMP_PRIVITE_INFO.UI_TXT_PROGRESS.text = `第${data.nowCnt ?? 0}局 无限局`;
            } else {
                this.UI_COMP_PRIVITE_INFO.UI_TXT_PROGRESS.text = `第${data.nowCnt ?? 0}局 共${data.maxCnt ?? 0}局`;
            }
            GameData.instance.privateMaxCnt = data.maxCnt;
            GameData.instance.privateNowCnt = data.nowCnt;

            //this.UI_COMP_PRIVITE_INFO.UI_TXT_RULE.text = `${GAME_MODE_TXT[data.mode]}`
            this.showWinLost(JSON.parse(data.ext));

            this.checkShowStartGameBtn();
        }
    }

    /**
     * 显示胜负战绩
     * @param data 胜负数据
     */
    showWinLost(data: any): void {
        if (!data || data.length === 0) return;
        for (let index = 0; index < data.length; index++) {
            const element = data[index];
            const svrSeat = index + 1; // 服务器座位号从1开始
            const selfSeat = GameData.instance.getSelfSeat();

            if (svrSeat === selfSeat) {
                // 自己，使用 UI_COMP_SELFPLAYER
                const selfPlayer = this.UI_COMP_SELFPLAYER as CompPlayerHead;
                if (selfPlayer) {
                    selfPlayer.setWinLost(element.win);
                }
            } else {
                // 其他玩家，使用 UI_COMP_PLAYERS 列表
                const compPlayers = this.UI_COMP_PLAYERS as CompPlayers;
                const otherPlayer = compPlayers?.getOtherPlayer(svrSeat);
                if (otherPlayer) {
                    otherPlayer.getHeadComponent()?.setWinLost(element.win);
                }
            }
        }
    }

    /**
     * 游戏断开连接处理
     */
    onGameSocketDisconnect(): void {
        if (!GameData.instance.gameStart) {
            return;
        }
        PopMessageView.showView({
            content: "游戏已断开，返回大厅",
            type: ENUM_POP_MESSAGE_TYPE.NUM1SURE,
            sureBack: () => {
                this.changeToLobbyScene();
            },
        });
    }

    /**
     * 显示或隐藏倒计时
     * @param bshow 是否显示
     * @param clock 倒计时时间
     */
    showClock(bshow: boolean, clock?: number): void {
        const compTimeLeft = this.UI_COMP_CLOCK as CompTimeLeft;
        if (bshow) {
            if (clock && clock > 0) {
                const totalTime = GameData.instance.playingStepTime || clock;
                compTimeLeft.visible = true;
                compTimeLeft.start(clock, totalTime);
            }
        } else {
            compTimeLeft.visible = false;
            compTimeLeft.stop();
        }
    }

    // 处理转发协议
    forwardMessage(data: SprotoForwardMessage.Request) {
        const type = data.type;

        switch (type) {
            case FORWARD_MESSAGE_TYPE.TALK:
                // 处理聊天消息
                Logger.log("[聊天] 收到消息转发:", data);
                try {
                    const talkData = JSON.parse(data.msg);
                    Logger.log("[聊天] 解析后的数据:", talkData);
                    if (talkData && talkData.id) {
                        Logger.log("[聊天] 显示聊天，from:", data.from, "id:", talkData.id);
                        this.showTalk({
                            from: data.from,
                            id: talkData.id,
                        });
                    } else {
                        Logger.warn("[聊天] talkData.id 不存在:", talkData);
                    }
                } catch (e) {
                    Logger.error("[聊天] 解析聊天消息失败:", e);
                }
                break;
            default:
                Logger.log("未处理的消息转发类型:", type);
                break;
        }
    }

    /**
     * 显示聊天消息
     * @param data 聊天数据
     */
    showTalk(data: { from: number; id: number }): void {
        Logger.log("[聊天] showTalk 被调用:", data);
        const id = data.id;
        const userid = data.from;
        Logger.log("[聊天] 查找玩家 userid:", userid);
        const player = GameData.instance.getPlayerByUserid(userid);
        if (!player) {
            Logger.warn("[聊天] 未找到玩家 userid:", userid);
            return;
        }
        Logger.log("[聊天] 找到玩家:", player.nickname);
        const talkData = TALK_LIST.find((item) => item.id == id);
        if (!talkData) {
            Logger.warn("[聊天] 未找到聊天配置 id:", id);
            return;
        }
        Logger.log("[聊天] 显示消息:", talkData.msg);

        const selfid = DataCenter.instance.userid;
        if (userid === selfid) {
            // 自己，使用 UI_COMP_SELFPLAYER
            const selfPlayer = this.UI_COMP_SELFPLAYER as CompPlayerHead;
            if (selfPlayer) {
                selfPlayer.showMsg(talkData.msg);
            }
        } else {
            // 其他玩家，使用 UI_COMP_PLAYERS 列表
            Logger.log("[聊天] 处理其他玩家消息，svrSeat:", player.svrSeat);
            const compPlayers = this.UI_COMP_PLAYERS as CompPlayers;
            Logger.log("[聊天] compPlayers:", compPlayers ? "存在" : "不存在");
            const otherPlayer = compPlayers?.getOtherPlayer(player.svrSeat);
            Logger.log("[聊天] otherPlayer:", otherPlayer ? "存在" : "不存在");
            if (otherPlayer) {
                const headComp = otherPlayer.getHeadComponent();
                Logger.log("[聊天] headComponent:", headComp ? "存在" : "不存在");
                if (headComp) {
                    headComp.showMsg(talkData.msg);
                    Logger.log("[聊天] 消息已显示");
                } else {
                    Logger.warn("[聊天] headComponent 为空");
                }
            } else {
                Logger.warn("[聊天] 未找到其他玩家组件，svrSeat:", player.svrSeat);
            }
        }
    }

    /**
     * 游戏逻辑信息处理
     * @param data 逻辑信息数据
     */
    onSvrLogicInfo(data: any): void {
        Logger.log("游戏逻辑信息", data);
        if (data.playingStepTime !== undefined) {
            GameData.instance.playingStepTime = data.playingStepTime;
        }
    }

    /**
     * 游戏时钟处理
     * @param data 时钟数据
     */
    onSvrGameClock(data: any): void {
        if (data.time > 0) {
            this.showClock(true, data.time);
        } else {
            this.showClock(false);
        }
    }

    // ============================================
    // 连连看游戏协议处理
    // ============================================

    /**
     * 地图数据处理
     * @param data 地图数据
     */
    onSvrMapData(data: SprotoMapData.Request): void {
        Logger.log("地图数据", data);
        if (!data.mapData) {
            Logger.warn("地图数据为空");
            return;
        }

        try {
            const map = JSON.parse(data.mapData);
            const selfSeat = GameData.instance.getSelfSeat();

            // 保存地图数据到 GameData
            GameData.instance.setPlayerMapData(data.seat, map, data.totalBlocks, data.col, data.row);

            if (data.seat === selfSeat) {
                // 自己的地图，渲染到主地图
                const compMap = this.getCompMap();
                if (compMap) {
                    compMap.visible = true;
                    const scale = data.row <= 6 && data.col <= 6 ? 1.2 : 1.0;
                    compMap.node.setScale(scale, scale);
                    compMap.initMap(map, "resFruit");
                }
            } else {
                // 其他玩家的地图，渲染到对应的小地图
                this.updateOtherPlayerMap(data.seat, map);
            }
        } catch (e) {
            Logger.error("地图数据解析失败:", e);
        }
    }

    /**
     * 方块消除成功通知处理
     * @param data 消除数据
     */
    onSvrTilesRemoved(data: SprotoTilesRemoved.Request): void {
        Logger.log("方块消除", data);
        const selfSeat = GameData.instance.getSelfSeat();

        if (data.seat === selfSeat) {
            // 自己的消除，已经在本地处理过了，这里只需更新数据
            GameData.instance.updatePlayerMapTilesRemoved(data.seat, data.p1.row, data.p1.col, data.p2.row, data.p2.col);
        } else {
            // 其他玩家的消除，需要在对应的小地图上显示消除效果
            const compPlayers = this.UI_COMP_PLAYERS as CompPlayers;

            if (compPlayers) {
                // 使用更新后的方法，传递连线数据
                compPlayers.removeOtherPlayerTiles(data.seat, data.p1, data.p2, data.lines as LineSegment[]);
            }

            // 更新数据中的地图
            GameData.instance.updatePlayerMapTilesRemoved(data.seat, data.p1.row, data.p1.col, data.p2.row, data.p2.col);
        }
    }

    /**
     * 玩家完成游戏处理
     * @param data 完成数据
     */
    onSvrPlayerFinished(data: any): void {
        Logger.log("玩家完成", data);
        const selfSeat = GameData.instance.getSelfSeat();

        if (data.seat === selfSeat) {
            // 自己完成，显示排名奖牌和完成信息
            Logger.log(`自己完成游戏，排名: ${data.rank}，用时: ${data.usedTime}秒`);
            if (this.UI_COMP_SELF_MEDAL && data.rank > 0) {
                this.UI_COMP_SELF_MEDAL.ctrl_rank.selectedIndex = data.rank;
            }
            // 显示完成信息组件
            const compFinshInfo = this.UI_COMP_FINSH_INFO as CompFinshInfo;
            if (compFinshInfo) {
                compFinshInfo.showFinishInfo(data.rank, data.usedTime);
            }
            // 使用控制器显示完成信息
            if (this.ctrl_finshInfo) {
                this.ctrl_finshInfo.selectedIndex = 1;
            }
        } else {
            // 其他玩家完成，更新完成状态显示和名次
            const compPlayers = this.UI_COMP_PLAYERS as CompPlayers;
            if (compPlayers) {
                compPlayers.setOtherPlayerComplete(data.seat, true);
                // 设置名次，服务器返回的rank从1开始
                compPlayers.setOtherPlayerRank(data.seat, data.rank);
            }

            const player = GameData.instance.getPlayerBySeat(data.seat);
            if (player) {
                Logger.log(`玩家 ${player.nickname} 完成游戏，排名: ${data.rank}，用时: ${data.usedTime}秒`);
            }
        }
    }

    /**
     * 游戏重连恢复处理
     * @param data 重连数据
     */
    onSvrGameRelink(data: any): void {
        Logger.log("游戏重连", data);
        GameData.instance.gameStart = true;
        this.showStartGameBtn(false);
        this.showInviteBtn(false);
        // 地图数据通过 mapData 协议单独下发
        // 清除本地地图数据缓存，等待 mapData 协议重新下发所有玩家地图
        GameData.instance.clearAllPlayerMaps();
    }

    /**
     * 游戏进度更新处理
     * @param data 进度数据
     */
    onSvrProgressUpdate(data: any): void {
        const selfSeat = GameData.instance.getSelfSeat();
        if (data.seat === selfSeat) {
            // 自己的进度更新，不需要处理
            return;
        }

        const player = GameData.instance.getPlayerBySeat(data.seat);
        if (player) {
            // 更新其他玩家的进度显示
            Logger.log(`玩家 ${player.nickname} 进度: ${data.percentage}%，剩余: ${data.remaining}`);
            // TODO: 后续服务器完善接口后，可以更新其他玩家的地图
            // this.updateOtherPlayerMap(data.seat, mapData);
        }
    }

    /**
     * 更新其他玩家地图（预留接口）
     * @param svrSeat 服务器座位号
     * @param mapData 地图数据
     */
    updateOtherPlayerMap(svrSeat: number, mapData: number[][]): void {
        const compPlayers = this.UI_COMP_PLAYERS as CompPlayers;
        if (compPlayers) {
            compPlayers.updateOtherPlayerMap(svrSeat, mapData);
        }
    }

    /**
     * 移除其他玩家的方块（预留接口）
     * @param svrSeat 服务器座位号
     * @param p1 第一个方块坐标
     * @param p2 第二个方块坐标
     */
    removeOtherPlayerTiles(svrSeat: number, p1: any, p2: any): void {
        const compPlayers = this.UI_COMP_PLAYERS as CompPlayers;
        if (compPlayers) {
            compPlayers.removeOtherPlayerTiles(svrSeat, p1, p2);
        }
    }

    /**
     * 道具效果通知处理
     * @param data 道具效果数据
     */
    onSvrItemEffect(data: any): void {
        Logger.log("道具效果", data);
        // 预留：处理道具效果
    }

    /**
     * 清除游戏状态
     */
    clear(): void {
        this.ctrl_btn.selectedIndex = CTRL_BTN_INDEX.NONE;
        // 隐藏完成信息组件
        if (this.ctrl_finshInfo) {
            this.ctrl_finshInfo.selectedIndex = 0;
        }
        // 重置完成信息组件
        const compFinshInfo = this.UI_COMP_FINSH_INFO as CompFinshInfo;
        if (compFinshInfo) {
            compFinshInfo.reset();
        }
        // 清理自己的奖牌
        if (this.UI_COMP_SELF_MEDAL) {
            this.UI_COMP_SELF_MEDAL.ctrl_rank.selectedIndex = 0;
        }
    }

    /**
     * 继续游戏按钮处理
     */
    onBtnContinue(): void {
        if (GameData.instance.gameStart) {
            return;
        }

        // 清理其他玩家组件
        const compPlayers = this.UI_COMP_PLAYERS as CompPlayers;
        if (compPlayers) {
            if (GameData.instance.isPrivateRoom) {
                // 私人房：只重置状态，不清空列表（第二局不下发头像信息）
                compPlayers.resetAllPlayers();
            } else {
                // 匹配房：直接清空列表
                compPlayers.clear();
            }
        }
        // 隐藏计时器
        this.UI_COMP_CLOCK.visible = false;

        if (GameData.instance.isPrivateRoom) {
            this.onBtnReady();
        } else {
            this.startMatch();
        }
    }

    /**
     * 开始匹配
     */
    startMatch() {
        const func = (b: boolean, data?: any) => {
            if (b) {
                // 显示匹配view
                MatchView.showView();
            } else {
                if (data && data.gameid && data.roomid) {
                    const func2 = () => {
                        //返回房间
                    };
                    PopMessageView.showView({
                        title: "温馨提示",
                        content: "您已经在房间中，是否返回？",
                        type: ENUM_POP_MESSAGE_TYPE.NUM2,
                        sureBack: func2,
                    });
                }
            }
        };
        Match.instance.req(0, func);
    }

    /**
     * 连接到游戏服务器
     * @param addr 游戏服务器地址
     * @param gameid 游戏ID
     * @param roomid 房间ID
     */
    connectToGame(addr: string, gameid: number, roomid: string) {
        const callBack = (success: boolean) => {
            if (success) {
                //this.changeToGameScene()
                this.clear();
                this.init();
                GameSocketManager.instance.sendToServer(SprotoClientReady, {});
            }
        };
        AuthGame.instance.req(addr, gameid, roomid, callBack);
    }

    /**
     * 游戏房间准备就绪处理
     * @param data 房间数据
     */
    onSvrGameRoomReady(data: any): void {
        Logger.log("gameRoomReady", data);
        MatchView.hideView();
        DataCenter.instance.gameid = data.gameid;
        DataCenter.instance.roomid = data.roomid;
        DataCenter.instance.gameAddr = data.addr;
        DataCenter.instance.shortRoomid = 0; // 匹配房
        Logger.log(LogColors.green("游戏房间准备完成"));
        this.connectToGame(data.addr, data.gameid, data.roomid);
    }

    /**
     * 房间结束处理
     * @param data 结束数据
     */
    onRoomEnd(data: any): void {
        GameData.instance.roomEnd = true;
        const msg = "房间销毁";
        if (data.code == ROOM_END_FLAG.GAME_END) {
            Logger.log("游戏结束 " + msg);
        } else if (data.code == ROOM_END_FLAG.OUT_TIME_WAITING) {
            Logger.log("等待超时 " + msg);
            PopMessageView.showView({
                content: "等待超时",
                type: ENUM_POP_MESSAGE_TYPE.NUM1SURE,
                sureBack: () => {
                    this.changeToLobbyScene();
                },
                closeBack: () => {
                    this.changeToLobbyScene();
                },
            });
        } else if (data.code == ROOM_END_FLAG.OUT_TIME_PLAYING) {
            Logger.log("游戏超时 " + msg);
            PopMessageView.showView({
                content: "游戏超时",
                type: ENUM_POP_MESSAGE_TYPE.NUM1SURE,
                sureBack: () => {
                    this.changeToLobbyScene();
                },
                closeBack: () => {
                    this.changeToLobbyScene();
                },
            });
        } else if (data.code == ROOM_END_FLAG.OWNER_DISBAND) {
            let endMsg = "房主已经解散房间";
            if (GameData.instance.owner == DataCenter.instance.userid) {
                endMsg = "您已经解散房间";
            }
            PopMessageView.showView({
                content: endMsg,
                type: ENUM_POP_MESSAGE_TYPE.NUM1SURE,
                sureBack: () => {
                    this.changeToLobbyScene();
                },
                closeBack: () => {
                    this.changeToLobbyScene();
                },
            });
        } else if (data.code == ROOM_END_FLAG.VOTE_DISBAND) {
            Logger.log("投票解散 " + msg);
            //this.onBtnClose()
        }
    }

    /**
     * 玩家信息处理
     * @param data 玩家信息数据
     */
    onSvrPlayerInfos(data: SprotoPlayerInfos.Request): void {
        Logger.log("onSvrPlayerInfos", data);
        const selfid = DataCenter.instance.userid;
        for (let i = 0; i < data.infos.length; i++) {
            const info = data.infos[i];
            const player: GAME_PLAYER_INFO = {
                nickname: info.nickname,
                headurl: info.headurl,
                sex: info.sex,
                province: info.province,
                city: info.city,
                ext: info.ext,
                ip: info.ip,
                status: info.status,
                cp: info.cp ?? 0,
                svrSeat: i + 1,
                userid: info.userid,
            };

            GameData.instance.addPlayer(player);

            // 更新玩家信息

            if (player) {
                if (info.userid === selfid) {
                    // 自己，更新自己的头像
                    this.showPlayerInfoBySeat(player.svrSeat);
                } else {
                    // 其他玩家，更新列表中的头像
                    this.updateOtherPlayerHead(player.svrSeat, player);
                }
            }
        }
    }

    /**
     * 更新其他玩家头像
     * @param localSeat 本地座位号
     * @param player 玩家信息
     */
    updateOtherPlayerHead(localSeat: number, player: any): void {
        const compPlayers = this.UI_COMP_PLAYERS as CompPlayers;
        if (!compPlayers) return;

        const headurl = GameData.instance.getHeadurlByUserid(player.userid);
        if (compPlayers.hasPlayer(localSeat)) {
            // 已存在，更新信息
            compPlayers.updateOtherPlayerHead(localSeat, player, headurl);
        }
        // 如果不存在，等待 onSvrPlayerEnter 时创建
    }

    /**
     * 游戏开始处理
     * @param data 游戏开始数据
     */
    onSvrGameStart(data: any): void {
        GameData.instance.gameStart = true;

        // 隐藏开始,邀请游戏按钮
        if (GameData.instance.isPrivateRoom) {
            this.showStartGameBtn(false);
            this.showInviteBtn(false);
        }

        // 非重连情况
        if (!data.brelink) {
            this.UI_COMP_GAME_START.visible = true;
            this.UI_COMP_GAME_START.act.play(() => {
                this.UI_COMP_GAME_START.visible = false;
            });

            // 第几回合
            this.clear();
        }

        for (let index = 0; index < GameData.instance.maxPlayer; index++) {
            this.showSignReady(index + 1, false);
        }
    }

    /**
     * 游戏结束处理
     * @param data 游戏结束数据
     */
    onSvrGameEnd(data: SprotoGameEnd.Request): void {
        GameData.instance.gameStart = false;

        // 停止倒计时
        const compTimeLeft = this.UI_COMP_CLOCK as CompTimeLeft;
        if (compTimeLeft) {
            compTimeLeft.stop();
        }

        // 处理连连看游戏结束数据
        if (data.rankings && data.rankings.length > 0) {
            // 处理未完成的其他玩家
            const completedSeats = data.rankings.filter((r: any) => r.usedTime >= 0).map((r: any) => r.seat);

            // 设置所有未完成玩家状态
            const compPlayers = this.UI_COMP_PLAYERS as CompPlayers;
            if (compPlayers) {
                compPlayers.setAllPlayersIncomplete(completedSeats);
            }

            // 组装用户数据
            const scoreData = data.rankings.map((rank: any) => {
                const key = data.rankings.indexOf(rank);
                const player = GameData.instance.getPlayerBySeat(rank.seat);
                const headurl = GameData.instance.getHeadurlByUserid(player.userid);
                return {
                    userid: player?.userid ?? 0,
                    nickname: player?.nickname ?? "",
                    usedTime: rank.usedTime,
                    eliminated: rank.eliminated,
                    rank: rank.rank,
                    headurl: headurl,
                    score: data.scores[key].delta,
                    maxComb: rank.maxCombo,
                };
            });

            scoreData.sort((a: any, b: any) => {
                if (a.usedTime == -1) {
                    return 1;
                }
                if (b.usedTime == -1) {
                    return -1;
                }
                return a.rank - b.rank;
            });

            const func = () => {
                this.onBtnContinue();
            };

            this.scheduleOnce(() => {
                // 显示结果界面
                ResultView.showView({
                    continueFunc: func,
                    scores: scoreData,
                });
            }, 0.3);
        }

        UserStatus.instance.req();

        // 显示继续游戏
        if (GameData.instance.isPrivateRoom) {
            this.ctrl_btn.selectedIndex = CTRL_BTN_INDEX.NONE;
        } else {
            this.ctrl_btn.selectedIndex = CTRL_BTN_INDEX.CONTINUE;
        }
    }

    /**
     * 玩家进入处理
     * @param data 进入数据
     */
    onSvrPlayerEnter(data: any): void {
        const selfid = DataCenter.instance.userid;
        const svrSeat = data.seat;
        const userid = data.userid;
        const playerInfo = GameData.instance.getPlayerByUserid(userid);
        if (playerInfo) {
            if (selfid == userid) {
                // 设置自己的服务器座位号
                GameData.instance.setSelfSeat(svrSeat);
                // 自己使用 UI_COMP_SELFPLAYER
                this.showPlayerInfoBySeat(svrSeat);
            } else {
                // 其他玩家使用 UI_COMP_PLAYERS 列表
                this.addOtherPlayer(svrSeat, playerInfo);
            }

            if (GameData.instance.isPrivateRoom) {
                if (playerInfo.status == PLAYER_STATUS.ONLINE && selfid == userid) {
                    // 房主在第一局开始前(privateNowCnt=0)不显示准备按钮
                    const isOwner = GameData.instance.owner === selfid;
                    if (!isOwner || GameData.instance.privateNowCnt > 0) {
                        this.ctrl_btn.selectedIndex = CTRL_BTN_INDEX.READY;
                    }
                }

                this.checkShowInviteBtn();
                this.checkShowStartGameBtn();
            }
        }
    }

    /**
     * 添加其他玩家到列表
     * @param svrSeat 服务器座位号
     * @param playerInfo 玩家信息
     */
    addOtherPlayer(svrSeat: number, playerInfo: any): void {
        const compPlayers = this.UI_COMP_PLAYERS as CompPlayers;
        if (!compPlayers) {
            Logger.error("UI_COMP_PLAYERS 组件不存在");
            return;
        }
        const headurl = GameData.instance.getHeadurlByUserid(playerInfo.userid);
        compPlayers.addOtherPlayer(svrSeat, playerInfo, headurl);
    }

    /**
     * 玩家状态更新处理
     * @param data 状态数据
     */
    onSvrPlayerStatusUpdate(data: any): void {
        const selfid = DataCenter.instance.userid;
        const player = GameData.instance.getPlayerByUserid(data.userid);
        if (!player) return;

        player.status = data.status;

        if (data.userid === selfid) {
            // 自己状态更新
            this.showPlayerInfoBySeat(player.svrSeat);
            if (data.status == PLAYER_STATUS.ONLINE) {
                // 房主在第一局开始前(privateNowCnt=0)不显示准备按钮
                const isOwner = GameData.instance.owner === selfid;
                if (!isOwner || GameData.instance.privateNowCnt > 0) {
                    this.ctrl_btn.selectedIndex = CTRL_BTN_INDEX.READY;
                }
            }
        } else {
            // 其他玩家状态更新
            const compPlayers = this.UI_COMP_PLAYERS as CompPlayers;
            const otherPlayer = compPlayers?.getOtherPlayer(player.svrSeat);
            if (otherPlayer) {
                const headurl = GameData.instance.getHeadurlByUserid(player.userid);
                otherPlayer.updatePlayerInfo(player, headurl);
            }
        }

        if (GameData.instance.isPrivateRoom) {
            this.checkShowStartGameBtn();
        }
    }

    /**
     * 根据座位显示玩家信息（仅用于自己）
     * @param svrSeat 服务器座位号
     */
    showPlayerInfoBySeat(svrSeat: number): void {
        if (svrSeat !== GameData.instance.getSelfSeat()) {
            Logger.warn("showPlayerInfoBySeat 仅用于自己，其他玩家请使用 CompPlayers");
            return;
        }
        const selfPlayer = this.UI_COMP_SELFPLAYER as CompPlayerHead;
        if (!selfPlayer) return;

        const player = GameData.instance.getPlayerBySeat(svrSeat);
        if (!player) return;

        const headurl = GameData.instance.getHeadurl(svrSeat);
        selfPlayer.updatePlayerInfo(player, true, headurl);
    }

    /**
     * 隐藏自己头像
     */
    hideSelfPlayer(): void {
        const selfPlayer = this.UI_COMP_SELFPLAYER as CompPlayerHead;
        if (selfPlayer) {
            selfPlayer.hide();
        }
    }

    /**
     * 玩家离开处理
     * @param data 离开数据
     */
    onSvrPlayerLeave(data: any): void {
        const selfid = DataCenter.instance.userid;
        const svrSeat = data.seat;
        const player = GameData.instance.getPlayerBySeat(svrSeat);

        if (player && player.userid === selfid) {
            // 自己离开
            GameData.instance.removePlayerBySeat(svrSeat);
            GameData.instance.setSelfSeat(0);
            this.hideSelfPlayer();
        } else {
            // 其他玩家离开，从列表中移除
            const compPlayers = this.UI_COMP_PLAYERS as CompPlayers;
            if (compPlayers) {
                compPlayers.removeOtherPlayer(svrSeat);
            }
            GameData.instance.removePlayerBySeat(svrSeat);
        }

        this.checkShowInviteBtn();
        this.checkShowStartGameBtn();
    }

    /**
     * 房间信息处理
     * @param data 房间数据
     */
    onRoomInfo(data: any): void {
        Logger.log(data);
        GameData.instance.owner = data.owner;
        // 展示好友房信息
        if (data.shortRoomid) {
            const shortRoomid = `${data.shortRoomid}`;
            this.UI_COMP_PRIVITE_INFO.UI_TXT_ROOMID.text = "房间号:" + shortRoomid.padStart(6, "0");
        }

        if (GameData.instance.isPrivateRoom && data.gameData && data.gameData != "") {
            const gameData = JSON.parse(data.gameData);
            if (gameData && gameData.rule != "") {
                const rule = JSON.parse(gameData.rule);
                if (rule.mode) {
                    this.UI_COMP_PRIVITE_INFO.UI_TXT_RULE.text = `${GAME_MODE_TXT[rule.mode]}`;
                } else {
                    this.UI_COMP_PRIVITE_INFO.UI_TXT_RULE.text = "排名模式";
                }

                // 重新赋值房间人数
                GameData.instance.maxPlayer = rule.playerCnt;
            }
        } else {
            GameData.instance.maxPlayer = data.playerids.length ?? 2;
        }

        this.checkShowStartGameBtn();
    }

    /**
     * 显示准备标识
     * @param svrSeat 服务器座位号
     * @param bshow 是否显示
     */
    showSignReady(svrSeat: number, bshow: boolean): void {
        if (svrSeat === GameData.instance.getSelfSeat()) {
            // 自己，使用 UI_COMP_SELFPLAYER
            const selfPlayer = this.UI_COMP_SELFPLAYER as CompPlayerHead;
            if (selfPlayer) {
                selfPlayer.showSignReady(bshow);
            }
        } else {
            // 其他玩家，使用 UI_COMP_PLAYERS 列表
            const compPlayers = this.UI_COMP_PLAYERS as CompPlayers;
            const otherPlayer = compPlayers?.getOtherPlayer(svrSeat);
            if (otherPlayer) {
                otherPlayer.getHeadComponent()?.showSignReady(bshow);
            }
        }
    }

    /**
     * 切换到大厅场景
     */
    changeToLobbyScene(): void {
        if (GameSocketManager.instance.isOpen()) {
            GameSocketManager.instance.close();
        }
        ChangeScene("LobbyScene");
    }

    /**
     * 返回按钮处理
     */
    onBtnBack(): void {
        // 如果房间的socket已经断开，直接退出
        if (!GameSocketManager.instance.isOpen()) {
            return this.changeToLobbyScene();
        }
        // 私人房退出 需要发送协议
        if (GameData.instance.isPrivateRoom) {
            if (!GameData.instance.roomEnd) {
                if (GameData.instance.gameStart) {
                    Logger.log("游戏中无法退出");
                } else {
                    GameSocketManager.instance.sendToServer(SprotoLeaveRoom, { flag: 1 });
                }
            }
        }

        if (GameData.instance.gameStart) {
            PopMessageView.showView({
                type: ENUM_POP_MESSAGE_TYPE.NUM1SURE,
                content: "游戏进行中，无法返回",
            });
        } else {
            this.changeToLobbyScene();
        }
    }

    /**
     * 准备按钮处理
     */
    onBtnReady(): void {
        const func = (res: any) => {
            if (res.code) {
                Logger.log(res.msg);
                //this.UI_BTN_READY.visible = false;
                this.ctrl_btn.selectedIndex = CTRL_BTN_INDEX.NONE;
            }
        };
        GameSocketManager.instance.sendToServer(SprotoGameReady, { ready: 1 }, func);
        this.clear();
    }

    /**
     * 使用道具
     * @param itemId 道具ID (1:重排, 2:提示, 3:加时等)
     */
    sendUseItem(itemId: number): void {
        GameSocketManager.instance.sendToServer(
            SprotoUseItem,
            {
                itemId: itemId,
            },
            (response: any) => {
                if (response && response.code === 1) {
                    Logger.log("使用道具成功:", itemId);
                } else {
                    Logger.error("使用道具失败:", response?.msg || "未知错误");
                }
            }
        );
    }

    /**
     * 开始解散房间投票
     */
    startDisband(): void {
        // 发起解散房间投票请求
        const data = {
            reason: "玩家发起解散", // 解散原因（可选）
        };

        GameSocketManager.instance.sendToServer(SprotoVoteDisbandRoom, data, (response: any) => {
            if (response && response.code === 1) {
                Logger.log("发起解散投票成功");
            } else {
                Logger.error("发起解散投票失败:", response?.msg || "未知错误");
            }
        });
    }

    /**
     * 解散房间按钮处理
     */
    onBtnDisband(): void {
        // 如果房间的socket已经断开，直接退出
        if (!GameSocketManager.instance.isOpen()) {
            return this.changeToLobbyScene();
        }
        if (GameData.instance.owner == DataCenter.instance.userid) {
            if (GameData.instance.gameStart || GameData.instance.privateNowCnt > 0) {
                this.startDisband();
            } else {
                PopMessageView.showView({
                    content: "解散后将无法返回此房间",
                    type: ENUM_POP_MESSAGE_TYPE.NUM1SURE,
                    sureBack: () => {
                        this.startDisband();
                    },
                });
            }
        } else {
            if (GameData.instance.gameStart || GameData.instance.privateNowCnt > 0) {
                this.startDisband();
            } else {
                PopMessageView.showView({
                    type: ENUM_POP_MESSAGE_TYPE.NUM1SURE,
                    content: "非房主只能在游戏开始后，发起解散",
                });
            }
        }
    }

    /**
     * 显示邀请按钮
     * @param bshow 是否显示
     */
    showInviteBtn(bshow: boolean): void {
        this.UI_BTN_INVITE.visible = bshow;
        //this.UI_BTN_INVITE.visible = false;
    }

    /**
     * 检测是否显示邀请按钮
     * @param bshow
     */
    checkShowInviteBtn(): void {
        if (!GameData.instance.isPrivateRoom) {
            this.showInviteBtn(false);
            return;
        }

        if (GameData.instance.gameStart) {
            this.showInviteBtn(false);
            return;
        }

        if (GameData.instance.privateNowCnt > 0) {
            this.showInviteBtn(false);
            return;
        }

        const playerCnt = GameData.instance.getPlayerCnt();
        if (playerCnt >= GameData.instance.maxPlayer) {
            this.showInviteBtn(false);
            return;
        }
        this.showInviteBtn(true);
    }

    /**
     * 显示开始游戏按钮
     * @param bshow 是否显示
     */
    showStartGameBtn(bshow: boolean): void {
        this.UI_BTN_START_GAME.visible = bshow;
    }

    /**
     * 检测是否显示开始游戏按钮
     * 显示条件：好友房、房主、游戏未开始、privateNowCnt = 0
     */
    checkShowStartGameBtn(): void {
        if (!GameData.instance.isPrivateRoom) {
            this.showStartGameBtn(false);
            return;
        }

        if (GameData.instance.owner !== DataCenter.instance.userid) {
            this.showStartGameBtn(false);
            return;
        }

        if (GameData.instance.gameStart) {
            this.showStartGameBtn(false);
            return;
        }

        if (GameData.instance.privateNowCnt > 0) {
            this.showStartGameBtn(false);
            return;
        }

        this.showStartGameBtn(true);
    }

    /**
     * 开始游戏按钮处理
     */
    onBtnStartGame(): void {
        GameSocketManager.instance.sendToServer(SprotoOwnerStartGame, {}, (response: any) => {
            if (response) {
                if (response.code === 1) {
                    Logger.log("开始游戏成功");
                } else if (response.code === 0) {
                    if (response.notReadyUserids && response.notReadyUserids.length > 0) {
                        const nicknames: string[] = [];
                        for (const userid of response.notReadyUserids) {
                            const player = GameData.instance.getPlayerByUserid(userid);
                            if (player && player.nickname) {
                                nicknames.push(player.nickname);
                            }
                        }
                        if (nicknames.length > 0) {
                            PopMessageView.showView({
                                content: `${nicknames.join("，")} 未准备，无法开始游戏`,
                                type: ENUM_POP_MESSAGE_TYPE.NUM1SURE,
                            });
                        }
                    } else if (response.msg) {
                        PopMessageView.showView({
                            content: response.msg,
                            type: ENUM_POP_MESSAGE_TYPE.NUM1SURE,
                        });
                    }
                }
            }
        });
    }

    /**
     * 绘制邀请图片
     * @returns 图片路径
     */
    async drawInviteInfo(): Promise<string> {
        return new Promise<string>(async (resolve, reject) => {
            // 邀请好友
            const bgUrl = "https://qiudaoyu-miniapp.oss-cn-hangzhou.aliyuncs.com/share/10002/invite.jpg";
            const width = 776;
            const height = 621;
            const bg = await MiniGameUtils.instance.loadImage(bgUrl);
            const canvas = MiniGameUtils.instance.getCanvas();
            if (!canvas) {
                reject();
                return;
            }
            canvas.width = width;
            canvas.height = height;
            const canvasContext = MiniGameUtils.instance.getCanvasContext();
            if (!canvasContext) {
                reject();
                return;
            }

            canvasContext.globalCompositeOperation = "source-over";
            canvasContext.clearRect(0, 0, width, height);
            canvasContext.drawImage(bg, 0, 0, width, height);

            const head = await MiniGameUtils.instance.loadImage(DataCenter.instance.headurl);
            const headWidth = 160;
            const headHeight = 160;
            canvasContext.drawImage(head, width * 0.1, height * 0.7, headWidth, headHeight);

            canvasContext.font = "bold 36px Arial";
            canvasContext.fillStyle = "#993300";
            canvasContext.textAlign = "left";
            canvasContext.fillText(DataCenter.instance.userData?.nickname || "", width * 0.1 + headWidth + 10, height * 0.8 + 10);
            canvasContext.fillText(`${DataCenter.instance.userid || 0}`, width * 0.1 + headWidth + 10, height * 0.8 + 50);
            MiniGameUtils.instance
                .makeCanvasImage({ filename: "invite" })
                .then((res: string) => {
                    Logger.log(res);
                    resolve(res);
                })
                .catch((err: any) => {
                    reject(err);
                });
        });
    }

    /**
     * 邀请好友
     */
    onBtnInvite(): void {
        this.drawInviteInfo()
            .then((res: string) => {
                MiniGameUtils.instance.shareAppMessage({
                    title: `房间号：${DataCenter.instance.shortRoomid} 点击加入 速来战`,
                    imageUrl: res,
                    query: `gameid=${10002}&roomid=${DataCenter.instance.shortRoomid}`,
                });
            })
            .catch((err: any) => {
                Logger.log(err);
            });
    }

    /**
     * 聊天
     */
    onBtnTalk(): void {
        TalkView.showView();
    }

    /**
     * 获取地图组件
     * @returns 地图组件
     */
    getCompMap(): CompMap {
        return this.UI_COMP_MAP as CompMap;
    }

    onBtnUpset(): void {
        
    }
}
fgui.UIObjectFactory.setExtension(CompGameMain.URL, CompGameMain);
