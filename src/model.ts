
export enum Event {
    onStatsUpdate = 'onStatsUpdate',
    onEnviromentUpdate = "onEnviromentUpdate"
}

/**
 * @member on {boolean} 空调是否打开 
 * @member temp {number} 空调设定温度 16-31
 * @member speed {number} 空调设定风速 1-5
 */
export interface Settings {
    on: boolean;
    tempareture: number;
    speed: 0 | 1 | 2 | 3 | 4 | 5;
}


/**
 * @member mode {"code"|"warm"} 主控工作模式
 */
export interface MasterSettings {
    mode: "cold" | "warm",
    min_tempareture: number,
    max_tempareture: number
}

/**
 * @member total_fee {number} 入住以来累计价格 
 * @member fee {number} 当次开机价格
 */
export interface Stats {
    total_fee: number;
    fee: number;
}


/**
 * @member room {string} 房间信息
 * @member phone {number} 住客手机号信息（认证用）
 * @member identity_number {string} 住客身份证（认证用）
 */
export interface LoginInfo {
    room: string;
    phone?: string;
    identity_number?: string;
}