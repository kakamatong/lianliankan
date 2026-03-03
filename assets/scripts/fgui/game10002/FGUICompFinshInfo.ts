/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";

import { PackageManager } from "../../frameworks/PackageManager";

export default class FGUICompFinshInfo extends fgui.GComponent {

	public UI_TXT_RANK:fgui.GTextField;
	public UI_TXT_TIME:fgui.GTextField;
	public static URL:string = "ui://2zsfe53xmnt118";

	public static packageName:string = "game10002";

	public static instance:any | null = null;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompFinshInfo.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("game10002", "CompFinshInfo") as FGUICompFinshInfo;

			view.makeFullScreen();
			FGUICompFinshInfo.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{console.log("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompFinshInfo.instance = null;
	}
	public static hideView():void {
		FGUICompFinshInfo.instance && FGUICompFinshInfo.instance.dispose();
	}

	show(data?:any):void{};

	public static createInstance():FGUICompFinshInfo {
		return <FGUICompFinshInfo>(fgui.UIPackage.createObject("game10002", "CompFinshInfo"));
	}

	protected onConstruct():void {
		this.UI_TXT_RANK = <fgui.GTextField>(this.getChildAt(4));
		this.UI_TXT_TIME = <fgui.GTextField>(this.getChildAt(5));
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
}
fgui.UIObjectFactory.setExtension(FGUICompFinshInfo.URL, FGUICompFinshInfo);