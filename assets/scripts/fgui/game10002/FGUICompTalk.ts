/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";

import { PackageManager } from "../../frameworks/PackageManager";

export default class FGUICompTalk extends fgui.GComponent {

	public UI_BG_0:fgui.GImage;
	public UI_TXT_0:fgui.GTextField;
	public static URL:string = "ui://2zsfe53xpxa5n";

	public static packageName:string = "game10002";

	public static instance:any | null = null;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompTalk.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("game10002", "CompTalk") as FGUICompTalk;

			view.makeFullScreen();
			FGUICompTalk.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{console.log("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompTalk.instance = null;
	}
	public static hideView():void {
		FGUICompTalk.instance && FGUICompTalk.instance.dispose();
	}

	show(data?:any):void{};

	public static createInstance():FGUICompTalk {
		return <FGUICompTalk>(fgui.UIPackage.createObject("game10002", "CompTalk"));
	}

	protected onConstruct():void {
		this.UI_BG_0 = <fgui.GImage>(this.getChildAt(0));
		this.UI_TXT_0 = <fgui.GTextField>(this.getChildAt(1));
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
}
fgui.UIObjectFactory.setExtension(FGUICompTalk.URL, FGUICompTalk);