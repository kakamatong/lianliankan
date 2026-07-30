/**
 * @file CompResult.ts
 * @description 闯关胜利子组件
 * @category 游戏 10002 - 连连看
 */

import { ViewClass } from "@frameworks/Framework";
import FGUICompResult from "@fgui/gameChallengeResult/FGUICompResult";
import * as fgui from "fairygui-cc";
import { CompStarAni } from "./CompStarAni";
import { GameChallengeResultView } from "../GameChallengeResultView";
import { SoundManager } from "@frameworks/SoundManager";

export type CompResultData = {
    score: number; // 得分
    time: number; // 用时
    pass: boolean; // 是否通关
    stars: number; // 获得星星数
};

/**
 * @class CompResult
 * @description 闯关胜利子组件，继承自 FGUI 自动生成的 FGUICompResult
 * @category 游戏 10002 - 连连看
 */
@ViewClass()
export class CompResult extends FGUICompResult {
    private _data?: CompResultData;
    onConstruct(): void {
        super.onConstruct();
        SoundManager.instance.playSoundEffect("game10002/win");
        //this.initUI();
    }

    show(data?: CompResultData): void {
        super.show();
        this._data = data;
        this.initUI();
    }

    /**
     * 播放星星动画
     * @param number 星星数量
     */
    playStar(number: number): void {
        const actNode = this.UI_COMP_STAR as CompStarAni;
        actNode.play(number, () => {
            console.log("All stars animation completed.");
        });
    }

    initUI(): void {
        if (!this._data) return;
        this.UI_TXT_SCORE.text = `得分:${this._data.score}`;
        this.UI_TXT_TIME.text = `用时:${this._data.time}秒`;
        if (this._data.pass) {
            this.ctrl_result.selectedIndex = 1;
            this.playStar(this._data.stars);
        } else {
            this.ctrl_result.selectedIndex = 0;
        }
    }

    onBtnNext(): void {
        GameChallengeResultView.hideView();
    }

    onBtnReplay(): void {
        GameChallengeResultView.hideView();
    }
}

fgui.UIObjectFactory.setExtension(CompResult.URL, CompResult);
