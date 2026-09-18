/**
 * @file CompStarInfo.ts
 * @description 星星进度信息组件：展示当前章节与总章节的星星进度
 * @category 闯关视图
 */

import FGUICompStarInfo from "@fgui/challenge/FGUICompStarInfo";
import { ViewClass } from "@frameworks/Framework";
import * as fgui from "fairygui-cc";
import { ChallengeStarView } from "../ChallengeStarView";

/**
 * @interface CHALLENGE_STAR_DATA
 * @description 星星进度弹窗展示数据
 */
export interface CHALLENGE_STAR_DATA {
    /** 当前章节已获得的星星数 */
    chapterStars: number;
    /** 当前章节的总星星数 */
    chapterStarTotal: number;
    /** 所有章节已获得的星星总数 */
    totalStars: number;
    /** 所有章节的总星星数 */
    totalStarTotal: number;
}

/**
 * @class CompStarInfo
 * @description 星星进度信息组件，展示当前章节与总章节的星星进度
 * @category 闯关视图
 */
@ViewClass()
export class CompStarInfo extends FGUICompStarInfo {
    /**
     * @method show
     * @description 刷新星星进度展示，格式为"已获得/总数"
     * @param {CHALLENGE_STAR_DATA} data - 星星进度数据
     */
    show(data?: CHALLENGE_STAR_DATA): void {
        if (!data) return;
        this.UI_TXT_NOW_NUM.text = `${data.chapterStars}/${data.chapterStarTotal}`;
        this.UI_TXT_TOTAL_NUM.text = `${data.totalStars}/${data.totalStarTotal}`;
    }

    /**
     * @method onBtnClose
     * @description 关闭按钮点击：隐藏星星进度弹窗
     */
    onBtnClose(): void {
        ChallengeStarView.hideView();
    }
}

fgui.UIObjectFactory.setExtension(CompStarInfo.URL, CompStarInfo);
