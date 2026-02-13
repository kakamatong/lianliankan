/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";

import { PackageManager } from "../../frameworks/PackageManager";

export default class FGUICompPlayers extends fgui.GComponent {

	public UI_LIST_OTHER_PLAYERS:fgui.GList;
	public static URL:string = "ui://2zsfe53xpgw3x";

	public static packageName:string = "game10002";

	public static instance:any | null = null;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompPlayers.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("game10002", "CompPlayers") as FGUICompPlayers;

			view.makeFullScreen();
			FGUICompPlayers.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{console.log("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompPlayers.instance = null;
	}
	public static hideView():void {
		FGUICompPlayers.instance && FGUICompPlayers.instance.dispose();
	}

	show(data?:any):void{};

	public static createInstance():FGUICompPlayers {
		return <FGUICompPlayers>(fgui.UIPackage.createObject("game10002", "CompPlayers"));
	}

	protected onConstruct():void {
		this.UI_LIST_OTHER_PLAYERS = <fgui.GList>(this.getChildAt(0));
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
}
fgui.UIObjectFactory.setExtension(FGUICompPlayers.URL, FGUICompPlayers);