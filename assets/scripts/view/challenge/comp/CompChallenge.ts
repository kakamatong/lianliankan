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

/**
 * @class CompChallenge
 * @description 闯关模式主组件，负责章节标题刷新与子组件管理
 * @category 闯关视图
 */
@ViewClass({ curveScreenAdapt: true })
export class CompChallenge extends FGUICompChallenge {
    onConstruct() {
        super.onConstruct();
        const chapterComp = this.UI_COMP_CHAPTER as CompChapter;
        // 监听章节切换，实时刷新章节标题
        chapterComp.onChapterChanged = this.updateTitle.bind(this);
        // 监听章节星星统计，刷新星星数量展示
        chapterComp.onChapterStarChanged = this.updateStarLabel.bind(this);
        this.show();
    }

    onDestroy() {
        super.onDestroy();
    }

    onBtnClose() {
        ChallengeView.hideView();
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
        if (!this.UI_LABEL_STAR) return;
        this.UI_LABEL_STAR.title = `${obtained}/${total}`;
    }

    testBezier() {
        const node = fgui.UIPackage.createObject("challenge", "CompStar") as FGUICompStar;
        node.ctrl_status.selectedIndex = 1;
        this.addChild(node);
        BezierTween(node, 0, 0, 500, 500, 1, 300);
    }
}

fgui.UIObjectFactory.setExtension(CompChallenge.URL, CompChallenge);
