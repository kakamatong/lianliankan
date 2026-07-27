/**
 * @file CompWin.ts
 * @description 挑战赛胜利子组件
 * @category 游戏 10002 - 连连看
 */

import { ViewClass } from "@frameworks/Framework";
import FGUICompWin from "@fgui/gameChallengeResult/FGUICompWin";
import * as fgui from "fairygui-cc";

/**
 * @class CompWin
 * @description 挑战赛胜利子组件，继承自 FGUI 自动生成的 FGUICompWin
 * @category 游戏 10002 - 连连看
 */
@ViewClass()
export class CompWin extends FGUICompWin {}

fgui.UIObjectFactory.setExtension(CompWin.URL, CompWin);
