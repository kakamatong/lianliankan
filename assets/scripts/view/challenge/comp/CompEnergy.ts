/**
 * @file CompEnergy.ts
 * @description 体力组件：展示体力数值和恢复倒计时，自动恢复体力并同步到数据中心
 * @category 挑战视图
 */

import FGUICompEnergy from "@fgui/challenge/FGUICompEnergy";
import { ViewClass, AddEventListener, RemoveEventListener } from "@frameworks/Framework";
import * as fgui from "fairygui-cc";
import { DataCenter } from "@datacenter/Datacenter";
import { EVENT_NAMES } from "@datacenter/CommonConfig";

/**
 * @class CompEnergy
 * @description 体力组件，负责体力数值展示和自动恢复逻辑
 *  - UI_TXT_TOTAL：显示 "当前体力/总体力"
 *  - UI_TXT_TIME：显示恢复下一点倒计时（mm:ss 格式）或"已满"
 *  - ctrl_showTime：控制倒计时显示/隐藏
 * @category 挑战视图
 */
@ViewClass()
export class CompEnergy extends FGUICompEnergy {
    /**
     * @property {(() => void) | null} _scheduleId - 计时器回调函数
     * @private
     */
    private _scheduleId: (() => void) | null = null;

    /**
     * @property {number} _serverLeftEnergy - 服务端基准左体力值（不含自动恢复增量）
     * @private
     */
    private _serverLeftEnergy: number = 0;

    /**
     * @property {number} _serverExtraEnergy - 服务端额外体力值（奖励溢出部分）
     * @private
     */
    private _serverExtraEnergy: number = 0;

    /**
     * @property {number} _maxEnergy - 体力上限
     * @private
     */
    private _maxEnergy: number = 0;

    /**
     * @property {number} _serverUpdateTime - 服务端上次刷新时间戳（秒）
     * @private
     */
    private _serverUpdateTime: number = 0;

    /**
     * @property {number} _rate - 体力恢复速率（点/小时）
     * @private
     */
    private _rate: number = 0;

    /**
     * @property {number} _lastCalculatedLeft - 上一次计算出的左体力值（用于检测跨回复点）
     * @private
     */
    private _lastCalculatedLeft: number = 0;

    /**
     * @method onConstruct
     * @description 组件构建回调，初始化计时器和事件监听
     */
    onConstruct() {
        super.onConstruct();
        this._scheduleId = this.tick.bind(this);
        AddEventListener(EVENT_NAMES.USER_ENERGY, this.onUserEnergy, this);
        this.show();
    }

    /**
     * @method onDestroy
     * @description 组件销毁回调，清理事件监听和计时器
     */
    onDestroy() {
        RemoveEventListener(EVENT_NAMES.USER_ENERGY, this.onUserEnergy);
        this.stopTimer();
        super.onDestroy();
    }

    /**
     * @method show
     * @description 显示组件，从数据中心加载数据并启动计时器
     * @param {any} [data] - 传入数据（预留）
     */
    show(data?: any): void {
        this.initFromDataCenter();
        this.refreshDisplay();
        this.startTimerIfNeeded();
    }

    /**
     * @method initFromDataCenter
     * @description 从 DataCenter 读取服务端能量数据并缓存到本地字段
     * @private
     */
    private initFromDataCenter(): void {
        const energy = DataCenter.instance.userEnergy;
        if (energy) {
            this._serverLeftEnergy = energy.leftEnergy;
            this._serverExtraEnergy = energy.extraEnergy ?? 0;
            this._maxEnergy = energy.maxEnergy;
            this._serverUpdateTime = energy.updateTime;
            this._rate = energy.rate;
        }
    }

    /**
     * @method onUserEnergy
     * @description 收到服务端 USER_ENERGY 事件，重置基准数据并刷新显示
     * @param {any} data - 服务端下发的能量数据
     * @private
     */
    private onUserEnergy(data: any): void {
        this._serverLeftEnergy = data.leftEnergy;
        this._serverExtraEnergy = data.extraEnergy ?? 0;
        this._maxEnergy = data.maxEnergy;
        this._serverUpdateTime = data.updateTime;
        this._rate = data.rate;
        this.refreshDisplay();
        this.startTimerIfNeeded();
    }

    /**
     * @method startTimer
     * @description 启动 1 秒间隔的计时器
     * @private
     */
    private startTimer(): void {
        if (this._scheduleId) {
            this.unschedule(this._scheduleId);
            this.schedule(this._scheduleId, 1);
        }
    }

    /**
     * @method stopTimer
     * @description 停止计时器
     * @private
     */
    private stopTimer(): void {
        if (this._scheduleId) {
            this.unschedule(this._scheduleId);
        }
    }

    /**
     * @method startTimerIfNeeded
     * @description 根据当前体力状态决定启动或停止计时器（已满则停止，未满则启动）
     * @private
     */
    private startTimerIfNeeded(): void {
        const state = this._calcState();
        if (state.isFull) {
            this.stopTimer();
        } else {
            this.startTimer();
        }
    }

    /**
     * @method tick
     * @description 计时器回调（每秒），检测体力恢复并同步到 DataCenter
     * @private
     */
    private tick(): void {
        const state = this._calcState();
        if (state.currentLeft > this._lastCalculatedLeft) {
            this._lastCalculatedLeft = state.currentLeft;
            DataCenter.instance.updateLeftEnergy(state.currentLeft);
        }
        if (state.isFull) {
            this.stopTimer();
        }
        this.refreshDisplay();
    }

    /**
     * @method _calcState
     * @description 根据服务端基准数据和经过时间，计算当前体力状态
     *  - rate 为每小时恢复点数 → 换算为 recoverySecs = 3600 / rate 秒每点
     *  - currentLeft = min(基准左体力 + 已恢复点数, 上限)
     *  - currentTotal = currentLeft + extraEnergy（显示用）
     * @returns {{ isFull: boolean; currentLeft: number; currentTotal: number; timeLeft: number }} 体力状态
     * @private
     */
    private _calcState(): { isFull: boolean; currentLeft: number; currentTotal: number; timeLeft: number } {
        const nowSec = Math.floor(Date.now() / 1000);
        const recoverySecs = 3600 / this._rate;
        const elapsed = Math.max(0, nowSec - this._serverUpdateTime);
        const recovered = Math.floor(elapsed / recoverySecs);
        const currentLeft = Math.min(this._serverLeftEnergy + recovered, this._maxEnergy);
        const currentTotal = currentLeft + this._serverExtraEnergy;
        const isFull = currentTotal >= this._maxEnergy;

        let timeLeft = 0;
        if (!isFull) {
            const nextRecoverSec = this._serverUpdateTime + (recovered + 1) * recoverySecs;
            timeLeft = Math.max(0, nextRecoverSec - nowSec);
        }

        return { isFull, currentLeft, currentTotal, timeLeft };
    }

    /**
     * @method refreshDisplay
     * @description 刷新 UI 显示：体力数值、倒计时文本、控制器状态
     * @private
     */
    private refreshDisplay(): void {
        const state = this._calcState();
        this._lastCalculatedLeft = state.currentLeft;

        if (this.UI_TXT_TOTAL) {
            this.UI_TXT_TOTAL.text = `${state.currentTotal}/${this._maxEnergy}`;
        }

        if (this.UI_TXT_TIME) {
            this.UI_TXT_TIME.text = state.isFull ? "已满" : this._formatTime(state.timeLeft);
        }

        if (this.ctrl_showTime) {
            this.ctrl_showTime.selectedIndex = state.isFull ? 0 : 1;
        }
    }

    /**
     * @method _formatTime
     * @description 将秒数格式化为 "mm:ss" 格式的字符串
     * @param {number} seconds - 秒数
     * @returns {string} 格式化后的时间字符串
     * @private
     */
    private _formatTime(seconds: number): string {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        const mm = m.toString().padStart(2, "0");
        const ss = s.toString().padStart(2, "0");
        return `${mm}:${ss}`;
    }
}

fgui.UIObjectFactory.setExtension(CompEnergy.URL, CompEnergy);
