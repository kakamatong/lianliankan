/**
 * @file CompChapter.ts
 * @description 章节组件
 * @category 闯关视图
 */

import FGUICompChapter from "@fgui/challenge/FGUICompChapter";
import { ViewClass } from "@frameworks/Framework";
import * as fgui from "fairygui-cc";

@ViewClass()
export class CompChapter extends FGUICompChapter {
    onConstruct() {
        super.onConstruct();
    }
}

fgui.UIObjectFactory.setExtension(CompChapter.URL, CompChapter);
