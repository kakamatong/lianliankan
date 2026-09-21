/**
 * @file RankStarView.ts
 * @description 星星排行榜弹窗视图：承载 CompRankStar 子组件（子组件自行取数与渲染）
 * @category 排行榜视图
 */

import FGUIRankStarView from "@fgui/rank/FGUIRankStarView";
import * as fgui from "fairygui-cc";
import { ViewClass } from "@frameworks/Framework";

/**
 * @class RankStarView
 * @description 星星排行榜视图（本周/上周），数据与交互由子组件 CompRankStar 负责
 * @category 排行榜视图
 */
@ViewClass()
export class RankStarView extends FGUIRankStarView {
}
fgui.UIObjectFactory.setExtension(RankStarView.URL, RankStarView);
