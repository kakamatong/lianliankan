/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";
import FGUICompChapter from "./FGUICompChapter";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUICompChallenge extends fgui.GComponent {

	public UI_BTN_CLOSE:fgui.GButton;
	public UI_BTN_TEST_ADD:fgui.GButton;
	public UI_BTN_TEST_REDUCE:fgui.GButton;
	public UI_COMP_CHAPTER:FGUICompChapter;
	public static URL:string = "ui://22u2b061hot01";

	public static packageName:string = "challenge";

	public static instance:any | null = null;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompChallenge.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("challenge", "CompChallenge") as FGUICompChallenge;

			view.makeFullScreen();
			FGUICompChallenge.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{Logger.error("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompChallenge.instance = null;
	}
	public static hideView():void {
		FGUICompChallenge.instance && FGUICompChallenge.instance.dispose();
	}

	show(data?:any):void{};

	public static createInstance():FGUICompChallenge {
		return <FGUICompChallenge>(fgui.UIPackage.createObject("challenge", "CompChallenge"));
	}

	protected onConstruct():void {
		this.UI_BTN_CLOSE = <fgui.GButton>(this.getChildAt(2));
		this.UI_BTN_CLOSE.onClick(this.onBtnClose, this);
		this.UI_BTN_TEST_ADD = <fgui.GButton>(this.getChildAt(3));
		this.UI_BTN_TEST_ADD.onClick(this.onBtnTestAdd, this);
		this.UI_BTN_TEST_REDUCE = <fgui.GButton>(this.getChildAt(4));
		this.UI_BTN_TEST_REDUCE.onClick(this.onBtnTestReduce, this);
		this.UI_COMP_CHAPTER = <FGUICompChapter>(this.getChildAt(5));
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
	onBtnClose():void{};
	onBtnTestAdd():void{};
	onBtnTestReduce():void{};
}
fgui.UIObjectFactory.setExtension(FGUICompChallenge.URL, FGUICompChallenge);