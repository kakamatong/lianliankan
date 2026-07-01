/**
 * @file CompEnergy.ts
 * @description 体力组件：展示体力数值和恢复倒计时，体力计算逻辑托管给 DataCenter
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
     * @description 显示组件，刷新显示并启动计时器
     * @param {any} [data] - 传入数据（预留）
     */
    show(data?: any): void {
        this.refreshDisplay();
        this.startTimerIfNeeded();
    }

    /**
     * @method onUserEnergy
     * @description 收到服务端 USER_ENERGY 事件，重置基准数据并刷新显示
     * @param {any} _data - 服务端下发的能量数据
     * @private
     */
    private onUserEnergy(_data: any): void {
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
        const state = DataCenter.instance.getCurrentEnergyState();
        if (state.isFull) {
            this.stopTimer();
        } else {
            this.startTimer();
        }
    }

    /**
     * @method tick
     * @description 计时器回调（每秒），刷新显示并检测是否需要停止计时器
     * @private
     */
    private tick(): void {
        if (DataCenter.instance.getCurrentEnergyState().isFull) {
            this.stopTimer();
        }
        this.refreshDisplay();
    }

    /**
     * @method refreshDisplay
     * @description 刷新 UI 显示：体力数值、倒计时文本、控制器状态
     * @private
     */
    private refreshDisplay(): void {
        const state = DataCenter.instance.getCurrentEnergyState();

        if (this.UI_TXT_TOTAL) {
            this.UI_TXT_TOTAL.text = `${state.currentTotal}/${DataCenter.instance.userEnergy?.maxEnergy ?? 0}`;
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
