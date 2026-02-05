/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";
import FGUICompPlayerHead from "./FGUICompPlayerHead";
import FGUICompClock from "./FGUICompClock";
import FGUICompGameStartAct from "./FGUICompGameStartAct";
import FGUICompRoundAct from "./FGUICompRoundAct";

import { PackageManager } from "../../frameworks/PackageManager";

export default class FGUICompGameMain extends fgui.GComponent {

	public ctrl_btn:fgui.Controller;
	public ctrl_roomtype:fgui.Controller;
	public ctrl_playerCnt:fgui.Controller;
	public UI_BTN_DISBAND:fgui.GButton;
	public UI_BTN_BACK:fgui.GButton;
	public UI_BTN_INVITE:fgui.GButton;
	public UI_COMP_PLAYER_3:FGUICompPlayerHead;
	public UI_COMP_PLAYER_2:FGUICompPlayerHead;
	public UI_COMP_PLAYER_1:FGUICompPlayerHead;
	public UI_IMG_SIGN_READY_3:fgui.GImage;
	public UI_IMG_SIGN_READY_2:fgui.GImage;
	public UI_IMG_SIGN_READY_1:fgui.GImage;
	public UI_BTN_SURE:fgui.GButton;
	public UI_BTN_CHANGE:fgui.GButton;
	public UI_BTN_CONTINUE:fgui.GButton;
	public UI_BTN_READY:fgui.GButton;
	public UI_COMP_CLOCK:FGUICompClock;
	public UI_COMP_GAME_START:FGUICompGameStartAct;
	public UI_TXT_ROOMID:fgui.GTextField;
	public UI_TXT_RULE:fgui.GTextField;
	public UI_TXT_PROGRESS:fgui.GTextField;
	public UI_COMP_ROUND_ACT:FGUICompRoundAct;
	public UI_BTN_TALK:fgui.GButton;
	public static URL:string = "ui://2zsfe53xln74p";

	public static packageName:string = "game10002";

	public static instance:any | null = null;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompGameMain.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("game10002", "CompGameMain") as FGUICompGameMain;

			view.makeFullScreen();
			FGUICompGameMain.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{console.log("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompGameMain.instance = null;
	}
	public static hideView():void {
		FGUICompGameMain.instance && FGUICompGameMain.instance.dispose();
	}

	show(data?:any):void{};

	public static createInstance():FGUICompGameMain {
		return <FGUICompGameMain>(fgui.UIPackage.createObject("game10002", "CompGameMain"));
	}

	protected onConstruct():void {
		this.ctrl_btn = this.getControllerAt(0);
		this.ctrl_roomtype = this.getControllerAt(1);
		this.ctrl_playerCnt = this.getControllerAt(2);
		this.UI_BTN_DISBAND = <fgui.GButton>(this.getChildAt(0));
		this.UI_BTN_DISBAND.onClick(this.onBtnDisband, this);
		this.UI_BTN_BACK = <fgui.GButton>(this.getChildAt(1));
		this.UI_BTN_BACK.onClick(this.onBtnBack, this);
		this.UI_BTN_INVITE = <fgui.GButton>(this.getChildAt(2));
		this.UI_BTN_INVITE.onClick(this.onBtnInvite, this);
		this.UI_COMP_PLAYER_3 = <FGUICompPlayerHead>(this.getChildAt(3));
		this.UI_COMP_PLAYER_2 = <FGUICompPlayerHead>(this.getChildAt(4));
		this.UI_COMP_PLAYER_1 = <FGUICompPlayerHead>(this.getChildAt(5));
		this.UI_IMG_SIGN_READY_3 = <fgui.GImage>(this.getChildAt(6));
		this.UI_IMG_SIGN_READY_2 = <fgui.GImage>(this.getChildAt(7));
		this.UI_IMG_SIGN_READY_1 = <fgui.GImage>(this.getChildAt(8));
		this.UI_BTN_SURE = <fgui.GButton>(this.getChildAt(9));
		this.UI_BTN_SURE.onClick(this.onBtnSure, this);
		this.UI_BTN_CHANGE = <fgui.GButton>(this.getChildAt(10));
		this.UI_BTN_CHANGE.onClick(this.onBtnChange, this);
		this.UI_BTN_CONTINUE = <fgui.GButton>(this.getChildAt(11));
		this.UI_BTN_CONTINUE.onClick(this.onBtnContinue, this);
		this.UI_BTN_READY = <fgui.GButton>(this.getChildAt(12));
		this.UI_BTN_READY.onClick(this.onBtnReady, this);
		this.UI_COMP_CLOCK = <FGUICompClock>(this.getChildAt(14));
		this.UI_COMP_GAME_START = <FGUICompGameStartAct>(this.getChildAt(15));
		this.UI_TXT_ROOMID = <fgui.GTextField>(this.getChildAt(17));
		this.UI_TXT_RULE = <fgui.GTextField>(this.getChildAt(18));
		this.UI_TXT_PROGRESS = <fgui.GTextField>(this.getChildAt(19));
		this.UI_COMP_ROUND_ACT = <FGUICompRoundAct>(this.getChildAt(23));
		this.UI_BTN_TALK = <fgui.GButton>(this.getChildAt(24));
		this.UI_BTN_TALK.onClick(this.onBtnTalk, this);
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
	onBtnDisband():void{};
	onBtnBack():void{};
	onBtnInvite():void{};
	onBtnSure():void{};
	onBtnChange():void{};
	onBtnContinue():void{};
	onBtnReady():void{};
	onBtnTalk():void{};
}
fgui.UIObjectFactory.setExtension(FGUICompGameMain.URL, FGUICompGameMain);