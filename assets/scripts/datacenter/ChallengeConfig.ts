/**
 * @file ChallengeConfig.ts
 * @description 闯关模式配置管理：定义闯关配置数据类型，使用单例模式管理配置存取
 * @category 数据中心
 */

/**
 * @interface CHALLENGE_CHAPTER
 * @description 闯关章节配置
 */
export interface CHALLENGE_CHAPTER {
    /** 章节索引 */
    index: number;
    /** 章节名称 */
    name: string;
    /** 配置文件路径 */
    path: string;
    /** 配置文件MD5 */
    fileMD5: string;
}

/**
 * @interface CHALLENGE_CONFIG
 * @description 闯关模式整体配置
 */
export interface CHALLENGE_CONFIG {
    /** 资源域名 */
    doMain: string;
    /** 章节列表 */
    chapter: CHALLENGE_CHAPTER[];
}

/**
 * @class ChallengeConfig
 * @description 闯关配置管理单例，负责闯关模式配置数据的存取
 * @category 数据中心
 * @singleton 单例模式
 */
export class ChallengeConfig {
    /**
     * @property {CHALLENGE_CONFIG | null} _config - 闯关模式配置数据
     * @private
     */
    private _config: CHALLENGE_CONFIG | null = null;

    /**
     * @property {ChallengeConfig} _instance - 单例实例
     * @private
     * @static
     */
    private static _instance: ChallengeConfig;

    /**
     * @method instance
     * @description 获取ChallengeConfig的单例实例
     * @static
     * @returns {ChallengeConfig} ChallengeConfig单例实例
     */
    public static get instance(): ChallengeConfig {
        if (!this._instance) {
            this._instance = new ChallengeConfig();
        }
        return this._instance;
    }

    /**
     * @constructor
     * @description 私有构造函数
     * @private
     */
    private constructor() {}

    /**
     * @method config
     * @description 设置闯关模式配置
     * @param {CHALLENGE_CONFIG | null} data - 配置数据
     */
    set config(data: CHALLENGE_CONFIG | null) {
        this._config = data;
    }

    /**
     * @method config
     * @description 获取闯关模式配置
     * @returns {CHALLENGE_CONFIG | null} 配置数据
     */
    get config(): CHALLENGE_CONFIG | null {
        return this._config;
    }
}
