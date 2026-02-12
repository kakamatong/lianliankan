import FGUICompGameMain from "../../../../../fgui/game10002/FGUICompGameMain";
import { GameSocketManager } from "../../../../../frameworks/GameSocketManager";
import { AddEventListener, ChangeScene, LogColors, RemoveEventListener, ViewClass } from "../../../../../frameworks/Framework";
import { DataCenter } from "../../../../../datacenter/Datacenter";
import { GameData } from "../../../data/GameData";
import {
    SELF_LOCAL,
    PLAYER_STATUS,
    ROOM_END_FLAG,
    ROOM_TYPE,
    CTRL_BTN_INDEX,
    GAME_MODE_TXT,
    SEAT_1,
    ROOM_PLAYER_INDEX,
} from "../../../data/InterfaceGameConfig";
import * as fgui from "fairygui-cc";
import { CompClock } from "./CompClock";
import { PopMessageView } from "../../../../../view/common/PopMessageView";
import { ENUM_POP_MESSAGE_TYPE, RICH_TYPE } from "../../../../../datacenter/InterfaceConfig";
import { FW_EVENT_NAMES } from "../../../../../frameworks/config/Config";
import { ResultView } from "../../result/ResultView";
import { UserStatus } from "../../../../../modules/UserStatus";
import { MatchView } from "../../../../../view/match/MatchView";
import { Match } from "../../../../../modules/Match";
import { LobbySocketManager } from "../../../../../frameworks/LobbySocketManager";
import { AuthGame } from "../../../../../modules/AuthGame";
import FGUICompHead from "../../../../../fgui/common/FGUICompHead";
import { TotalResultView } from "../../result/TotalResultView";
import { MiniGameUtils } from "../../../../../frameworks/utils/sdk/MiniGameUtils";
import { CompPlayerHead } from "./CompPlayerHead";
import {
    SprotoClickResult,
    SprotoForwardMessage,
    SprotoGameClock,
    SprotoGameEnd,
    SprotoGameRecord,
    SprotoGameRelink,
    SprotoGameStart,
    SprotoItemEffect,
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
    SprotoTalk,
    SprotoTilesRemoved,
    SprotoTotalResult,
    SprotoVoteDisbandResult,
    SprotoVoteDisbandStart,
    SprotoVoteDisbandUpdate,
} from "../../../../../../types/protocol/game10002/s2c";
import {
    SprotoClickTiles,
    SprotoClientReady,
    SprotoGameReady,
    SprotoLeaveRoom,
    SprotoUseItem,
    SprotoVoteDisbandRoom,
} from "../../../../../../types/protocol/game10002/c2s";
import { SprotoGameRoomReady } from "../../../../../../types/protocol/lobby/s2c";
import { TALK_LIST } from "../../talk/TalkConfig";
import { TalkView } from "../../talk/TalkView";
import { CompMap } from "./CompMap";

/**
 * 游戏主体组件
 */
@ViewClass({ curveScreenAdapt: true })
export class CompGameMain extends FGUICompGameMain {
    /**
     * 组件构造完成时的初始化
     */
    onConstruct() {
        super.onConstruct();
        this.init();
        this.initListeners();

        // 客户端进入完成
        GameSocketManager.instance.sendToServer(SprotoClientReady, {});
        if (GameData.instance.isPrivateRoom) {
            this.ctrl_roomtype.selectedIndex = ROOM_TYPE.PRIVATE;
        }
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
        (this.UI_COMP_MAP as CompMap).initMap(map, "resEmoji");
        console.log("随机地图生成完成", map);
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
        GameSocketManager.instance.addServerListen(SprotoTalk, this.onSvrTalk.bind(this));
        // 连连看游戏协议
        GameSocketManager.instance.addServerListen(SprotoMapData, this.onSvrMapData.bind(this));
        GameSocketManager.instance.addServerListen(SprotoClickResult, this.onSvrClickResult.bind(this));
        GameSocketManager.instance.addServerListen(SprotoTilesRemoved, this.onSvrTilesRemoved.bind(this));
        GameSocketManager.instance.addServerListen(SprotoPlayerFinished, this.onSvrPlayerFinished.bind(this));
        GameSocketManager.instance.addServerListen(SprotoGameRelink, this.onSvrGameRelink.bind(this));
        GameSocketManager.instance.addServerListen(SprotoProgressUpdate, this.onSvrProgressUpdate.bind(this));
        GameSocketManager.instance.addServerListen(SprotoItemEffect, this.onSvrItemEffect.bind(this));
        GameSocketManager.instance.addServerListen(SprotoVoteDisbandStart, this.onSvrVoteDisbandStart.bind(this));
        GameSocketManager.instance.addServerListen(SprotoVoteDisbandUpdate, this.onSvrVoteDisbandUpdate.bind(this));
        GameSocketManager.instance.addServerListen(SprotoVoteDisbandResult, this.onSvrVoteDisbandResult.bind(this));
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
        GameSocketManager.instance.removeServerListen(SprotoTalk);
        // 连连看游戏协议
        GameSocketManager.instance.removeServerListen(SprotoMapData);
        GameSocketManager.instance.removeServerListen(SprotoClickResult);
        GameSocketManager.instance.removeServerListen(SprotoTilesRemoved);
        GameSocketManager.instance.removeServerListen(SprotoPlayerFinished);
        GameSocketManager.instance.removeServerListen(SprotoGameRelink);
        GameSocketManager.instance.removeServerListen(SprotoProgressUpdate);
        GameSocketManager.instance.removeServerListen(SprotoItemEffect);
        GameSocketManager.instance.removeServerListen(SprotoVoteDisbandStart);
        GameSocketManager.instance.removeServerListen(SprotoVoteDisbandUpdate);
        GameSocketManager.instance.removeServerListen(SprotoVoteDisbandResult);
        LobbySocketManager.instance.removeServerListen(SprotoGameRoomReady);
        RemoveEventListener(FW_EVENT_NAMES.GAME_SOCKET_DISCONNECT, this.onGameSocketDisconnect);
    }

    /**
     * 服务器消息转发处理
     * @param data 转发消息数据
     */
    onSvrForwardMessage(data: SprotoForwardMessage.Request) {
        console.log(data);
        this.forwardMessage(data);
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
    onSvrTotalResult(data: any) {
        const time = 1.2;
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
                this.UI_TXT_PROGRESS.text = `第${data.nowCnt ?? 0}局 无限局`;
            } else {
                this.UI_TXT_PROGRESS.text = `第${data.nowCnt ?? 0}局 共${data.maxCnt ?? 0}局`;
            }
            GameData.instance.privateMaxCnt = data.maxCnt;
            GameData.instance.privateNowCnt = data.nowCnt;

            //this.UI_TXT_RULE.text = `${GAME_MODE_TXT[data.mode]}`
            this.showWinLost(JSON.parse(data.ext));
        }
    }

    /**
     * 显示胜负战绩
     * @param data 胜负数据
     */
    showWinLost(data: any) {
        if (data && data.length > 0) {
            for (let index = 0; index < data.length; index++) {
                const element = data[index];
                const localSeat = GameData.instance.seat2local(index + 1);
                const playerNode = this.getChild<CompPlayerHead>(`UI_COMP_PLAYER_${localSeat}`);
                playerNode.UI_TXT_WINLOSE.text = `胜:${element.win ?? 0}`;
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
        if (bshow) {
            if (clock && clock > 99) {
                clock = 99;
            }
            const compClock = this.UI_COMP_CLOCK as CompClock;
            compClock.visible = true;
            compClock.start(clock || 10);
        } else {
            const compClock = this.UI_COMP_CLOCK as CompClock;
            compClock.visible = false;
        }
    }

    // 处理转发协议
    forwardMessage(data: SprotoForwardMessage.Request) {
        const type = data.type;
    }

    /**
     * 服务器聊天消息处理
     * @param data 聊天数据
     */
    onSvrTalk(data: SprotoTalk.Request): void {
        this.showTalk(data);
    }

    /**
     * 显示聊天消息
     * @param data 聊天数据
     */
    showTalk(data: SprotoTalk.Request): void {
        const id = data.id;
        const userid = data.from;
        const player = GameData.instance.getPlayerByUserid(userid);
        if (!player) return;
        const localSeat = GameData.instance.seat2local(player.svrSeat);
        const talkData = TALK_LIST.find((item) => item.id == id);
        if (!talkData) return;
        const playerNode = this.getChild<CompPlayerHead>(`UI_COMP_PLAYER_${localSeat}`);
        playerNode.showMsg(talkData.msg);
    }

    /**
     * 游戏时钟处理
     * @param data 时钟数据
     */
    onSvrGameClock(data: any): void {
        this.showClock(true, data.time);
    }

    // ============================================
    // 连连看游戏协议处理
    // ============================================

    /**
     * 地图数据处理
     * @param data 地图数据
     */
    onSvrMapData(data: SprotoMapData.Request): void {
        console.log("地图数据", data);
        if (data.mapData) {
            try {
                const map = JSON.parse(data.mapData);
                const compMap = this.getCompMap();
                if (compMap) {
                    compMap.initMap(map, "resEmoji");
                }
            } catch (e) {
                console.error("地图数据解析失败:", e);
            }
        }
    }

    /**
     * 点击结果响应处理
     * @param data 点击结果数据
     */
    onSvrClickResult(data: any): void {
        console.log("点击结果", data);
        if (data.code !== 1) {
            console.log("点击失败:", data.msg);
            // 可以在这里处理点击失败的情况，比如播放错误音效
        }
    }

    /**
     * 方块消除成功通知处理
     * @param data 消除数据
     */
    onSvrTilesRemoved(data: any): void {
        console.log("方块消除", data);
        const compMap = this.getCompMap();
        if (compMap) {
            // 通知地图组件消除方块
        }
    }

    /**
     * 玩家完成游戏处理
     * @param data 完成数据
     */
    onSvrPlayerFinished(data: any): void {
        console.log("玩家完成", data);
        const player = GameData.instance.getPlayerBySeat(data.seat);
        if (player) {
            const localSeat = GameData.instance.seat2local(player.svrSeat);
            // 显示玩家完成状态，如显示排名或用时
            console.log(`玩家 ${player.nickname} 完成游戏，排名: ${data.rank}，用时: ${data.usedTime}秒`);
        }
    }

    /**
     * 游戏重连恢复处理
     * @param data 重连数据
     */
    onSvrGameRelink(data: any): void {
        console.log("游戏重连", data);
        // 地图数据通过 mapData 协议单独下发
    }

    /**
     * 游戏进度更新处理
     * @param data 进度数据
     */
    onSvrProgressUpdate(data: any): void {
        const player = GameData.instance.getPlayerBySeat(data.seat);
        if (player) {
            const localSeat = GameData.instance.seat2local(player.svrSeat);
            // 更新其他玩家的进度显示
            console.log(`玩家 ${player.nickname} 进度: ${data.percentage}%，剩余: ${data.remaining}`);
        }
    }

    /**
     * 道具效果通知处理
     * @param data 道具效果数据
     */
    onSvrItemEffect(data: any): void {
        console.log("道具效果", data);
        // 预留：处理道具效果
    }

    /**
     * 投票解散开始处理
     * @param data 投票数据
     */
    onSvrVoteDisbandStart(data: any): void {
        console.log("投票解散开始", data);
        // 显示投票界面
    }

    /**
     * 投票状态更新处理
     * @param data 投票状态数据
     */
    onSvrVoteDisbandUpdate(data: any): void {
        console.log("投票状态更新", data);
        // 更新投票状态显示
    }

    /**
     * 投票解散结果处理
     * @param data 投票结果数据
     */
    onSvrVoteDisbandResult(data: any): void {
        console.log("投票解散结果", data);
        if (data.result === 1) {
            // 解散成功
            PopMessageView.showView({
                content: "房间已解散",
                type: ENUM_POP_MESSAGE_TYPE.NUM1SURE,
                sureBack: () => {
                    this.changeToLobbyScene();
                },
            });
        }
    }

    /**
     * 清除游戏状态
     */
    clear(): void {
        this.ctrl_btn.selectedIndex = CTRL_BTN_INDEX.NONE;
    }

    /**
     * 继续游戏按钮处理
     */
    onBtnContinue(): void {
        if (GameData.instance.gameStart) {
            return;
        }

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
        console.log("gameRoomReady", data);
        MatchView.hideView();
        DataCenter.instance.gameid = data.gameid;
        DataCenter.instance.roomid = data.roomid;
        DataCenter.instance.gameAddr = data.addr;
        DataCenter.instance.shortRoomid = 0; // 匹配房
        console.log(LogColors.green("游戏房间准备完成"));
        this.connectToGame(data.addr, data.gameid, data.roomid);
    }

    /**
     * 房间结束处理
     * @param data 结束数据
     */
    onRoomEnd(data: any): void {
        const msg = "房间销毁";
        if (data.code == ROOM_END_FLAG.GAME_END) {
            console.log("游戏结束 " + msg);
        } else if (data.code == ROOM_END_FLAG.OUT_TIME_WAITING) {
            console.log("等待超时 " + msg);
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
            console.log("游戏超时 " + msg);
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
            console.log("投票解散 " + msg);
            //this.onBtnClose()
        }
    }

    /**
     * 玩家信息处理
     * @param data 玩家信息数据
     */
    onSvrPlayerInfos(data: any): void {
        console.log("onSvrPlayerInfos", data);
        // 先存到playerInfos里面
        // enter 的时候在从里面取出来，放到playerlist里面去
        GameData.instance.playerInfos = data.infos;
        for (let i = 0; i < data.infos.length; i++) {
            const info = data.infos[i];
            const player = GameData.instance.getPlayerByUserid(info.userid);
            if (player) {
                player.nickname = info.nickname;
                player.headurl = info.headurl;
                player.sex = info.sex;
                player.province = info.province;
                player.city = info.city;
                player.ext = info.ext;
                player.ip = info.ip;
                player.status = info.status;
                player.cp = info.cp ?? 0;
                const localSeat = GameData.instance.seat2local(player.svrSeat);
                this.showPlayerInfoBySeat(localSeat);
            }
        }
    }

    /**
     * 游戏开始处理
     * @param data 游戏开始数据
     */
    onSvrGameStart(data: any): void {
        GameData.instance.gameStart = true;

        // 非重连情况
        if (!data.brelink) {
            if (data.roundNum == 1) {
                this.UI_COMP_GAME_START.act.play(() => {
                    this.UI_COMP_GAME_START.visible = false;
                    this.UI_COMP_ROUND_ACT.title.text = `Round ${data.roundNum}`;
                    this.UI_COMP_ROUND_ACT.visible = true;
                    this.UI_COMP_ROUND_ACT.act.play(() => {
                        this.UI_COMP_ROUND_ACT.visible = false;
                    });
                });
                this.UI_COMP_GAME_START.visible = true;
            } else {
                this.UI_COMP_ROUND_ACT.title.text = `Round ${data.roundNum}`;
                this.UI_COMP_ROUND_ACT.visible = true;
                this.UI_COMP_ROUND_ACT.act2.play(() => {
                    this.UI_COMP_ROUND_ACT.visible = false;
                });
            }

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
    onSvrGameEnd(data: any): void {
        GameData.instance.gameStart = false;

        // 处理连连看游戏结束数据
        if (data.rankings && data.rankings.length > 0) {
            const selfSeat = GameData.instance.getSelfSeat();
            const selfRank = data.rankings.find((r: any) => r.seat === selfSeat);

            if (selfRank) {
                const isCompleted = selfRank.usedTime >= 0;
                const scoreData = data.rankings.map((rank: any) => {
                    const player = GameData.instance.getPlayerBySeat(rank.seat);
                    return {
                        userid: player?.userid ?? 0,
                        nickname: player?.nickname ?? "",
                        usedTime: rank.usedTime,
                        eliminated: rank.eliminated,
                        rank:
                            rank.usedTime >= 0
                                ? data.rankings.filter((r: any) => r.usedTime >= 0 && r.usedTime < rank.usedTime).length + 1
                                : -1,
                    };
                });

                const func = () => {
                    this.onBtnContinue();
                };

                this.scheduleOnce(() => {
                    // 显示结果界面
                    ResultView.showView({
                        flag: isCompleted ? 1 : 0,
                        continueFunc: func,
                        scores: scoreData,
                    });
                }, 1);
            }
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
        const playerInfo = GameData.instance.getPlayerInfo(userid);
        if (playerInfo) {
            playerInfo.svrSeat = svrSeat;
            playerInfo.userid = userid;
            let localSeat = 0;
            if (selfid == userid) {
                localSeat = SELF_LOCAL;
            } else {
                localSeat = GameData.instance.seat2local(svrSeat);
            }
            GameData.instance.playerList[localSeat] = playerInfo;

            if (GameData.instance.isPrivateRoom) {
                if (playerInfo.status == PLAYER_STATUS.ONLINE && selfid == userid) {
                    this.ctrl_btn.selectedIndex = CTRL_BTN_INDEX.READY;
                }

                this.checkShowInviteBtn();
            }
            this.showPlayerInfoBySeat(localSeat);
        }
    }

    /**
     * 玩家状态更新处理
     * @param data 状态数据
     */
    onSvrPlayerStatusUpdate(data: any): void {
        const player = GameData.instance.getPlayerByUserid(data.userid);
        if (player) {
            player.status = data.status;
            this.showPlayerInfoBySeat(GameData.instance.seat2local(player.svrSeat));
            if (data.userid == DataCenter.instance.userid && data.status == PLAYER_STATUS.ONLINE) {
                this.ctrl_btn.selectedIndex = CTRL_BTN_INDEX.READY;
            }
        }
    }

    /**
     * 根据座位显示玩家信息
     * @param localseat 本地座位号
     */
    showPlayerInfoBySeat(localseat: number): void {
        const playerNode = this.getChild<CompPlayerHead>(`UI_COMP_PLAYER_${localseat}`);
        const player = GameData.instance.playerList[localseat];
        const nicknanme = playerNode.UI_TXT_NICKNAME;
        const id = playerNode.UI_TXT_ID;
        const head = playerNode.UI_COMP_HEAD as FGUICompHead;
        nicknanme.text = player.nickname ?? "";
        id.text = player.userid.toString();
        const headurl = GameData.instance.getHeadurl(localseat);
        head.UI_LOADER_HEAD.url = headurl;

        if (localseat != SELF_LOCAL) {
            if (player.status == PLAYER_STATUS.OFFLINE) {
                playerNode.UI_COMP_OFFLINE.visible = true;
            } else {
                playerNode.UI_COMP_OFFLINE.visible = false;
            }
            playerNode.visible = true;
        }

        if (player.status == PLAYER_STATUS.READY) {
            this.showSignReady(localseat, true);
        }
    }

    /**
     * 隐藏玩家头像
     * @param localseat 本地座位号
     */
    hideHead(localseat: number) {
        const playerNode = this.getChild<CompPlayerHead>(`UI_COMP_PLAYER_${localseat}`);
        if (localseat != SEAT_1) {
            playerNode.visible = false;
        }
    }

    /**
     * 玩家离开处理
     * @param data 离开数据
     */
    onSvrPlayerLeave(data: any): void {
        const localSeat = GameData.instance.seat2local(data.seat);
        GameData.instance.playerList.splice(localSeat, 1);
        this.hideHead(localSeat);
        this.checkShowInviteBtn();
    }

    /**
     * 房间信息处理
     * @param data 房间数据
     */
    onRoomInfo(data: any): void {
        console.log(data);
        GameData.instance.owner = data.owner;
        // 展示好友房信息
        if (data.shortRoomid) {
            const shortRoomid = `${data.shortRoomid}`;
            this.UI_TXT_ROOMID.text = "房间号:" + shortRoomid.padStart(6, "0");
        }

        if (GameData.instance.isPrivateRoom && data.gameData && data.gameData != "") {
            const gameData = JSON.parse(data.gameData);
            if (gameData && gameData.rule != "") {
                const rule = JSON.parse(gameData.rule);
                this.UI_TXT_RULE.text = `${GAME_MODE_TXT[rule.mode]}`;
                // 重新赋值房间人数
                GameData.instance.maxPlayer = rule.playerCnt;
            }
        } else {
            GameData.instance.maxPlayer = data.playerids.length ?? 2;
        }
        this.ctrl_playerCnt.selectedIndex = ROOM_PLAYER_INDEX[GameData.instance.maxPlayer] || 0;
    }

    /**
     * 显示准备标识
     * @param localSeat 本地座位号
     * @param bshow 是否显示
     */
    showSignReady(localSeat: number, bshow: boolean): void {
        this.getChild<fgui.GImage>(`UI_IMG_SIGN_READY_${localSeat}`).visible = bshow;
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
                    console.log("游戏中无法退出");
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
                console.log(res.msg);
                //this.UI_BTN_READY.visible = false;
                this.ctrl_btn.selectedIndex = CTRL_BTN_INDEX.NONE;
            }
        };
        GameSocketManager.instance.sendToServer(SprotoGameReady, { ready: 1 }, func);
        this.clear();
    }

    /**
     * 发送点击消除方块请求
     * @param row1 第一个方块行
     * @param col1 第一个方块列
     * @param row2 第二个方块行
     * @param col2 第二个方块列
     */
    sendClickTiles(row1: number, col1: number, row2: number, col2: number): void {
        GameSocketManager.instance.sendToServer(SprotoClickTiles, {
            row1: row1,
            col1: col1,
            row2: row2,
            col2: col2,
        });
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
                    console.log("使用道具成功:", itemId);
                } else {
                    console.error("使用道具失败:", response?.msg || "未知错误");
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
                console.log("发起解散投票成功");
            } else {
                console.error("发起解散投票失败:", response?.msg || "未知错误");
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
     * 绘制邀请图片
     * @returns 图片路径
     */
    async drawInviteInfo(): Promise<string> {
        return new Promise<string>(async (resolve, reject) => {
            // 邀请好友
            const bgUrl = "https://qiudaoyu-miniapp.oss-cn-hangzhou.aliyuncs.com/share/10001/invitebg.jpg";
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
                    console.log(res);
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
                    query: `gameid=${10001}&roomid=${DataCenter.instance.shortRoomid}`,
                });
            })
            .catch((err: any) => {
                console.log(err);
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
}
fgui.UIObjectFactory.setExtension(CompGameMain.URL, CompGameMain);
