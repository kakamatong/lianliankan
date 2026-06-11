import FGUICompEnergy from "@fgui/challenge/FGUICompEnergy";
import { ViewClass, AddEventListener, RemoveEventListener } from "@frameworks/Framework";
import * as fgui from "fairygui-cc";
import { DataCenter } from "@datacenter/Datacenter";
import { EVENT_NAMES } from "@datacenter/CommonConfig";

@ViewClass()
export class CompEnergy extends FGUICompEnergy {
    private _scheduleId: (() => void) | null = null;

    private _serverLeftEnergy: number = 0;
    private _serverExtraEnergy: number = 0;
    private _maxEnergy: number = 0;
    private _serverUpdateTime: number = 0;
    private _rate: number = 0;

    private _lastCalculatedLeft: number = 0;

    onConstruct() {
        super.onConstruct();
        this._scheduleId = this.tick.bind(this);
        AddEventListener(EVENT_NAMES.USER_ENERGY, this.onUserEnergy, this);
        this.show();
    }

    onDestroy() {
        RemoveEventListener(EVENT_NAMES.USER_ENERGY, this.onUserEnergy);
        this.stopTimer();
        super.onDestroy();
    }

    show(data?: any): void {
        this.initFromDataCenter();
        this.refreshDisplay();
        this.startTimerIfNeeded();
    }

    // ============================================
    // 数据加载
    // ============================================

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

    // ============================================
    // 服务端事件
    // ============================================

    private onUserEnergy(data: any): void {
        this._serverLeftEnergy = data.leftEnergy;
        this._serverExtraEnergy = data.extraEnergy ?? 0;
        this._maxEnergy = data.maxEnergy;
        this._serverUpdateTime = data.updateTime;
        this._rate = data.rate;
        this.refreshDisplay();
        this.startTimerIfNeeded();
    }

    // ============================================
    // 计时器
    // ============================================

    private startTimer(): void {
        if (this._scheduleId) {
            this.unschedule(this._scheduleId);
            this.schedule(this._scheduleId, 1);
        }
    }

    private stopTimer(): void {
        if (this._scheduleId) {
            this.unschedule(this._scheduleId);
        }
    }

    private startTimerIfNeeded(): void {
        const state = this._calcState();
        if (state.isFull) {
            this.stopTimer();
        } else {
            this.startTimer();
        }
    }

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

    // ============================================
    // 核心计算
    // ============================================
    private _calcState(): { isFull: boolean; currentLeft: number; currentTotal: number; timeLeft: number } {
        const nowSec = Math.floor(Date.now() / 1000);
        const recoverySecs = 3600 / this._rate;
        const elapsed = Math.max(0, nowSec - this._serverUpdateTime);
        const recovered = Math.floor(elapsed / recoverySecs);
        const currentLeft = Math.min(this._serverLeftEnergy + recovered, this._maxEnergy);
        const currentTotal = currentLeft + this._serverExtraEnergy;
        const isFull = currentLeft >= this._maxEnergy;

        let timeLeft = 0;
        if (!isFull) {
            const nextRecoverSec = this._serverUpdateTime + (recovered + 1) * recoverySecs;
            timeLeft = Math.max(0, nextRecoverSec - nowSec);
        }

        return { isFull, currentLeft, currentTotal, timeLeft };
    }

    // ============================================
    // 显示刷新
    // ============================================
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

    private _formatTime(seconds: number): string {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        const mm = m.toString().padStart(2, "0");
        const ss = s.toString().padStart(2, "0");
        return `${mm}:${ss}`;
    }
}

fgui.UIObjectFactory.setExtension(CompEnergy.URL, CompEnergy);
