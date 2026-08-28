import { RICH_TYPE } from "@datacenter/InterfaceConfig";
import FGUICompPropPanel from "@fgui/game10002/FGUICompPropPanel";
import { ViewClass } from "@frameworks/Framework";
import { GameSocketManager } from "@frameworks/GameSocketManager";
import * as fgui from "fairygui-cc";
import { SprotoUseItem } from "../../../../../../types/protocol/game10002/c2s";
import { Logger } from "@frameworks/utils/Utils";
import { DataCenter } from "@datacenter/Datacenter";
import { TipsView } from "@view/common/TipsView";
import { GameData } from "../../../data/GameData";
import { LocalGameUseProps } from "@modules/LocalGameUseProps";
import { SprotoLocalGameUseProps } from "../../../../../../types/protocol/lobby/c2s";

@ViewClass()
export class CompPropPanel extends FGUICompPropPanel {
    /** 道具冷却时长（毫秒），冷却期间所有道具不可点击 */
    private static readonly PROP_COOLDOWN_MS: number = 200;

    /** 冷却状态：true=冷却中，所有道具禁止点击 */
    private _inCooldown: boolean = false;

    /** 两个道具按钮的冷却遮罩（UI_IMG_MASK），懒加载缓存 */
    private _masks: fgui.GImage[] | null = null;

    protected onConstruct(): void {
        super.onConstruct();
        this.init();
    }

    /**
     * @method _getMasks
     * @description 获取两个道具按钮的冷却遮罩 UI_IMG_MASK（懒加载并缓存）
     * @returns {fgui.GImage[]} 遮罩图片数组（打乱、自动移除）
     * @private
     */
    private _getMasks(): fgui.GImage[] {
        if (!this._masks) {
            this._masks = [
                this.UI_BTN_UPSET.getChild("UI_IMG_MASK") as fgui.GImage,
                this.UI_BTN_AUTO_REMOVE.getChild("UI_IMG_MASK") as fgui.GImage,
            ];
        }
        return this._masks;
    }

    /**
     * @method playCooldownAnimation
     * @description 播放冷却遮罩动画：显示两个 UI_IMG_MASK，fillAmount 从 1 降到 0（与冷却时长一致），动画结束后隐藏
     * @private
     */
    private playCooldownAnimation(): void {
        const masks = this._getMasks();
        for (const mask of masks) {
            if (!mask) {
                continue;
            }
            fgui.GTween.kill(mask);
            mask.fillAmount = 1;
            mask.visible = true;
            fgui.GTween.to(1, 0, CompPropPanel.PROP_COOLDOWN_MS / 1000)
                .setTarget(mask)
                .setEase(fgui.EaseType.Linear)
                .onUpdate((tween) => {
                    if (mask && !mask.isDisposed) {
                        mask.fillAmount = tween.value.x;
                    }
                })
                .onComplete(() => {
                    if (mask && !mask.isDisposed) {
                        mask.visible = false;
                    }
                });
        }
    }

    /**
     * @method checkCooldown
     * @description 检查道具是否处于冷却中：冷却中弹出提示并拦截，否则开始冷却计时
     * @returns {boolean} true=冷却中，禁止使用道具
     * @private
     */
    private checkCooldown(): boolean {
        if (this._inCooldown) {
            TipsView.showView({ content: "冷却中" });
            return true;
        }
        this._inCooldown = true;
        this.scheduleOnce(() => {
            this._inCooldown = false;
        }, CompPropPanel.PROP_COOLDOWN_MS / 1000);
        this.playCooldownAnimation();
        return false;
    }

    /**
     * 初始化
     */
    init(): void {
        const upSetNums = DataCenter.instance.getRichByType(RICH_TYPE.UPSET);
        this.showNums(this.UI_BTN_UPSET, upSetNums?.richNums || 0);

        const autoRemoveNums = DataCenter.instance.getRichByType(RICH_TYPE.AUTO_REMOVE);
        this.showNums(this.UI_BTN_AUTO_REMOVE, autoRemoveNums?.richNums || 0);
    }

    /**
     * @method onDestroy
     * @description 组件销毁时清理冷却遮罩动画
     * @protected
     */
    protected onDestroy(): void {
        if (this._masks) {
            for (const mask of this._masks) {
                fgui.GTween.kill(mask);
            }
        }
        super.onDestroy();
    }

    showNums(obj: fgui.GComponent, nums: number): void {
        if (obj) {
            obj.getChild("UI_TXT_NUM").text = `X ${nums}`;
        }
    }
    /**
     * @method isLocalGame
     * @description 判断当前是否为本地游戏（单机游戏或闯关模式）
     * @returns {boolean} true=本地游戏，false=在线游戏
     */
    private isLocalGame(): boolean {
        return GameData.instance.isLocalGame || GameData.instance.isChallengeMode;
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

    checkPropEnough(itemId: number): boolean {
        const richData = DataCenter.instance.getRichByType(itemId);
        if (!richData || !richData.richNums || richData.richNums <= 0) {
            return false;
        }
        return true;
    }

    useLocalGameProp(itemId: number, callBack?: (b: boolean, response: SprotoLocalGameUseProps.Response) => void): void {
        if (!this.isLocalGame()) {
            Logger.warn("非本地游戏无法使用本地道具");
            return;
        }

        if (!this.checkPropEnough(itemId)) {
            TipsView.showView({ content: "道具数量不足" });
            return;
        }

        LocalGameUseProps.instance.req(itemId, 1, (b, response) => {
            if (b) {
                callBack && callBack(true, response);
                Logger.log("本地游戏使用道具成功:", itemId);
            } else {
                callBack && callBack(false, response);
                Logger.error("本地游戏使用道具失败:", response?.msg || "未知错误");
                TipsView.showView({ content: response.msg });
            }
        });
    }

    /**
     * 使用道具: 打乱
     */
    onBtnUpset(): void {
        // 开局入场动画播放中，禁止使用道具
        if (GameData.instance.isMapEntering) {
            return;
        }
        if (this.checkCooldown()) {
            return;
        }
        Logger.log("使用道具: 打乱");
        if (this.isLocalGame()) {
            this.useLocalGameProp(RICH_TYPE.UPSET, (b, response) => {
                if (b) {
                    // todo: 本地游戏打乱后需要重置地图数据
                    this.sendUseItem(RICH_TYPE.UPSET); // 同步使用道具接口，减少本地游戏和在线游戏的差异
                    this.init();
                }
            });
            return;
        }
        const callBack = (b: boolean, response: SprotoUseItem.Response) => {
            if (b) {
                DataCenter.instance.updateRichByType(RICH_TYPE.UPSET, response.richNum);
                this.init();
            }
        };
        this.sendUseItem(RICH_TYPE.UPSET, callBack);
    }

    /**
     * 使用道具： 自动移除
     */
    onBtnAutoRemove(): void {
        // 开局入场动画播放中，禁止使用道具
        if (GameData.instance.isMapEntering) {
            return;
        }
        if (this.checkCooldown()) {
            return;
        }
        Logger.log("使用道具: 自动移除");
        if (this.isLocalGame()) {
            this.useLocalGameProp(RICH_TYPE.AUTO_REMOVE, (b, response) => {
                if (b) {
                    // todo: 本地游戏自动移除后需要重置地图数据
                    this.sendUseItem(RICH_TYPE.AUTO_REMOVE); // 同步使用道具接口，减少本地游戏和在线游戏的差异
                    this.init();
                }
            });
            return;
        }
        const callBack = (b: boolean, response: SprotoUseItem.Response) => {
            if (b) {
                DataCenter.instance.updateRichByType(RICH_TYPE.AUTO_REMOVE, response.richNum);
                this.init();
            }
        };
        this.sendUseItem(RICH_TYPE.AUTO_REMOVE, callBack);
    }
}
fgui.UIObjectFactory.setExtension(CompPropPanel.URL, CompPropPanel);
