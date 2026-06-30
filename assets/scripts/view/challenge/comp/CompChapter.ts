/**
 * @file CompChapter.ts
 * @description 章节组件：展示章节关卡列表，支持上一章/下一章切换
 * @category 闯关视图
 */

import { ChallengeData, MAP_LEVEL_CONFIG } from "@datacenter/ChallengeData";
import FGUICompChapter from "@fgui/challenge/FGUICompChapter";
import { ViewClass } from "@frameworks/Framework";
import * as fgui from "fairygui-cc";
import { CompLevel, LEVEL_STATUS, STAR_COUNT } from "./CompLevel";
import { Logger } from "@frameworks/utils/Utils";
import { Challenge } from "@modules/Challenge";
import { ChallengeRuleHintView } from "@view/challenge/ChallengeRuleHintView";

@ViewClass()
export class CompChapter extends FGUICompChapter {
    /**
     * @property {number} _chapterIndex - 当前章节索引
     * @private
     */
    private _chapterIndex: number = 0;

    /**
     * @property {MAP_LEVEL_CONFIG[]} _chapterConfig - 当前章节关卡配置数据
     * @private
     */
    private _chapterConfig: MAP_LEVEL_CONFIG[] = [];

    /**
     * @property {number} _chapterCount - 章节总数
     * @private
     */
    private _chapterCount: number = 0;

    onConstruct() {
        super.onConstruct();
        this.init();
    }

    /**
     * @method init
     * @description 初始化组件：设置列表渲染器、拉取配置、获取当前章节、显示关卡列表
     * @private
     */
    private init() {
        this.UI_LV_ITEMS.itemRenderer = this.itemRenderer.bind(this);
        Challenge.instance.getConfig((success) => {
            if (success) {
                this._chapterCount = ChallengeData.instance.chapterCount;
                Challenge.instance.getCurChapterData((ok, curChapter) => {
                    if (ok && curChapter !== undefined) {
                        this._chapterIndex = curChapter;
                    }
                    this.showChapter(this._chapterIndex);
                });
                Logger.log("闯关配置获取成功");
            } else {
                Logger.warn("闯关配置获取失败");
            }
        });
    }

    /**
     * @method showChapter
     * @description 加载并显示指定章节的关卡列表（地图配置 + 玩家数据），有缓存则跳过请求，同时更新按钮状态
     * @param {number} index - 章节索引
     * @private
     */
    private async showChapter(index: number) {
        const configPromise = ChallengeData.instance.loadChapterConfig(index);

        const hasData = !!ChallengeData.instance.getChapterData(index);
        const levelDataPromise = hasData
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                  Challenge.instance.getChapterData(index, () => resolve());
              });

        const [config] = await Promise.all([configPromise, levelDataPromise]);
        this._chapterConfig = config ?? [];
        this.UI_LV_ITEMS.numItems = this._chapterConfig.length;
        this.updateButtons();
    }

    /**
     * @method onBtnNext
     * @description 点击下一章：索引 +1 并重新渲染
     */
    onBtnNext(): void {
        if (this._chapterIndex < this._chapterCount - 1) {
            this._chapterIndex++;
            this.showChapter(this._chapterIndex);
        }
    }

    /**
     * @method onBtnPre
     * @description 点击上一章：索引 -1 并重新渲染
     */
    onBtnPre(): void {
        if (this._chapterIndex > 0) {
            this._chapterIndex--;
            this.showChapter(this._chapterIndex);
        }
    }

    /**
     * @method updateButtons
     * @description 根据当前章节索引更新上一章/下一章按钮可见性
     * @private
     */
    private updateButtons(): void {
        if (this.UI_BTN_PRE) {
            this.UI_BTN_PRE.visible = this._chapterIndex > 0;
        }
        if (this.UI_BTN_NEXT) {
            this.UI_BTN_NEXT.visible = this._chapterIndex < this._chapterCount - 1;
        }
    }

    /**
     * @method itemRenderer
     * @description 章节列表项渲染器：根据玩家数据决定关卡状态和星级展示
     * @param {number} index - 列表索引
     * @param {fgui.GObject} item - 列表项对象
     * @private
     */
    private itemRenderer(index: number, item: fgui.GObject) {
        const chapterItem = item as CompLevel;
        const config = this._chapterConfig[index];
        const levelData = ChallengeData.instance.getLevelData(this._chapterIndex, config.index);
        if (!config || !chapterItem) return;

        chapterItem.setLevelName(`${config.index + 1}`);
        chapterItem.clearClick();

        if (!levelData) {
            // 如果当前章节是玩家所在章节，并且关卡索引是当前关卡，则设置为进行中状态
            if (this._chapterIndex === ChallengeData.instance.curChapter && index === ChallengeData.instance.curLevel) {
                if (config.boss === 1) {
                    chapterItem.setStatus(LEVEL_STATUS.BOSS);
                } else {
                    chapterItem.setStatus(LEVEL_STATUS.IN_PROGRESS);
                }
                chapterItem.touchable = true;
                this.UI_LV_ITEMS.scrollPane.scrollToView(index, true, true);
                chapterItem.onClick(() => {
                    this.onBtnLevel(this._chapterIndex, config.index);
                });
            } else {
                chapterItem.setStatus(LEVEL_STATUS.LOCKED);
                chapterItem.touchable = false;
            }

            chapterItem.setStars(STAR_COUNT.HIDE);
        } else {
            chapterItem.setStars(levelData.stars);
            if (config.boss === 1) {
                chapterItem.setStatus(LEVEL_STATUS.BOSS);
            } else {
                chapterItem.setStatus(LEVEL_STATUS.COMPLETED);
            }

            chapterItem.onClick(() => {
                this.onBtnLevel(this._chapterIndex, config.index);
            });
        }
    }

    private onBtnLevel(chapter: number, level: number) {
        Logger.log(`点击关卡: ${chapter}-${level}`);
        // 这里可以添加点击关卡后的逻辑，例如进入关卡详情或开始挑战
        const msg = this.getRule(chapter, level);
        ChallengeRuleHintView.showView({
            title: "温馨提示",
            content: msg,
            sureBack: () => {
                Logger.log("进入对战");
            },
        });
    }

    private getRule(chapter: number, level: number): string {
        const config = this._chapterConfig.find((c) => c.index === level);
        if (!config) {
            return "关卡配置不存在";
        }

        if (config.type == 1) {
            return `在 [color=#FF0000]${config.totalTime}[/color] 秒内完成挑战`;
        } else if (config.type == 2) {
            return ``;
        }
    }
}

fgui.UIObjectFactory.setExtension(CompChapter.URL, CompChapter);
