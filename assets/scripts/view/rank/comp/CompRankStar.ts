/**
 * @file CompRankStar.ts
 * @description 星星排行榜组件：ctrl_day 控制器（本周/上周）驱动取数与渲染
 * @category 排行榜视图
 */

import * as fgui from "fairygui-cc";
import { ViewClass } from "@frameworks/Framework";
import FGUICompRankStar from "@fgui/rank/FGUICompRankStar";
import { CompRankInfo } from "./CompRankInfo";
import { Rank } from "@modules/Rank";
import { ChallengeData } from "@datacenter/ChallengeData";
import { RankStarView } from "../RankStarView";
import { LoadingView } from "../../common/LoadingView";
import { TipsView } from "../../common/TipsView";

/** 服务端未上榜时返回的名次占位值（与服务端 activity/starRank.lua 一致） */
const RANK_NONE = 999999;

/**
 * @class CompRankStar
 * @description 星星周榜主组件：监听 ctrl_day 切换周次，按 5 分钟全局缓存取数并渲染榜单
 * @category 排行榜视图
 */
@ViewClass()
export class CompRankStar extends FGUICompRankStar {
    /**
     * @property {number} _weekOffset - 当前展示的周偏移：0=本周，-1=上周
     * @private
     */
    private _weekOffset: number = 0;

    /**
     * @property {any[]} _listData - 当前榜单数据，作为列表渲染源
     * @private
     */
    private _listData: any[] = [];

    onConstruct(): void {
        super.onConstruct();
        this.UI_LV_RANK.itemRenderer = this.itemRenderer.bind(this);
        // ctrl_day 由 FGUI 页签按钮（本周/上周）驱动，这里只监听变化后取数
        this.ctrl_day.onChanged(this.onDayChanged, this);
        this._weekOffset = this.getWeekOffset();
        this.refresh();
    }

    onDestroy(): void {
        super.onDestroy();
        this.ctrl_day.offChanged(this.onDayChanged, this);
    }

    /**
     * @method onBtnClose
     * @description 关闭按钮：关闭星星排行榜弹窗
     */
    onBtnClose(): void {
        RankStarView.hideView();
    }

    /**
     * @method getWeekOffset
     * @description 读取 ctrl_day 当前页对应的周偏移
     * @returns {number} 0=本周（第 1 页），-1=上周（第 2 页）
     * @private
     */
    private getWeekOffset(): number {
        return this.ctrl_day.selectedIndex === 1 ? -1 : 0;
    }

    /**
     * @method onDayChanged
     * @description ctrl_day 切换回调：周次变化时按缓存策略重新取数并渲染
     * @private
     */
    private onDayChanged(): void {
        const offset = this.getWeekOffset();
        if (offset === this._weekOffset) {
            return;
        }
        this._weekOffset = offset;
        this.refresh();
    }

    /**
     * @method refresh
     * @description 取数并渲染：命中 5 分钟全局缓存直接渲染，否则请求服务端后入缓存
     * @private
     */
    private refresh(): void {
        const offset = this._weekOffset;
        const cached = ChallengeData.instance.getStarRank(offset);
        if (cached) {
            this.render(cached);
            return;
        }

        LoadingView.showView({ content: "拉取数据中...", time: 12 });
        Rank.instance.reqStarRank(offset, (success: boolean, data: any) => {
            LoadingView.hideView();
            if (!success || !data) {
                TipsView.showView({ content: "拉取排行榜数据失败" });
                return;
            }
            // 请求期间可能已切到另一周：数据照常入缓存，但只渲染当前选中周
            ChallengeData.instance.setStarRank(offset, data);
            if (offset !== this._weekOffset) {
                return;
            }
            this.render(data);
        });
    }

    /**
     * @method render
     * @description 渲染榜单列表与本人名次
     * @param {any} data - 服务端返回的 { rank, rankList }
     * @private
     */
    private render(data: any): void {
        this._listData = this.parseRankList(data);
        this.UI_LV_RANK.numItems = this._listData.length;
        const rank = data && data.rank != null ? data.rank : RANK_NONE;
        this.UI_TXT_SELF_RANK.text = rank == RANK_NONE ? "未上榜" : `${rank + 1}`;
    }

    /**
     * @method parseRankList
     * @description 解析服务端下发的 rankList（JSON 字符串），异常时返回空列表
     * @param {any} data - 服务端返回数据
     * @returns {any[]} 榜单数组
     * @private
     */
    private parseRankList(data: any): any[] {
        if (!data || !data.rankList) {
            return [];
        }
        try {
            const list = JSON.parse(data.rankList);
            return Array.isArray(list) ? list : [];
        } catch (e) {
            return [];
        }
    }

    /**
     * @method itemRenderer
     * @description 列表项渲染：名次按展示序重算，玩家/星星取服务端数据
     * @param {number} index - 列表索引
     * @param {fgui.GObject} item - 列表项
     * @private
     */
    private itemRenderer(index: number, item: fgui.GObject): void {
        const itemData = this._listData[index];
        if (!itemData) {
            return;
        }
        itemData.rank = `${index + 1}`;
        (item as CompRankInfo).show(itemData);
    }
}

fgui.UIObjectFactory.setExtension(CompRankStar.URL, CompRankStar);
