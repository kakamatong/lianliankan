/**
 * @file ChallengeConfig.ts
 * @description 闯关模式配置管理：定义闯关配置数据类型，使用单例模式管理配置存取
 * @category 数据中心
 */

import { HttpGet, Logger } from "@frameworks/utils/Utils";

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
 * @interface MAP_LEVEL_CONFIG
 * @description 关卡地图关卡配置（单个关卡）
 */
export interface MAP_LEVEL_CONFIG {
    /** 关卡索引 */
    index: number;
    /** 地图二维数组 0=边界 1=可放置 */
    map: number[][];
    /** 默认行数 */
    defaultRows: number;
    /** 默认列数 */
    defaultCols: number;
    /** 图标种类数 */
    iconTypes: number;
    /** 总时间(秒) */
    totalTime: number;
    /** 结束倒计时(秒) */
    endTime: number;
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
     * @property {Map<number, MAP_LEVEL_CONFIG[]>} _chapterMaps - 章节关卡地图缓存
     * @private
     */
    private _chapterMaps: Map<number, MAP_LEVEL_CONFIG[]> = new Map();

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

    /**
     * @method loadChapterConfig
     * @description 加载指定章节的关卡地图配置（从远程 OSS 拉取），带内存缓存
     * @param {number} chapterIndex - 章节索引
     * @returns {Promise<MAP_LEVEL_CONFIG[]>} 关卡配置数组
     */
    async loadChapterConfig(chapterIndex: number): Promise<MAP_LEVEL_CONFIG[]> {
        const cached = this._chapterMaps.get(chapterIndex);
        if (cached) {
            return cached;
        }

        if (!this._config) {
            throw new Error("闯关配置尚未加载，请先调用 Challenge.instance.getConfig()");
        }

        const chapter = this._config.chapter.find((c) => c.index === chapterIndex);
        if (!chapter) {
            throw new Error(`章节 ${chapterIndex} 不存在`);
        }

        const url = this._config.doMain + chapter.path;
        Logger.log(`加载章节 ${chapterIndex} 地图配置: ${url}`);

        const data = await HttpGet(url);
        this._chapterMaps.set(chapterIndex, data);
        return data as MAP_LEVEL_CONFIG[];
    }
}
