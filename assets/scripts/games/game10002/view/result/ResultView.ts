import FGUIResultView from "../../../../fgui/game10002Result/FGUIResultView";
import * as fgui from "fairygui-cc";
import { GameData } from "../../data/GameData";
import { SoundManager } from "../../../../frameworks/SoundManager";
import { MiniGameUtils } from "db://assets/scripts/frameworks/utils/sdk/MiniGameUtils";
import { ViewClass } from "db://assets/scripts/frameworks/Framework";
import FGUICompResultInfo from "../../../../fgui/game10002Result/FGUICompResultInfo";
import FGUICompHead from "../../../../fgui/common/FGUICompHead";
import FGUICompMedal from "db://assets/scripts/fgui/gameCommon/FGUICompMedal";
import { DataCenter } from "db://assets/scripts/datacenter/Datacenter";
import { truncateString } from "../../../../frameworks/utils/Utils";

@ViewClass()
export class ResultView extends FGUIResultView {
    private _continueFunc: (() => void) | null = null;
    private _scoreData: Array<{ userid: number; usedTime: number; rank: number; eliminated: number; nickname: string; headurl: string }> =
        [];
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
            MiniGameUtils.instance.showInterstitialAd("adunit-5189637d1c76ffbc");
        });

        if (data.scores && data.scores.length > 0) {
            this._scoreData = data.scores;
            this.UI_LV_GAME_INFO.itemRenderer = this.itemRenderer.bind(this);
            this.UI_LV_GAME_INFO.numItems = this._scoreData.length;
        }
    }

    itemRenderer(index: number, item: fgui.GObject) {
        const data = this._scoreData[index];
        const node = item as FGUICompResultInfo;
        const head = node.UI_COMP_HEAD as FGUICompHead;
        head.UI_LOADER_HEAD.url = data.headurl;
        node.UI_TXT_NICKNAME.text = truncateString(data.nickname, 8);
        if (data.usedTime > 0) {
            const timeInSeconds = (data.usedTime / 1000).toFixed(3);
            node.UI_TXT_USE_TIME.text = `${timeInSeconds}秒`;
            node.ctrl_uncomp.selectedIndex = 0;
            const medal = node.UI_COMP_MEDAL as FGUICompMedal;
            medal.ctrl_rank.selectedIndex = data.rank;
        } else {
            node.ctrl_uncomp.selectedIndex = 1;
            node.UI_TXT_USE_TIME.text = "未完成";
        }

        const selfid = DataCenter.instance.userid;
        if (data.userid === selfid) {
            node.ctrl_self.selectedIndex = 1;
        }
    }

    onBtnBack(): void {
        ResultView.hideView();
    }

    onBtnCon(): void {
        this._continueFunc && this._continueFunc();
        ResultView.hideView();
    }
}
fgui.UIObjectFactory.setExtension(ResultView.URL, ResultView);
