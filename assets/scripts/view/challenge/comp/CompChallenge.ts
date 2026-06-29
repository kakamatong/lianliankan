import FGUICompChallenge from "@fgui/challenge/FGUICompChallenge";
import { ViewClass } from "@frameworks/Framework";
import * as fgui from "fairygui-cc";
import { ChallengeView } from "../ChallengeView";
import { UserEnergy } from "@modules/UserEnergy";
import { Challenge } from "@modules/Challenge";
import { Logger } from "@frameworks/utils/Utils";
import { ChallengeConfig } from "@datacenter/ChallengeConfig";

@ViewClass({ curveScreenAdapt: true })
export class CompChallenge extends FGUICompChallenge {
    onConstruct() {
        super.onConstruct();
        this.init();
        this.show();
    }

    init() {
        UserEnergy.instance.req();
        // Challenge.instance.getConfig((success, data) => {
        //     if (success) {
        //         ChallengeConfig.instance.loadChapterConfig(0).then((maps) => {
        //             Logger.log("章节关卡配置加载成功", maps);
        //         });
        //         Logger.log("闯关配置获取成功");
        //     } else {
        //         Logger.warn("闯关配置获取失败");
        //     }
        // });
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
