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
        // 监听章节切换，实时刷新章节标题
        (this.UI_COMP_CHAPTER as CompChapter).onChapterChanged = this.updateTitle.bind(this);
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

    testBezier() {
        const node = fgui.UIPackage.createObject("challenge", "CompStar") as FGUICompStar;
        node.ctrl_status.selectedIndex = 1;
        this.addChild(node);
        BezierTween(node, 0, 0, 500, 500, 1, 300);
    }
}

fgui.UIObjectFactory.setExtension(CompChallenge.URL, CompChallenge);
