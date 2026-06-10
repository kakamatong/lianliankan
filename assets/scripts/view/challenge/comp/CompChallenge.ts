import FGUICompChallenge from "@fgui/challenge/FGUICompChallenge";
import { ViewClass } from "@frameworks/Framework";
import * as fgui from "fairygui-cc";
import { ChallengeView } from "../ChallengeView";

@ViewClass({ curveScreenAdapt: true })
export class CompChallenge extends FGUICompChallenge {
    onConstruct() {
        super.onConstruct();
        this.show();
    }

    onDestroy() {
        super.onDestroy();
    }

    onBtnClose() {
        ChallengeView.hideView();
    }

    show(data?: any): void {
        // TODO: 实现业务逻辑
    }
}

fgui.UIObjectFactory.setExtension(CompChallenge.URL, CompChallenge);
