/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUICompRuleHint extends fgui.GComponent {

	public UI_TXT_TITLE:fgui.GTextField;
	public UI_BTN_SURE:fgui.GButton;
	public UI_BTN_CLOSE:fgui.GButton;
	public UI_TXT_CONTENT:fgui.GRichTextField;
	public static URL:string = "ui://22u2b061kq4jf";

	public static packageName:string = "challenge";

	public static instance:any | null = null;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompRuleHint.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("challenge", "CompRuleHint") as FGUICompRuleHint;

			view.makeFullScreen();
			FGUICompRuleHint.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{Logger.error("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompRuleHint.instance = null;
	}
	public static hideView():void {
		FGUICompRuleHint.instance && FGUICompRuleHint.instance.dispose();
	}

	show(data?:any):void{};

	public static createInstance():FGUICompRuleHint {
		return <FGUICompRuleHint>(fgui.UIPackage.createObject("challenge", "CompRuleHint"));
	}

	protected onConstruct():void {
		this.UI_TXT_TITLE = <fgui.GTextField>(this.getChildAt(1));
		this.UI_BTN_SURE = <fgui.GButton>(this.getChildAt(2));
		this.UI_BTN_SURE.onClick(this.onBtnSure, this);
		this.UI_BTN_CLOSE = <fgui.GButton>(this.getChildAt(3));
		this.UI_BTN_CLOSE.onClick(this.onBtnClose, this);
		this.UI_TXT_CONTENT = <fgui.GRichTextField>(this.getChildAt(4));
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
	onBtnSure():void{};
	onBtnClose():void{};
}
fgui.UIObjectFactory.setExtension(FGUICompRuleHint.URL, FGUICompRuleHint);