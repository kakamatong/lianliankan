/**
 * @file PackageConfig.ts
 * @description FGUI 包名配置：集中枚举全部 FGUI 包名，供视图、场景等引用，避免包名硬编码
 * @category 数据中心
 */

/**
 * @enum FGUI_PACKAGE
 * @description FGUI 包名枚举（枚举值即可直接作为 string 使用）
 */
export enum FGUI_PACKAGE {
    /** 奖励 */
    AWARD = "award",
    /** 背包 */
    BAG = "bag",
    /** 闯关 */
    CHALLENGE = "challenge",
    /** 通用 */
    COMMON = "common",
    /** 连连看游戏主包 */
    GAME_10002 = "game10002",
    /** 游戏 10002 玩家信息 */
    GAME_10002_PLAYER_INFO = "game10002PlayerInfo",
    /** 游戏 10002 结果 */
    GAME_10002_RESULT = "game10002Result",
    /** 游戏 10002 聊天 */
    GAME_10002_TALK = "game10002Talk",
    /** 闯关结果 */
    GAME_CHALLENGE_RESULT = "gameChallengeResult",
    /** 游戏通用 */
    GAME_COMMON = "gameCommon",
    /** GM 工具 */
    GM = "gm",
    /** 大厅 */
    LOBBY = "lobby",
    /** 大厅背景 */
    LOBBY_BG = "lobbyBg",
    /** 登录 */
    LOGIN = "login",
    /** 邮件 */
    MAIL = "mail",
    /** 匹配 */
    MATCH = "match",
    /** 隐私协议 */
    PRIVACY = "privacy",
    /** 私人房 */
    PRIVATE_ROOM = "privateRoom",
    /** 道具 */
    PROPS = "props",
    /** 排行榜 */
    RANK = "rank",
    /** 水果资源 */
    RES_FRUIT = "resFruit",
    /** 签到 */
    SIGN_IN = "signIn",
    /** 个人中心 */
    USER_CENTER = "userCenter",
}
