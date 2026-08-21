/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUICompProp extends fgui.GButton {

	public ctrl_num:fgui.Controller;
	public UI_LOADER_ICON:fgui.GLoader;
	public UI_TXT_NUM:fgui.GTextField;
	public UI_IMG_MASK:fgui.GImage;
	public static URL:string = "ui://fwundh2cpz9v1b";

	public static packageName:string = "props";

	public static instance:any | null = null;

	public enableAnimation: boolean = false;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompProp.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("props", "CompProp") as FGUICompProp;

			view.makeFullScreen();
			FGUICompProp.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{Logger.error("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompProp.instance = null;
	}
	public static hideView():void {
		FGUICompProp.instance && FGUICompProp.instance.dispose();
	}

	show(data?:any):void{};

	enterAnimation(): void {
		fgui.GTween.to2(0, 0, 1, 1, 0.3)
		    .setTarget(this)
		    .setEase(fgui.EaseType.BackOut)
		    .onUpdate((tween) => {
		        this.setScale(tween.value.x, tween.value.y);
		    });
	}

	hideAnimation(onComplete?: () => void): void {
		fgui.GTween.to2(1, 1, 0, 0, 0.3)
		    .setTarget(this)
		    .setEase(fgui.EaseType.BackIn)
		    .onUpdate((tween) => {
		        this.setScale(tween.value.x, tween.value.y);
		    })
		    .onComplete(() => {
		        onComplete && onComplete();
		    });
	}

	public static createInstance():FGUICompProp {
		return <FGUICompProp>(fgui.UIPackage.createObject("props", "CompProp"));
	}

	protected onConstruct():void {
		this.ctrl_num = this.getControllerAt(0);
		this.UI_LOADER_ICON = <fgui.GLoader>(this.getChildAt(1));
		this.UI_TXT_NUM = <fgui.GTextField>(this.getChildAt(3));
		this.UI_IMG_MASK = <fgui.GImage>(this.getChildAt(4));
		if (this.enableAnimation) this.enterAnimation();
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
}
fgui.UIObjectFactory.setExtension(FGUICompProp.URL, FGUICompProp);