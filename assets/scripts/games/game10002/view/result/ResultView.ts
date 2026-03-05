import FGUIResultView from "../../../../fgui/game10002Result/FGUIResultView";
import * as fgui from "fairygui-cc";
import { GameData } from "../../data/GameData";
import { SoundManager } from "../../../../frameworks/SoundManager";
import { MiniGameUtils } from "db://assets/scripts/frameworks/utils/sdk/MiniGameUtils";
import { ViewClass } from "db://assets/scripts/frameworks/Framework";

@ViewClass()
export class ResultView extends FGUIResultView {
    private _continueFunc: (() => void) | null = null;
    private _scoreData: Array<{ userid: number; usedTime: number; rank: number; eliminated: number; nickname: string }> = [];
    show(data?: any) {
        const flag = 1;
        this.ctrl_flag.selectedIndex = flag;
        if (flag === 1) {
            SoundManager.instance.playSoundEffect("game10002/win");
        } else if (flag === 0) {
            SoundManager.instance.playSoundEffect("game10002/lose");
        }

        this._continueFunc = data?.continueFunc;
        this.act.play(() => {
            this.UI_COMP_ACT.ctrl_show.selectedIndex = 1;
            MiniGameUtils.instance.showInterstitialAd("adunit-5189637d1c76ffbc");
        });

        if (data.scores && data.scores.length > 0) {
            this._scoreData = data.scores;
            this.UI_LV_GAME_INFO.itemRenderer = this.itemRenderer.bind(this);
            this.UI_LV_GAME_INFO.numItems = this._scoreData.length;
        }
    }

    itemRenderer(index: number, item: fgui.GObject) {}

    onBtnBack(): void {
        ResultView.hideView();
    }

    onBtnCon(): void {
        this._continueFunc && this._continueFunc();
        ResultView.hideView();
    }
}
fgui.UIObjectFactory.setExtension(ResultView.URL, ResultView);
