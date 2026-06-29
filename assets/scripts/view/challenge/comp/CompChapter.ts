/**
 * @file CompChapter.ts
 * @description 章节组件
 * @category 闯关视图
 */

import { ChallengeConfig, MAP_LEVEL_CONFIG } from "@datacenter/ChallengeConfig";
import FGUICompChapter from "@fgui/challenge/FGUICompChapter";
import { ViewClass } from "@frameworks/Framework";
import * as fgui from "fairygui-cc";
import { CompLevel } from "./CompLevel";
import { Logger } from "@frameworks/utils/Utils";
import { Challenge } from "@modules/Challenge";

@ViewClass()
export class CompChapter extends FGUICompChapter {
    // 章节索引
    private _chapterIndex: number = 0;

    // 章节配置数据
    private _chapterConfig: MAP_LEVEL_CONFIG[] = [];

    onConstruct() {
        super.onConstruct();
        this.init();
    }

    /**
     * @method init
     * @description 初始化组件
     */
    init() {
        this.UI_LV_ITEMS.itemRenderer = this.itemRenderer.bind(this);
        Challenge.instance.getConfig((success, data) => {
            if (success) {
                this.showChapter(this._chapterIndex);
                Logger.log("闯关配置获取成功");
            } else {
                Logger.warn("闯关配置获取失败");
            }
        });
    }

    /**
     * @method showChapter
     * @description 显示章节关卡列表
     * @param {number} index - 章节索引
     */
    async showChapter(index: number) {
        const config = await ChallengeConfig.instance.loadChapterConfig(index);
        this._chapterConfig = config ?? [];
        this.UI_LV_ITEMS.numItems = this._chapterConfig.length;
    }

    /**
     * @method itemRenderer
     * @description 章节列表渲染器
     * @param {number} index - 索引
     * @param {fgui.GObject} item - 列表项对象
     */
    itemRenderer(index: number, item: fgui.GObject) {
        const chapterItem = item as CompLevel;
        const config = this._chapterConfig[index];
        if (config && chapterItem) {
            chapterItem.setLevelName(`${config.index + 1}`);
            //chapterItem.setStatus(config.status);
            //chapterItem.setStars(config.stars);
        }
    }
}

fgui.UIObjectFactory.setExtension(CompChapter.URL, CompChapter);
