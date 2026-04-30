import { RICH_TYPE } from "@datacenter/InterfaceConfig";
import FGUICompPropPanel from "@fgui/game10002/FGUICompPropPanel";
import { ViewClass } from "@frameworks/Framework";
import { GameSocketManager } from "@frameworks/GameSocketManager";
import * as fgui from "fairygui-cc";
import { SprotoUseItem } from "../../../../../../types/protocol/game10002/c2s";
import { Logger } from "@frameworks/utils/Utils";
import { UserData } from "@modules/UserData";
import { DataCenter } from "@datacenter/Datacenter";
import { TipsView } from "@view/common/TipsView";

@ViewClass()
export class CompPropPanel extends FGUICompPropPanel {
    protected onConstruct(): void {
        super.onConstruct();
        this.init();
    }

    /**
     * 初始化
     */
    init(): void {
        const upSetNums = DataCenter.instance.getRichByType(RICH_TYPE.UPSET);
        this.UI_BTN_UPSET.UI_TXT_NUMS.text = `X ${upSetNums?.richNums || 0}`;
    }
    /**
     * 使用道具
     * @param itemId 道具ID (1:重排, 2:提示, 3:加时等)
     */
    sendUseItem(itemId: number, callBack?: (b: boolean, response: SprotoUseItem.Response) => void): void {
        GameSocketManager.instance.sendToServer(
            SprotoUseItem,
            {
                itemId: itemId,
            },
            (response: SprotoUseItem.Response) => {
                if (response && response.code === 1) {
                    callBack && callBack(true, response);
                    Logger.log("使用道具成功:", itemId);
                } else {
                    callBack && callBack(false, response);
                    Logger.error("使用道具失败:", response?.msg || "未知错误");
                    TipsView.showView({ content: response.msg });
                }
            }
        );
    }

    /**
     * 使用道具: 打乱
     */
    onBtnUpset(): void {
        Logger.log("使用道具: 打乱");
        const callBack = (b: boolean, response: SprotoUseItem.Response) => {
            if (b) {
                DataCenter.instance.updateRichByType(RICH_TYPE.UPSET, response.richNum);
                this.init();
            }
        };
        this.sendUseItem(RICH_TYPE.UPSET, callBack);
    }
}
fgui.UIObjectFactory.setExtension(CompPropPanel.URL, CompPropPanel);
