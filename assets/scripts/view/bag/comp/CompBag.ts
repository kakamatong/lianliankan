/**
 * @file CompBag.ts
 * @description 背包主组件：背包界面的核心组件
 * @category 背包视图
 */

import FGUICompBag from "@fgui/bag/FGUICompBag";
import { ViewClass, AddEventListener, RemoveEventListener } from "@frameworks/Framework";
import * as fgui from "fairygui-cc";
import { BagView } from "../BagView";

/**
 * @class CompBag
 * @description 背包主组件，负责背包物品列表展示与交互
 * @category 背包视图
 */
@ViewClass({ curveScreenAdapt: true })
export class CompBag extends FGUICompBag {
    /**
     * @method onConstruct
     * @description 组件构建回调，初始化监听和UI
     */
    onConstruct() {
        super.onConstruct();
    }

    /**
     * @method onDestroy
     * @description 组件销毁回调，清理事件监听
     */
    onDestroy() {
        super.onDestroy();
    }

    /**
     * @method onBtnClose
     * @description 关闭按钮点击回调
     */
    onBtnClose() {
        // TODO: 实现关闭逻辑
        BagView.hideView();
    }

    /**
     * @method show
     * @description 显示视图，接收外部传入数据
     * @param {any} [data] - 传入数据
     */
    show(data?: any): void {
        // TODO: 实现数据显示逻辑
    }
}

fgui.UIObjectFactory.setExtension(CompBag.URL, CompBag);
