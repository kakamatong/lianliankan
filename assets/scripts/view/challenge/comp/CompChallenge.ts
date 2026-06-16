import FGUICompChallenge from "@fgui/challenge/FGUICompChallenge";
import { ViewClass } from "@frameworks/Framework";
import * as fgui from "fairygui-cc";
import { ChallengeView } from "../ChallengeView";
import { UserEnergy } from "@modules/UserEnergy";
import { Challenge } from "@modules/Challenge";

@ViewClass({ curveScreenAdapt: true })
export class CompChallenge extends FGUICompChallenge {
    onConstruct() {
        super.onConstruct();
        this.init();
        this.show();
    }

    init() {
        UserEnergy.instance.req();
        Challenge.instance.getConfig((success, data) => {
            if (success) {
                console.log("闯关配置获取成功");
            } else {
                console.warn("闯关配置获取失败");
            }
        });
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

    onBtnTestAdd() {
        UserEnergy.instance.changeReq(1);
    }

    onBtnTestReduce() {
        UserEnergy.instance.changeReq(-1);
    }
}

fgui.UIObjectFactory.setExtension(CompChallenge.URL, CompChallenge);
