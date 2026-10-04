import FGUIGameView from "@fgui/game10002/FGUIGameView";
import { PackageLoad, ViewClass } from "@frameworks/Framework";
import * as fgui from "fairygui-cc";
import { FGUI_PACKAGE } from "@datacenter/PackageConfig";
/**
 * 游戏视图 - 只处理背景显示
 */
@ViewClass()
@PackageLoad([FGUI_PACKAGE.RES_FRUIT, FGUI_PACKAGE.PROPS, FGUI_PACKAGE.GAME_COMMON])
export class GameView extends FGUIGameView {}

fgui.UIObjectFactory.setExtension(GameView.URL, GameView);
