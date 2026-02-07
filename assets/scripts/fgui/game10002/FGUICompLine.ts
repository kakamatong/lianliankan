/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";

import { PackageManager } from "../../frameworks/PackageManager";

export default class FGUICompLine extends fgui.GComponent {

	public line:fgui.GImage;
	public static URL:string = "ui://2zsfe53x8yj8v";

	public static packageName:string = "game10002";

	public static instance:any | null = null;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompLine.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("game10002", "CompLine") as FGUICompLine;

			view.makeFullScreen();
			FGUICompLine.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{console.log("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompLine.instance = null;
	}
	public static hideView():void {
		FGUICompLine.instance && FGUICompLine.instance.dispose();
	}

	show(data?:any):void{};

	public static createInstance():FGUICompLine {
		return <FGUICompLine>(fgui.UIPackage.createObject("game10002", "CompLine"));
	}

	protected onConstruct():void {
		this.line = <fgui.GImage>(this.getChildAt(0));
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
}
fgui.UIObjectFactory.setExtension(FGUICompLine.URL, FGUICompLine);