/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";
import FGUICompPlayerHead from "./FGUICompPlayerHead";
import FGUICompMap from "./FGUICompMap";

import { PackageManager } from "../../frameworks/PackageManager";

export default class FGUICompOtherPlayer extends fgui.GComponent {

	public UI_COMP_HEAD:FGUICompPlayerHead;
	public UI_COMP_MAP:FGUICompMap;
	public static URL:string = "ui://2zsfe53xpgw3w";

	public static packageName:string = "game10002";

	public static instance:any | null = null;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompOtherPlayer.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("game10002", "CompOtherPlayer") as FGUICompOtherPlayer;

			view.makeFullScreen();
			FGUICompOtherPlayer.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{console.log("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompOtherPlayer.instance = null;
	}
	public static hideView():void {
		FGUICompOtherPlayer.instance && FGUICompOtherPlayer.instance.dispose();
	}

	show(data?:any):void{};

	public static createInstance():FGUICompOtherPlayer {
		return <FGUICompOtherPlayer>(fgui.UIPackage.createObject("game10002", "CompOtherPlayer"));
	}

	protected onConstruct():void {
		this.UI_COMP_HEAD = <FGUICompPlayerHead>(this.getChildAt(0));
		this.UI_COMP_MAP = <FGUICompMap>(this.getChildAt(1));
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
}
fgui.UIObjectFactory.setExtension(FGUICompOtherPlayer.URL, FGUICompOtherPlayer);