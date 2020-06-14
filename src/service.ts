import { Stats, Settings, MasterSettings, UserInfo, Events, convertMasterSettingsFromServer, convertSettingToServer } from './model';
import eventBus from './main';
import axios from 'axios';
import ws from './service-ws';

/**
 * @param message {string} when error, provide a hint error message
 * @param data {T} when success, provide a data
 */
export interface ServiceResponse<T = null> {
    data?: T;
    error: boolean;
    message: string;
}

abstract class AbstractService {
    token: string | null = null;
    setToken(token: string) {
        this.token = token;
    }
    getToken() {
        return this.token;
    }
    abstract getStats(): Promise<ServiceResponse<Stats>>;
    abstract getMasterSettings(): Promise<ServiceResponse<MasterSettings>>;
    abstract setSettings(settings: Settings): Promise<ServiceResponse<Settings>>;
    abstract login(userInfo?: UserInfo): Promise<ServiceResponse<UserInfo>>;
}

class MockService extends AbstractService {
    mockStats: Stats = {
        energy: 5.5,
        fee: 2.1
    }

    getStats = async (): Promise<ServiceResponse<Stats>> => {

        let stats: Stats = this.mockStats;
        this.mockStats.fee = 0.1 * this.mockStats.energy;
        this.mockStats.energy += 0.1;

        eventBus.$emit(Events.onStatsUpdate, stats);

        return Promise.resolve({
            data: stats,
            message: "获取信息成功",
            error: false,
        })
    };

    getMasterSettings = async (): Promise<ServiceResponse<MasterSettings>> => {
        return Promise.resolve<ServiceResponse<MasterSettings>>({
            data: {
                mode: "cold",
                min_tempareture: 16,
                max_tempareture: 26,
                default_tempareture: 26,
                status_upload_interval: 1000,
                statistics_update_interval: 1000
            },
            message: "获取主控设置成功",
            error: false
        });
    }

    setSettings = async (settings: Settings): Promise<ServiceResponse<Settings>> => {
        console.log(settings);
        if (settings.speed == 3) {
            return Promise.resolve<ServiceResponse<Settings>>({
                message: "设置失败！",
                error: true
            });
        }
        else {
            return Promise.resolve<ServiceResponse<Settings>>({
                data: settings,
                error: false,
                message: "设置成功"
            });
        }
    };

    login = async (userInfo: UserInfo): Promise<ServiceResponse<UserInfo>> => {
        if (userInfo.room == "507" && userInfo.id == "test") {
            this.token = "fake_token";
            return Promise.resolve<ServiceResponse<UserInfo>>({
                data: userInfo,
                message: "登录成功！",
                error: false
            });
        }
        return Promise.resolve<ServiceResponse<UserInfo>>({
            message: "登录失败",
            error: true
        });


    }
}


class Service extends MockService {

    host: string = "http://112.126.65.59:2022";


    constructor() {
        super();
    }

    /**
     * Request update stats when timer expire
     * - According to doc, this should invoke in a period
     * - Success: Invoke an onStatsUpdate Global event
     * - Error: Do nothing
     */
    getStats = async (): Promise<ServiceResponse<Stats>> => {
        return await mockService.getStats();
        // let res = await axios.get(this.host + "/v1/statistics");
        // res.data;
    };

    /**
     * Get Master Air Condition Settings
     * - Success: Invoke an onStatsUpdate Global event
     * - Error: Do nothing
     * - According to doc, this should invoke in a period
     */
    getMasterSettings = async (): Promise<ServiceResponse<MasterSettings>> => {
        if (this.masterSettings) {
            return Promise.resolve<ServiceResponse<MasterSettings>>({
                error: false,
                message: "获取主控设置成功",
                data: this.masterSettings
            });
        }
        else {
            return Promise.resolve<ServiceResponse<MasterSettings>>({
                error: false,
                message: "获取主控设置失败，您可能还未登录！"
            });
        }

    }

    getHeaders() {
        return {
            'app_key': window.localStorage.getItem("app_key"),
            'Authorization': this.token
        }
    }

    /**
     * Request Server to Permit Change Settings
     * - Success: return null
     * - Error: return error message
     */
    setSettings = async (settings: Settings): Promise<ServiceResponse<Settings>> => {
        try {
            let res: any;
            if (settings.on) {
                let d = convertSettingToServer(settings, this.masterSettings?.mode ?? "cold");
                res = await axios.post(this.host + "/v1/state_control/start", d, { headers: this.getHeaders() });
                console.log("[SET SETTINGS]", res.data);
                if (res.data.code == 0) {
                    return {
                        error: false,
                        message: "设置成功，等待主控响应！",
                        data: settings
                    }
                }
            }
            else {
                let d = {
                    room_id: this.userInfo?.room
                }
                res = await axios.post(this.host + "/v1/state_control/stop", d, {headers:this.getHeaders()})
                console.log("[SET SETTINGS]", res.data);
                if (res.data.code == 0) {
                    return {
                        error: false,
                        message: "设置成功，等待主控响应！",
                        data: settings
                    }
                }
            }

            return {
                error: true,
                message: "设置失败：" + JSON.stringify(res.data)
            }
        }
        catch (err) {
            return {
                error: true,
                message: "设置失败：" + JSON.stringify(err)
            }
        }

    };

    login = async (userInfo: UserInfo): Promise<ServiceResponse<UserInfo>> => {
        try {
            let res = await axios.post(this.host + "/v1/connect", {
                room_id: userInfo.room,
                id: userInfo.id
            }, { headers: this.getHeaders() });
            console.log("[LOGIN]", res.data);
            let data = res.data;
            if (data.code == 0) {
                this.token = data.token;
                this.userInfo = userInfo;
                this.masterSettings = convertMasterSettingsFromServer(data);
                // ws.connect(this.userInfo.room);
                console.log("[ROOM NUMBER ID]", res.data.room_id);
                ws.connect(res.data.room_id);
                ws.handler = (speed:number) => {
                    eventBus.$emit(Events.onSpeedUpdate, speed);
                }
                return {
                    error: false,
                    message: "登录成功",
                    data: userInfo
                };
            }
            else {
                return {
                    error: true,
                    message: "登录失败" + JSON.stringify(data)
                };
            }
        }
        catch (err) {
            return this.unkownErrorHandler(err) as any;
        }


    }

    unkownErrorHandler(err: any): ServiceResponse {
        return {
            error: true,
            message: "未知错误" + JSON.stringify(err)
        }
    }
    masterSettings: MasterSettings | null = null;
    userInfo: UserInfo | null = null;
}

const mockService = new MockService();
const service = new Service();

setInterval(() => {
    service.getStats();
}, 1000)

export default service;