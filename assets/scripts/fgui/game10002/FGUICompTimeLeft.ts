/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUICompTimeLeft extends fgui.GComponent {

	public ctrl_warn:fgui.Controller;
	public UI_IMG_BAR:fgui.GImage;
	public UI_TXT_TIME_MSG:fgui.GTextField;
	public act:fgui.Transition;
	public static URL:string = "ui://2zsfe53xmnt112";

	public static packageName:string = "game10002";

	public static instance:any | null = null;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompTimeLeft.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("game10002", "CompTimeLeft") as FGUICompTimeLeft;

			view.makeFullScreen();
			FGUICompTimeLeft.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{Logger.error("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompTimeLeft.instance = null;
	}
	public static hideView():void {
		FGUICompTimeLeft.instance && FGUICompTimeLeft.instance.dispose();
	}

	show(data?:any):void{};

	public static createInstance():FGUICompTimeLeft {
		return <FGUICompTimeLeft>(fgui.UIPackage.createObject("game10002", "CompTimeLeft"));
	}

	protected onConstruct():void {
		this.ctrl_warn = this.getControllerAt(0);
		this.UI_IMG_BAR = <fgui.GImage>(this.getChildAt(1));
		this.UI_TXT_TIME_MSG = <fgui.GTextField>(this.getChildAt(2));
		this.act = this.getTransitionAt(0);
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
}
fgui.UIObjectFactory.setExtension(FGUICompTimeLeft.URL, FGUICompTimeLeft);