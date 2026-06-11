/**
 * @file UserEnergy.ts
 * @description 用户体力模块：处理体力数据的请求和变更
 * @category 网络请求模块
 */

import { SprotoUserEnergy, SprotoUserEnergyChange } from "../../types/protocol/lobby/c2s";
import { DataCenter } from "@datacenter/Datacenter";
import { DispatchEvent } from "@frameworks/Framework";
import { EVENT_NAMES } from "@datacenter/CommonConfig";
import { BaseModule } from "@frameworks/base/BaseModule";

/**
 * @class UserEnergy
 * @description 用户体力管理类，负责请求和变更用户体力数据
 * @category 网络请求模块
 */
export class UserEnergy extends BaseModule {
    static get instance(): UserEnergy {
        return this._getInstance<UserEnergy>(UserEnergy);
    }

    /**
     * @method req
     * @description 请求用户体力数据
     */
    req() {
        this.reqLobby(SprotoUserEnergy, {}, this.resp.bind(this));
    }

    /**
     * @method resp
     * @description 处理用户体力数据响应，更新数据中心并派发事件
     * @param {SprotoUserEnergy.Response} data - 服务端返回的体力数据
     */
    resp(data: SprotoUserEnergy.Response) {
        if (data) {
            DataCenter.instance.userEnergy = data;
            DispatchEvent(EVENT_NAMES.USER_ENERGY, data);
        }
    }

    /**
     * @method changeReq
     * @description 请求增减用户体力
     * @param {number} change - 体力变化量（正数增加，负数减少）
     */
    changeReq(change: number) {
        this.reqLobby(SprotoUserEnergyChange, { change }, this.changeResp.bind(this));
    }

    /**
     * @method changeResp
     * @description 处理体力变更响应，成功时更新数据中心并派发事件
     * @param {SprotoUserEnergyChange.Response} data - 服务端返回的体力变更结果
     */
    changeResp(data: SprotoUserEnergyChange.Response) {
        if (data && data.code === 1) {
            DataCenter.instance.userEnergy = data;
            DispatchEvent(EVENT_NAMES.USER_ENERGY, data);
        }
    }
}
