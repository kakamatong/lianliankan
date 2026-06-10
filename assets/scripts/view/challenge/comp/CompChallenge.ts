import FGUICompChallenge from "@fgui/challenge/FGUICompChallenge";
import { ViewClass } from "@frameworks/Framework";
import * as fgui from "fairygui-cc";
import { ChallengeView } from "../ChallengeView";
import { UserEnergy } from "@modules/UserEnergy";

@ViewClass({ curveScreenAdapt: true })
export class CompChallenge extends FGUICompChallenge {
    onConstruct() {
        super.onConstruct();
        this.init();
        this.show();
    }

    init() {
        UserEnergy.instance.req();
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
