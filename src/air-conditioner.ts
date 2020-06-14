import axios from 'axios';
import eventBus from './main';
import { Settings, Events } from './model';

abstract class AbstractAirConditioner {
    abstract setSettings(settings: Settings): PromiseLike<void>;
    abstract getData(): Promise<any>;
}

class MockAirConditioner extends AbstractAirConditioner {
    enviroment_tempareture: number = 26;
    ambient_tempareture: number = 30;
    settings: Settings | null = null;

    constructor() {
        super()
        setInterval(() => {
            this.simulateEnviroment(1000);
        }, 1000);
    }

    async setSettings(settings: Settings) {
        this.settings = settings;
        return Promise.resolve();
    }

    simulateEnviroment = (ms: number) => {
        console.log("[MOCKING]", this.settings);

        if (this.settings) {
            let v = 0;
            if (this.settings.on && this.settings.speed > 0) {
                v = this.settings.tempareture - this.enviroment_tempareture;
            }
            else {
                v = this.ambient_tempareture - this.enviroment_tempareture;
            }

            v = v / Math.abs(v);
            this.enviroment_tempareture += v * 0.05 * ms / 1000;
        }
    }



    async getData(): Promise<any> {
        return Promise.resolve<any>({
            enviroment_tempareture: this.enviroment_tempareture,
            ambient_tempareture: this.ambient_tempareture
        });
    }
}

class AirConditioner extends AbstractAirConditioner {
    host = "http://192.168.0.109:8888";

    async setSettings(settings: Settings) {
        const params: any = settings;
        params.working = params.on ? 1 : 0;
        console.log("[AC - SET SETTINGS]", settings);
        let res = await axios.get(this.host, {
            params: params
        });
    }

    async ping(): Promise<boolean> {
        try {
            let res = await axios.get(this.host, {
                timeout: 500
            });
            if (res.status == 200) {
                return true;
            }
            else {
                return false;
            }
        }
        catch {
            return false;
        }


    }

    async getData(): Promise<any> {
        let res = await axios.get(this.host + "/data");
        console.log("[AC - GET DATA]", res.data);
        return res.data;
    }
}

async function acSelector() {
    let ac: AirConditioner | MockAirConditioner = new AirConditioner();
    let available = await ac.ping();
    if (!available) {
        console.log("[MOCK AC]");
        ac = new MockAirConditioner();

        setInterval(() => {
            (ac as MockAirConditioner).simulateEnviroment(1000)
        }, 1000);
    }
    else {
        console.log("[REAL AC]");
    }

    setInterval(async () => {
        let d = await ac.getData();
        let et = parseFloat(d['enviroment_tempareture']);
        let at = parseFloat(d['ambient_tempareture']);
        eventBus.$emit(Events.onEnviromentUpdate, et, at);
    }, 2000);
    return ac;
}

export default acSelector;
