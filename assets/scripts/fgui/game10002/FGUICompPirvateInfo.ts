/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";

import { PackageManager } from "@frameworks/PackageManager";

export default class FGUICompPirvateInfo extends fgui.GComponent {

	public UI_TXT_ROOMID:fgui.GTextField;
	public UI_TXT_RULE:fgui.GTextField;
	public UI_TXT_PROGRESS:fgui.GTextField;
	public static URL:string = "ui://2zsfe53xouez1a";

	public static packageName:string = "game10002";

	public static instance:any | null = null;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompPirvateInfo.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("game10002", "CompPirvateInfo") as FGUICompPirvateInfo;

			view.makeFullScreen();
			FGUICompPirvateInfo.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{console.log("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompPirvateInfo.instance = null;
	}
	public static hideView():void {
		FGUICompPirvateInfo.instance && FGUICompPirvateInfo.instance.dispose();
	}

	show(data?:any):void{};

	public static createInstance():FGUICompPirvateInfo {
		return <FGUICompPirvateInfo>(fgui.UIPackage.createObject("game10002", "CompPirvateInfo"));
	}

	protected onConstruct():void {
		this.UI_TXT_ROOMID = <fgui.GTextField>(this.getChildAt(1));
		this.UI_TXT_RULE = <fgui.GTextField>(this.getChildAt(2));
		this.UI_TXT_PROGRESS = <fgui.GTextField>(this.getChildAt(3));
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
}
fgui.UIObjectFactory.setExtension(FGUICompPirvateInfo.URL, FGUICompPirvateInfo);