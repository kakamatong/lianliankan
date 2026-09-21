/**
 * @file Rank.ts
 * @description 排行榜模块：处理排行榜数据的请求
 * @category 网络请求模块
 */

import { LogColors } from "@frameworks/Framework";
import { SprotoCallActivityFunc } from "../../types/protocol/lobby/c2s";
import { BaseModule } from "@frameworks/base/BaseModule";
import { MAIN_GAME_ID } from "@datacenter/InterfaceConfig";
import { Logger } from "@frameworks/utils/Utils";

/**
 * @class Rank
 * @description 排行榜管理类，负责请求排行榜数据
 * @category 网络请求模块
 */
export class Rank extends BaseModule {
    static get instance(): Rank {
        return this._getInstance<Rank>(Rank);
    }

    /**
     * @description 请求排行榜数据
     * @param callBack 回调函数
     */
    req(callBack?: (b: boolean, data: any) => void) {
        this.reqLobby(
            SprotoCallActivityFunc,
            { moduleName: "gameRank", funcName: "getRankList", args: JSON.stringify({ gameid: MAIN_GAME_ID }) },
            (result) => this.resp(result, callBack)
        );
    }

    /**
     * @description 处理排行榜数据响应
     * @param result 服务器返回的排行榜数据
     * @param callBack 本次请求的回调（按请求传递，避免并发时回调串号）
     */
    resp(result: SprotoCallActivityFunc.Response, callBack?: (b: boolean, data: any) => void) {
        if (result && result.code == 1) {
            const res = JSON.parse(result.result);
            if (res.error) {
                Logger.log(LogColors.red(res.error));
                callBack && callBack(false, res);
            } else {
                callBack && callBack(true, res);
            }
        } else {
            callBack && callBack(false, null);
        }
    }

    /**
     * @description 请求星星周榜数据（本周/上周）
     * @param {number} weekOffset - 周偏移：0=本周，-1=上周
     * @param {(b: boolean, data: any) => void} callBack - 回调函数，返回 { rank, rankList }
     */
    reqStarRank(weekOffset: number, callBack?: (b: boolean, data: any) => void) {
        this.reqLobby(
            SprotoCallActivityFunc,
            {
                moduleName: "starRank",
                funcName: "getRankList",
                args: JSON.stringify({ gameid: MAIN_GAME_ID, weekOffset: weekOffset ?? 0 }),
            },
            (result) => this.respStarRank(result, callBack)
        );
    }

    /**
     * @description 处理星星周榜数据响应
     * @param result 服务器返回的星星周榜数据
     * @param callBack 本次请求的回调（按请求传递，避免本周/上周切换时回调串号）
     */
    respStarRank(result: SprotoCallActivityFunc.Response, callBack?: (b: boolean, data: any) => void) {
        if (result && result.code == 1) {
            const res = JSON.parse(result.result);
            if (res.error) {
                Logger.log(LogColors.red(res.error));
                callBack && callBack(false, res);
            } else {
                callBack && callBack(true, res);
            }
        } else {
            callBack && callBack(false, null);
        }
    }
}
