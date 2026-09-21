/**
 * @file CompChallenge.ts
 * @description 闯关模式主组件：管理章节列表与章节标题展示
 * @category 闯关视图
 */

import FGUICompChallenge from "@fgui/challenge/FGUICompChallenge";
import { ViewClass } from "@frameworks/Framework";
import * as fgui from "fairygui-cc";
import { ChallengeView } from "../ChallengeView";
import { BezierTween, Logger } from "@frameworks/utils/Utils";
import FGUICompStar from "@fgui/challenge/FGUICompStar";
import { CompChapter } from "./CompChapter";
import { ChallengeData } from "@datacenter/ChallengeData";
import { ChallengeStarView } from "../ChallengeStarView";
import { RankStarView } from "../../rank/RankStarView";

/**
 * @class CompChallenge
 * @description 闯关模式主组件，负责章节标题刷新与子组件管理
 * @category 闯关视图
 */
@ViewClass({ curveScreenAdapt: true })
export class CompChallenge extends FGUICompChallenge {
    /**
     * @property {number} _chapterStars - 当前章节已获得的星星数
     * @private
     */
    private _chapterStars: number = 0;

    /**
     * @property {number} _chapterStarTotal - 当前章节的总星星数
     * @private
     */
    private _chapterStarTotal: number = 0;

    onConstruct() {
        super.onConstruct();
        const chapterComp = this.UI_COMP_CHAPTER as CompChapter;
        // 监听章节切换，实时刷新章节标题
        chapterComp.onChapterChanged = this.updateTitle.bind(this);
        // 监听章节星星统计，刷新星星数量展示
        chapterComp.onChapterStarChanged = this.updateStarLabel.bind(this);
        // 点击星星数量展示，弹出星星进度弹窗
        this.UI_LABEL_STAR.onClick(this.onBtnStarInfo, this);
        this.show();
    }

    onDestroy() {
        super.onDestroy();
    }

    onBtnClose() {
        ChallengeView.hideView();
    }

    /**
     * @method onBtnStarRank
     * @description 点击星星排行榜按钮：弹出星星周榜弹窗（本周/上周），数据由弹窗内部按 5 分钟缓存拉取
     * @private
     */
    onBtnStarRank(): void {
        RankStarView.showView();
    }

    show(data?: any): void {
    }

    /**
     * @method updateTitle
     * @description 更新章节标题文本，标题取自章节配置，名称缺失时回退为"第N章"
     * @param {number} chapter - 章节索引
     * @private
     */
    private updateTitle(chapter: number): void {
        if (!this.UI_TXT_TITLE) return;
        this.UI_TXT_TITLE.text = ChallengeData.instance.getChapterName(chapter) || `第${chapter + 1}章`;
    }

    /**
     * @method updateStarLabel
     * @description 更新当前章节的星星数量文本，格式为"已获得/总数"，例如 20/100
     * @param {number} obtained - 当前章节已获得的星星数
     * @param {number} total - 当前章节的总星星数
     * @private
     */
    private updateStarLabel(obtained: number, total: number): void {
        this._chapterStars = obtained;
        this._chapterStarTotal = total;
        if (!this.UI_LABEL_STAR) return;
        this.UI_LABEL_STAR.title = `${obtained}/${total}`;
    }

    /**
     * @method onBtnStarInfo
     * @description 点击星星数量展示：弹出星星进度弹窗，展示当前章节与总章节的星星进度
     * @private
     */
    private onBtnStarInfo(): void {
        ChallengeStarView.showView({
            chapterStars: this._chapterStars,
            chapterStarTotal: this._chapterStarTotal,
            totalStars: ChallengeData.instance.totalStars,
            totalStarTotal: ChallengeData.instance.totalStarMax,
        });
    }

    testBezier() {
        const node = fgui.UIPackage.createObject("challenge", "CompStar") as FGUICompStar;
        node.ctrl_status.selectedIndex = 1;
        this.addChild(node);
        BezierTween(node, 0, 0, 500, 500, 1, 300);
    }
}

fgui.UIObjectFactory.setExtension(CompChallenge.URL, CompChallenge);
