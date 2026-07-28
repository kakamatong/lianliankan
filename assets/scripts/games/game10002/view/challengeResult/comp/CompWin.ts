/**
 * @file CompWin.ts
 * @description 闯关胜利子组件
 * @category 游戏 10002 - 连连看
 */

import { ViewClass } from "@frameworks/Framework";
import FGUICompWin from "@fgui/gameChallengeResult/FGUICompWin";
import * as fgui from "fairygui-cc";
import { CompStarAni } from "./CompStarAni";
import { GameChallengeWinView } from "../GameChallengeWinView";
import { SoundManager } from "@frameworks/SoundManager";

/**
 * @class CompWin
 * @description 闯关胜利子组件，继承自 FGUI 自动生成的 FGUICompWin
 * @category 游戏 10002 - 连连看
 */
@ViewClass()
export class CompWin extends FGUICompWin {
    onConstruct(): void {
        super.onConstruct();
        SoundManager.instance.playSoundEffect("game10002/win");
        this.test();
    }
    test(): void {
        const actNode = this.UI_COMP_STAR as CompStarAni;
        actNode.play(3, () => {
            console.log("All stars animation completed.");
        });
    }

    onBtnNext(): void {
        GameChallengeWinView.hideView();
    }
}

fgui.UIObjectFactory.setExtension(CompWin.URL, CompWin);
