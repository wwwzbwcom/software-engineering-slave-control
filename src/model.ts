
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
    temperature: number;
    speed: 0 | 1 | 2 | 3;
}


export function convertSettingToServer(settings: Settings, mode: "cold" | "warm", fan_speed:boolean = false):any {
    let ss = "non";
    switch(settings.speed) {
        case 0:
            ss = "non";
            break;
        case 1:
            ss = "low";
            break;
        case 2:
            ss = "mid";
            break;
        case 3:
            ss = "high";
            break;
    }
    let sm = "cool";
    if(mode == "warm") sm = "heat";

    if(fan_speed)
    {
        return {
            fan_speed: ss,
            temperature: settings.temperature,
            mode: sm
        }
    }
    else {
        return {
            speed: ss,
            temperature: settings.temperature,
            mode: sm
        }
    }
    
}


/**
 * @member mode {"code"|"warm"} 主控工作模式
 */
export interface MasterSettings {
    mode: "cold" | "warm",
    default_temperature: number,
    min_temperature: number,
    max_temperature: number,
    status_upload_interval: number,
    statistics_update_interval: number
}

export function convertMasterSettingsFromServer(data: any): MasterSettings {
    let masterSettings : MasterSettings;

    if(data.mode == "cool") {
        masterSettings = {
            mode: "cold",
            min_temperature: data.cool_min,
            max_temperature: data.cool_max,
            default_temperature: data.default_temperature,
            statistics_update_interval: data.update_delay,
            status_upload_interval: data.metric_delay
        }
    }
    else {
        masterSettings = {
            mode: "warm",
            min_temperature: data.heat_min,
            max_temperature: data.heat_max,
            default_temperature: data.default_temperature,
            statistics_update_interval: data.update_delay,
            status_upload_interval: data.metric_delay
        }
    }

    return masterSettings;
}

/**
 * @member energy {number} 入住以来累计价格 
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
