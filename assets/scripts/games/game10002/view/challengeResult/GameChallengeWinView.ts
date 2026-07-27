/**
 * @file GameChallengeWinView.ts
 * @description 挑战赛胜利视图
 * @category 游戏 10002 - 连连看
 */

import FGUIGameChallengeWinView from "@fgui/gameChallengeResult/FGUIGameChallengeWinView";
import * as fgui from "fairygui-cc";
import { PackageLoad, ViewClass } from "@frameworks/Framework";

/**
 * @class GameChallengeWinView
 * @description 挑战赛胜利视图，继承自 FGUI 自动生成的 FGUIGameChallengeWinView
 * @category 游戏 10002 - 连连看
 */
@PackageLoad(["gameChallengeResult"])
@ViewClass()
export class GameChallengeWinView extends FGUIGameChallengeWinView {}

fgui.UIObjectFactory.setExtension(GameChallengeWinView.URL, GameChallengeWinView);
