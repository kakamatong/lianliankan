/**
 * @file Challenge.ts
 * @description 闯关模块：拉取闯关模式配置
 * @category 网络请求模块
 */

import { DataCenter } from "@datacenter/Datacenter";
import { ChallengeConfig } from "@datacenter/ChallengeConfig";
import { LogColors } from "@frameworks/Framework";
import { HttpPostWithDefaultJWT, Logger } from "@frameworks/utils/Utils";
import { BaseModule } from "@frameworks/base/BaseModule";

/**
 * @class Challenge
 * @description 闯关管理类，负责请求闯关模式配置，使用单例模式
 * @category 网络请求模块
 * @singleton 单例模式
 */
export class Challenge extends BaseModule {
    static get instance(): Challenge {
        return this._getInstance<Challenge>(Challenge);
    }

    /**
     * @method getConfig
     * @description 获取闯关模式配置
     * @param {(success:boolean, data?:any)=>void} callBack - 回调函数，返回请求结果
     */
    getConfig(callBack: (success: boolean, data?: any) => void) {
        const url = DataCenter.instance.appConfig.webUrl + "/api/game/challengeconfig";
        if (!DataCenter.instance.appConfig.webUrl) {
            Logger.warn(LogColors.red("webUrl not configured!"));
            callBack(false);
            return;
        }

        Logger.log(LogColors.blue(`Sending POST request to: ${url}`));

        const payload = {
            "userid": DataCenter.instance.userid,
            "channelid": DataCenter.instance.channelID,
        };

        HttpPostWithDefaultJWT(url, {}, payload)
            .then((data) => {
                Logger.log(LogColors.green("challenge config request successful!"));
                if (data && data.code === 200 && data.data) {
                    ChallengeConfig.instance.config = data.data;
                }
                callBack(true, data);
            })
            .catch((error) => {
                Logger.warn(LogColors.red(`challenge config request failed: ${error.message}`));
                callBack(false, error);
            });
    }
}
