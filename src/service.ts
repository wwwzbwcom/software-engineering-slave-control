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
                min_temperature: 16,
                max_temperature: 26,
                default_temperature: 26,
                status_upload_interval: 1000,
                statistics_update_interval: 1000
            },
            message: "获取主控设置成功",
            error: false
        });
    }

    setSettings = async (settings: Settings): Promise<ServiceResponse<Settings>> => {
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


class Service extends AbstractService {

    host: string = "http://112.126.65.59:2022";


    constructor() {
        super();
    }

    sendSettings = async (settings: Settings, timeout: number = 500): Promise<ServiceResponse<Settings>> => {
        try {
            let s = convertSettingToServer(settings, this.masterSettings?.mode ?? "cold", true);
            let res = await axios.post(this.host + "/v1/metrics", s, { headers: this.getHeaders() });
            if (res.data.code) {
                return {
                    data: settings,
                    message: "发送设置成功",
                    error: false
                }
            }
            return {
                message: JSON.stringify(res.data),
                error: true
            }
        } catch (err) {
            return {
                message: JSON.stringify(err),
                error: true
            }

        }

    }

    /**
     * Request update stats when timer expire
     * - According to doc, this should invoke in a period
     * - Success: Invoke an onStatsUpdate Global event
     * - Error: Do nothing
     */
    getStats = async (): Promise<ServiceResponse<Stats>> => {
        try {
            let res = await axios.get(this.host + "/v1/statistics", {
                headers: this.getHeaders()
            });
            if (res.data.code == 0) {
                let s: Stats;
                s = {
                    energy: parseFloat(res.data.energy),
                    fee: parseFloat(res.data.cost)
                }
                eventBus.$emit(Events.onStatsUpdate, s);

                return {
                    data: s,
                    error: false,
                    message: "获取统计成功"
                };
            }
            else {
                return {
                    error: true,
                    message: JSON.stringify(res.data)
                };
            }
        } catch (err) {
            return this.unkownErrorHandler(err) as any;
        }

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


    stop = async (): Promise<ServiceResponse> => {
        try {
            let d = {
                room_id: this.userInfo?.room
            }
            let res = await axios.post(this.host + "/v1/state_control/stop", d, { headers: this.getHeaders() })
            console.log("[SET SETTINGS]", res.data);
            if (res.data.code == 0) {
                return {
                    error: false,
                    message: "设置成功！"
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
    }

    setSettings = async (settings: Settings): Promise<ServiceResponse<Settings>> => {
        try {

            let res: any;
            if (settings.on && settings.speed > 0) {
                let d = convertSettingToServer(settings, this.masterSettings?.mode ?? "cold", false);
                res = await axios.post(this.host + "/v1/state_control/start", d, { headers: this.getHeaders() });
                console.log("[SET SETTINGS]", res.data);
                if (res.data.code == 0) {
                    this.settings = settings;
                    return {
                        error: false,
                        message: "设置成功！",
                        data: settings
                    }
                }
            }
            else {
                let d = {
                    room_id: this.userInfo?.room
                }
                res = await axios.post(this.host + "/v1/state_control/stop", d, { headers: this.getHeaders() })
                console.log("[SET SETTINGS]", res.data);
                if (res.data.code == 0) {
                    this.settings = settings;
                    return {
                        error: false,
                        message: "设置成功！",
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

    statistics_update_interval_id: number | null = null;
    status_upload_interval_id: number | null = null;


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

                if (this.statistics_update_interval_id) {
                    clearInterval(this.statistics_update_interval_id);
                }
                this.statistics_update_interval_id = setInterval(async () => {
                    await service.getStats();
                }, this.masterSettings.statistics_update_interval);

                if (this.status_upload_interval_id) {
                    clearInterval(this.status_upload_interval_id);
                }
                this.status_upload_interval_id = setInterval(async () => {
                    if (this.settings != null) {
                        await service.sendSettings(this.settings);
                    }
                }, this.masterSettings.status_upload_interval);

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

    async disconnect(): Promise<ServiceResponse> {
        
        try {
            let res = await axios.post(this.host + "/v1/disconnect", {}, { headers: this.getHeaders() });
            console.log("[DISCONNECT]", res);
            if (res.data.code == 0) {
                return {
                    error: false,
                    message: "退出成功"
                }

            } else {
                return {
                    error: true,
                    message: JSON.stringify(res.data)
                }
            }

        }
        catch (err) {
            return {
                error: true,
                message: JSON.stringify(err)
            }
        }
    }

    settings: Settings | null = null;
    masterSettings: MasterSettings | null = null;
    userInfo: UserInfo | null = null;
}

const mockService = new MockService();
const service = new Service();



export default service;