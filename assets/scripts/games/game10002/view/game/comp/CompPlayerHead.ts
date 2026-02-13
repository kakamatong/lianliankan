import FGUICompPlayerHead from "../../../../../fgui/game10002/FGUICompPlayerHead";
import { GameData } from "../../../data/GameData";
import { PlayerInfoView } from "../../playerInfo/PlayerInfoView";
import { CompTalk } from "./CompTalk";
import { ViewClass } from "db://assets/scripts/frameworks/Framework";
import * as fgui from "fairygui-cc";
@ViewClass()
export class CompPlayerHead extends FGUICompPlayerHead {
    public localSeat: number = 0;

    protected onConstruct() {
        super.onConstruct();
        this.initUI();
    }

    initUI() {
        this.UI_COMP_HEAD.onClick(this.onHeadClick, this);
        this.updateTalkSeat(this.localSeat);
    }

    onHeadClick(): void {
        const player = GameData.instance.getPlayerByLocal(this.localSeat);
        if (player) {
            PlayerInfoView.showView({ userid: player.userid, cp: player.cp });
        }
    }

    showMsg(msg: string): void {
        (this.UI_COMP_TALK as CompTalk).talkMsg = msg;
    }

    updateTalkSeat(seat: number): void {
        (this.UI_COMP_TALK as CompTalk).localSeat = seat;
    }

    /**
     * 显示或隐藏准备标识
     * @param bshow 是否显示
     */
    showSignReady(bshow: boolean): void {
        // @ts-ignore - 基类中定义
        this.UI_IMG_SIGN_READY.visible = bshow;
    }
}
fgui.UIObjectFactory.setExtension(CompPlayerHead.URL, CompPlayerHead);
