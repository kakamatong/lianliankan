/**
 * @file ChallengeStarView.ts
 * @description 星星进度弹窗：展示当前章节与总章节的星星进度
 * @category 闯关视图
 */

import FGUIChallengeStarView from "@fgui/challenge/FGUIChallengeStarView";
import { ViewClass } from "@frameworks/Framework";
import * as fgui from "fairygui-cc";
import { CHALLENGE_STAR_DATA, CompStarInfo } from "./comp/CompStarInfo";

/**
 * @class ChallengeStarView
 * @description 星星进度弹窗，展示当前章节与总章节的星星进度
 * @category 闯关视图
 */
@ViewClass()
export class ChallengeStarView extends FGUIChallengeStarView {
    /**
     * @method show
     * @description 显示星星进度弹窗
     * @param {CHALLENGE_STAR_DATA} data - 星星进度数据
     */
    show(data?: CHALLENGE_STAR_DATA): void {
        if (!data) return;
        (this.UI_COMP_MAIN as CompStarInfo).show(data);
    }
}

fgui.UIObjectFactory.setExtension(ChallengeStarView.URL, ChallengeStarView);
