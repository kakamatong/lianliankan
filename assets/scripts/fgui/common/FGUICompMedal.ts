/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";

import { PackageManager } from "../../frameworks/PackageManager";

export default class FGUICompMedal extends fgui.GComponent {

	public ctrl_rank:fgui.Controller;
	public static URL:string = "ui://gj0r6g5ieijp1f";

	public static packageName:string = "common";

	public static instance:any | null = null;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompMedal.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("common", "CompMedal") as FGUICompMedal;

			view.makeFullScreen();
			FGUICompMedal.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{console.log("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompMedal.instance = null;
	}
	public static hideView():void {
		FGUICompMedal.instance && FGUICompMedal.instance.dispose();
	}

	show(data?:any):void{};

	public static createInstance():FGUICompMedal {
		return <FGUICompMedal>(fgui.UIPackage.createObject("common", "CompMedal"));
	}

	protected onConstruct():void {
		this.ctrl_rank = this.getControllerAt(0);
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
}
fgui.UIObjectFactory.setExtension(FGUICompMedal.URL, FGUICompMedal);