/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";
import FGUICompStarAni from "./FGUICompStarAni";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUICompWin extends fgui.GComponent {

	public UI_COMP_STAR:FGUICompStarAni;
	public UI_BTN_NEXT:fgui.GButton;
	public static URL:string = "ui://xjoxe981iccm3";

	public static packageName:string = "gameChallengeResult";

	public static instance:any | null = null;

	public enableAnimation: boolean = false;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompWin.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("gameChallengeResult", "CompWin") as FGUICompWin;

			view.makeFullScreen();
			FGUICompWin.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{Logger.error("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompWin.instance = null;
	}
	public static hideView():void {
		FGUICompWin.instance && FGUICompWin.instance.dispose();
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

	public static createInstance():FGUICompWin {
		return <FGUICompWin>(fgui.UIPackage.createObject("gameChallengeResult", "CompWin"));
	}

	protected onConstruct():void {
		this.UI_COMP_STAR = <FGUICompStarAni>(this.getChildAt(2));
		this.UI_BTN_NEXT = <fgui.GButton>(this.getChildAt(3));
		this.UI_BTN_NEXT.onClick(this.onBtnNext, this);
		if (this.enableAnimation) this.enterAnimation();
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
	onBtnNext():void{};
}
fgui.UIObjectFactory.setExtension(FGUICompWin.URL, FGUICompWin);