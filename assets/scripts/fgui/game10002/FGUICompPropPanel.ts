/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";
import FGUICompBtnProp from "./FGUICompBtnProp";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUICompPropPanel extends fgui.GComponent {

	public UI_BTN_AUTO_REMOVE:FGUICompBtnProp;
	public UI_BTN_UPSET:FGUICompBtnProp;
	public static URL:string = "ui://2zsfe53xtw1h1g";

	public static packageName:string = "game10002";

	public static instance:any | null = null;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompPropPanel.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("game10002", "CompPropPanel") as FGUICompPropPanel;

			view.makeFullScreen();
			FGUICompPropPanel.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{Logger.error("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompPropPanel.instance = null;
	}
	public static hideView():void {
		FGUICompPropPanel.instance && FGUICompPropPanel.instance.dispose();
	}

	show(data?:any):void{};

	public static createInstance():FGUICompPropPanel {
		return <FGUICompPropPanel>(fgui.UIPackage.createObject("game10002", "CompPropPanel"));
	}

	protected onConstruct():void {
		this.UI_BTN_AUTO_REMOVE = <FGUICompBtnProp>(this.getChildAt(0));
		this.UI_BTN_AUTO_REMOVE.onClick(this.onBtnAutoRemove, this);
		this.UI_BTN_UPSET = <FGUICompBtnProp>(this.getChildAt(1));
		this.UI_BTN_UPSET.onClick(this.onBtnUpset, this);
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
	onBtnAutoRemove():void{};
	onBtnUpset():void{};
}
fgui.UIObjectFactory.setExtension(FGUICompPropPanel.URL, FGUICompPropPanel);