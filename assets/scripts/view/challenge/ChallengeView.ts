import FGUIChallengeView from "@fgui/challenge/FGUIChallengeView";
import * as fgui from "fairygui-cc";
import { PackageLoad, ViewClass } from "@frameworks/Framework";
import { FGUI_PACKAGE } from "@datacenter/PackageConfig";

@PackageLoad([FGUI_PACKAGE.CHALLENGE, FGUI_PACKAGE.PROPS])
@ViewClass()
export class ChallengeView extends FGUIChallengeView {}

fgui.UIObjectFactory.setExtension(ChallengeView.URL, ChallengeView);
