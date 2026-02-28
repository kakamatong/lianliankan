/**
 * @file TalkConfig.ts
 * @description 聊天配置：定义游戏中的快捷聊天内容
 * @category 游戏 10002
 */

/**
 * @enum FORWARD_MESSAGE_TYPE
 * @description 消息转发类型
 */
export enum FORWARD_MESSAGE_TYPE {
    TALK = 1,  // 快捷聊天
}

/**
 * @description 聊天列表配置
 * @property {number} id 聊天内容 ID
 * @property {string} msg 聊天内容
 */
export const TALK_LIST = [
    {id:1,msg:"我出剪刀，你信吗？"},
    {id:2,msg:"我出石头，你信吗？"},
    {id:3,msg:"我出布，你信吗？"},
    {id:4,msg:"真墨迹！"},
    {id:5,msg:"我猜你会出剪刀~"},
    {id:6,msg:"我猜你会出石头~"},
    {id:7,msg:"我猜你会出布~"},
    {id:8,msg:"天大地大，石头最大！"},
    {id:9,msg:"你出剪刀，我出布，这把我让你！"},
    {id:10,msg:"你出石头，我出剪刀，这把我让你！"},
    {id:11,msg:"你出布，我出剪刀，这把我让你！"},
]