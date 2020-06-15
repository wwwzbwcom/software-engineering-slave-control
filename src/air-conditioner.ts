import axios from 'axios';
import eventBus from './main';
import { Settings, Events } from './model';

abstract class AbstractAirConditioner {
    abstract setSettings(settings: Settings): PromiseLike<void>;
    abstract getData(): Promise<any>;
}

class MockAirConditioner extends AbstractAirConditioner {
    enviroment_temperature: number = 25;
    ambient_temperature: number = 30;
    settings: Settings | null = null;

    constructor() {
        super()
    }

    async setSettings(settings: Settings) {
        this.settings = settings;
        return Promise.resolve();
    }

    pendingTime = 0;

    simulateEnviroment = (ms: number) => {
        // console.log("[MOCKING]", this.settings);

        if (this.settings) {
            let offset  = 0;
            let v = 0;
            if (this.settings.on && this.settings.speed > 0) {
                v = this.settings.temperature - this.enviroment_temperature;
                switch(this.settings.speed) {
                    case 1:
                        offset = 1 / 25;
                        break;
                    case 2:
                        offset = 1 / 20;
                        break;
                    case 3:
                        offset = 1 / 15;
                        break;
                }
            }
            else {
                v = this.ambient_temperature - this.enviroment_temperature;
                offset = 1 / 10;
            }

            if (v != 0) {
                v = v / Math.abs(v);
                this.enviroment_temperature += v * offset * ms / 1000;
            }


        }
    }



    async getData(): Promise<any> {
        return Promise.resolve<any>({
            enviroment_temperature: this.enviroment_temperature,
            ambient_temperature: this.ambient_temperature
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
    if (true) {
        console.log("[MOCK AC]");
        ac = new MockAirConditioner();

        setInterval(() => {
            (ac as MockAirConditioner).simulateEnviroment(100)
        }, 100);
    }
    else {
        console.log("[REAL AC]");
    }

    setInterval(async () => {
        let d = await ac.getData();
        let et = parseFloat(d['enviroment_temperature']);
        let at = parseFloat(d['ambient_temperature']);
        eventBus.$emit(Events.onEnviromentUpdate, et, at);
    }, 2000);
    return ac;
}

export default acSelector;
