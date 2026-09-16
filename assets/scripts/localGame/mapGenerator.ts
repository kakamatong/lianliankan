/**
 * @file mapGenerator.ts
 * @description 连连看地图生成器：根据设计配置生成地图，支持障碍物和多图标类型分配
 * @category 本地游戏
 */

import { MAP_DESIGN_CONFIG } from "./mapConfig";
import { Logger } from "@frameworks/utils/Utils";
import { OBSTACLE_VALUE_BASE } from "../games/game10002/logic/TileMapData";

// ============================================
// 地图生成
// ============================================

/** 设计地图标记：可填充方块位置 */
const DESIGN_FILL = 1;

/**
 * 根据设计配置生成连连看地图
 *
 * 算法流程：
 * 1. 扫描设计地图，收集可填充位置，并原样写入障碍物
 * 2. 按图标类型数量平均分配图标（确保每种为偶数）
 * 3. Fisher-Yates 洗牌（3 轮）打乱顺序
 * 4. 按位置填充图标
 *
 * @param designMap - 设计地图（0=空白, 1=可填充位, >100=障碍物，障碍物值即配置值）
 * @param rows - 地图行数（保留参数，实际尺寸以设计地图为准）
 * @param cols - 地图列数（保留参数，实际尺寸以设计地图为准）
 * @param iconTypes - 图标类型数量
 * @returns 生成的地图（0=空, 1~iconTypes=图标, >100=障碍物）
 */
export function generateFromDesign(designMap: number[][], rows: number, cols: number, iconTypes: number): number[][] {
    // 收集可填充位置
    const fillPositions: { row: number; col: number }[] = [];

    // 初始化地图（全 0）
    const map: number[][] = [];

    const mapLength = designMap ? designMap.length : 0;
    let obstacleCount = 0;
    let unknownCount = 0;
    for (let row = 0; row < mapLength; row++) {
        map[row] = [];
        for (let col = 0; col < designMap[row].length; col++) {
            const design = designMap[row][col];
            map[row][col] = 0; // 默认空
            if (design === DESIGN_FILL) {
                fillPositions.push({ row, col });
            } else if (design > OBSTACLE_VALUE_BASE) {
                // 障碍物：值直接取配置值，不做二次加工（配置 101 → 障碍物值 101 → 资源 80_101）
                map[row][col] = design;
                obstacleCount++;
            } else if (design !== 0) {
                // 其他标记（如旧版障碍物标记 9）不支持，按空处理
                unknownCount++;
            }
        }
    }

    if (unknownCount > 0) {
        Logger.warn(
            `[mapGenerator] 设计地图存在 ${unknownCount} 个无法识别的标记（已按空处理），障碍物请直接配置大于 ${OBSTACLE_VALUE_BASE} 的值（如 101）`
        );
    }

    if (obstacleCount > 0) {
        Logger.log(`[mapGenerator] 设计地图障碍物数量: ${obstacleCount}`);
    }

    const totalBlocks = fillPositions.length;
    if (totalBlocks % 2 !== 0) {
        Logger.warn(`[mapGenerator] 可填充位置数量为奇数: ${totalBlocks}，将有方块无法配对消除，请检查设计地图`);
    }

    // 平均分配图标（每种图标数量尽可能接近，且必须为偶数）
    let baseCount = Math.floor(totalBlocks / iconTypes);
    if (baseCount % 2 !== 0) {
        baseCount = baseCount - 1;
    }
    const remainder = totalBlocks - baseCount * iconTypes;
    const typesWithExtra = Math.floor(remainder / 2);

    // 创建图标池
    const iconPool: number[] = [];
    for (let iconType = 1; iconType <= iconTypes; iconType++) {
        let count = baseCount;
        if (iconType <= typesWithExtra) {
            count = count + 2;
        }
        for (let i = 0; i < count; i++) {
            iconPool.push(iconType);
        }
    }

    // Fisher-Yates 洗牌算法（多轮打乱，确保随机性）
    const shuffleRounds = 3;
    for (let round = 0; round < shuffleRounds; round++) {
        for (let i = iconPool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [iconPool[i], iconPool[j]] = [iconPool[j], iconPool[i]];
        }
    }

    // 填充可消除方块（图标池不足时留空，避免写入 undefined）
    for (let i = 0; i < fillPositions.length; i++) {
        if (i >= iconPool.length) {
            break;
        }
        const pos = fillPositions[i];
        map[pos.row][pos.col] = iconPool[i];
    }

    return map;
}

/**
 * 从配置中随机选取一个设计并生成地图
 * @returns { map, design } - 生成的地图和对应的设计配置
 */
export function generateRandomMap(): { map: number[][]; design: (typeof MAP_DESIGN_CONFIG)[number] } {
    let index = Math.floor(Math.random() * MAP_DESIGN_CONFIG.length);
    Logger.log(`随机选择地图设计索引: ${index}`);
    // index = MAP_DESIGN_CONFIG.length - 1;
    const design = MAP_DESIGN_CONFIG[index];
    const map = generateFromDesign(design.map, design.defaultRows, design.defaultCols, design.iconTypes);
    return { map, design };
}

/**
 * 获取指定的地图设计配置
 * @param index - 配置索引（从 0 开始）
 * @returns 地图设计配置，不存在时返回 undefined
 */
export function getDesignByIndex(index: number): (typeof MAP_DESIGN_CONFIG)[number] | undefined {
    return MAP_DESIGN_CONFIG[index];
}
