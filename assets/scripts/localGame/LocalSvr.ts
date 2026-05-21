import { AddEventListener, DispatchEvent, LogColors, RemoveEventListener } from "@frameworks/Framework";
import { SprotoMapData } from "../../types/protocol/game10002/s2c";

export class LocalSvr {
    constructor() {}

    start(): void {
        AddEventListener("clientReady", this.onClientReady, this);
    }

    dispatchEventResp(eventName: string, data?: any): void {
        DispatchEvent("resp" + eventName, data);
    }

    dispatchEvent(eventName: string, data?: any): void {
        DispatchEvent(eventName, data);
    }

    onClientReady(): void {
        this.randomMap();
    }

    randomMap(): void {
        const rows = 10;
        const cols = 10;
        const map: number[][] = [];

        // 初始化地图（全部设为0）
        for (let i = 0; i < rows; i++) {
            map[i] = new Array(cols).fill(0);
        }

        // 内部区域为8x8（行1-8，列1-8），需要填充64个格子
        // 生成32对方块，每对随机类型1-max
        let pairIndex = 0;
        const max = 10;
        const pairs: number[] = [];
        for (let i = 0; i < 32; i++) {
            const type = ++pairIndex;
            pairs.push(type, type); // 添加一对
            if (pairIndex >= max) pairIndex = 0;
        }

        // 打乱顺序
        for (let i = pairs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
        }

        // 填充到内部区域
        let index = 0;
        for (let row = 1; row < rows - 1; row++) {
            for (let col = 1; col < cols - 1; col++) {
                map[row][col] = pairs[index++];
            }
        }

        const strMap = JSON.stringify(map);
        const data = {
            mapData: strMap,
            seat: 0,
            row: rows,
            col: cols,
        };

        this.dispatchEvent(SprotoMapData.Name, data);
    }
}
