/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";

import { PackageManager } from "../../frameworks/PackageManager";

export default class FGUICompCube extends fgui.GComponent {

	public UI_LOADER_ICOM:fgui.GLoader;
	public static URL:string = "ui://2zsfe53xhs3tr";

	public static packageName:string = "game10002";

	public static instance:any | null = null;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompCube.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("game10002", "CompCube") as FGUICompCube;

			view.makeFullScreen();
			FGUICompCube.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{console.log("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompCube.instance = null;
	}
	public static hideView():void {
		FGUICompCube.instance && FGUICompCube.instance.dispose();
	}

	show(data?:any):void{};

	public static createInstance():FGUICompCube {
		return <FGUICompCube>(fgui.UIPackage.createObject("game10002", "CompCube"));
	}

	protected onConstruct():void {
		this.UI_LOADER_ICOM = <fgui.GLoader>(this.getChildAt(0));
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
}
fgui.UIObjectFactory.setExtension(FGUICompCube.URL, FGUICompCube);