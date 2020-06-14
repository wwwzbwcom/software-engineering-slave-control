
export enum Events {
    onSpeedUpdate = 'onSettingsUpdate',
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
    speed: 0 | 1 | 2 | 3;
}


export function convertSettingToServer(settings: Settings, mode: "cold" | "warm"):any {
    let ss = "non";
    switch(settings.speed) {
        case 0:
            ss = "non";
            break;
        case 1:
            ss = "mid";
            break;
        case 2:
            ss = "low";
            break;
        case 3:
            ss = "high";
            break;
    }
    let sm = "cool";
    if(mode == "warm") sm = "heat";
    return {
        speed: ss,
        tempareture: settings.tempareture,
        mode: sm
    }
}


/**
 * @member mode {"code"|"warm"} 主控工作模式
 */
export interface MasterSettings {
    mode: "cold" | "warm",
    default_tempareture: number,
    min_tempareture: number,
    max_tempareture: number,
    status_upload_interval: number,
    statistics_update_interval: number
}

export function convertMasterSettingsFromServer(data: any): MasterSettings {
    let masterSettings : MasterSettings;

    if(data.mode == "cool") {
        masterSettings = {
            mode: "cold",
            min_tempareture: data.cool_min,
            max_tempareture: data.cool_max,
            default_tempareture: data.default_tempareture,
            statistics_update_interval: data.update_delay,
            status_upload_interval: data.metric_delay
        }
    }
    else {
        masterSettings = {
            mode: "warm",
            min_tempareture: data.heat_min,
            max_tempareture: data.heat_max,
            default_tempareture: data.default_tempareture,
            statistics_update_interval: data.update_delay,
            status_upload_interval: data.metric_delay
        }
    }

    return masterSettings;
}

/**
 * @member total_fee {number} 入住以来累计价格 
 * @member fee {number} 当次开机价格
 */
export interface Stats {
    energy: number;
    fee: number;
}


/**
 * @member room {string} 房间信息
 * @member phone {number} 住客手机号信息（认证用）
 * @member identity_number {string} 住客身份证（认证用）
 */
export interface UserInfo {
    room: string;
    id: string;
}
