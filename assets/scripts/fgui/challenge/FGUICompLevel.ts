/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";
import FGUICompStar from "./FGUICompStar";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUICompLevel extends fgui.GButton {

	public ctrl_status:fgui.Controller;
	public UI_LOAD_ICON:fgui.GLoader;
	public UI_COMP_STAR_0:FGUICompStar;
	public UI_COMP_STAR_1:FGUICompStar;
	public UI_COMP_STAR_2:FGUICompStar;
	public UI_TXT_INDEX:fgui.GTextField;
	public static URL:string = "ui://22u2b061vcww5";

	public static packageName:string = "challenge";

	public static instance:any | null = null;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompLevel.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("challenge", "CompLevel") as FGUICompLevel;

			view.makeFullScreen();
			FGUICompLevel.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{Logger.error("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompLevel.instance = null;
	}
	public static hideView():void {
		FGUICompLevel.instance && FGUICompLevel.instance.dispose();
	}

	show(data?:any):void{};

	public static createInstance():FGUICompLevel {
		return <FGUICompLevel>(fgui.UIPackage.createObject("challenge", "CompLevel"));
	}

	protected onConstruct():void {
		this.ctrl_status = this.getControllerAt(0);
		this.UI_LOAD_ICON = <fgui.GLoader>(this.getChildAt(0));
		this.UI_COMP_STAR_0 = <FGUICompStar>(this.getChildAt(1));
		this.UI_COMP_STAR_1 = <FGUICompStar>(this.getChildAt(2));
		this.UI_COMP_STAR_2 = <FGUICompStar>(this.getChildAt(3));
		this.UI_TXT_INDEX = <fgui.GTextField>(this.getChildAt(4));
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
}
fgui.UIObjectFactory.setExtension(FGUICompLevel.URL, FGUICompLevel);