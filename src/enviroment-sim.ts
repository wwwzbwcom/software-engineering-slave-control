import { Settings, Events  } from './model';
import eventBus from './main';

/** Every Second */
const scale = 10000;

class EnviromentSim {
    enviromenttemperature : number = 16;
    settings : Settings | null = null;

    setSettings = (settings: Settings) => {
        this.settings = settings;
    }

    simulateEnviroment = (ms:number) => {
        if(this.settings) {
            if(this.settings.on) {
                let direction = 0;
                if(this.settings.temperature > this.enviromenttemperature) {
                    direction = 1;
                }
                if(this.settings.temperature < this.enviromenttemperature) {
                    direction = -1;
                }
        
                this.enviromenttemperature += direction * ms * this.settings.speed * this.settings.speed / scale;
            }
            else {
                this.enviromenttemperature -= 1;
            }
        }
    
        eventBus.$emit(Events.onEnviromentUpdate, this.enviromenttemperature);
    }

    getEnviromenttemperature = () : number => {
        return this.enviromenttemperature;
    }
}




const enviromentSim = new EnviromentSim();
setInterval(() => {
    enviromentSim.simulateEnviroment(1000);
}, 1000)
export default enviromentSim;



// let enviromenttemperature : number = 16;
// let settings : Settings | null = null;

// export const setSettings = (new_settings: Settings) => {
//     settings = new_settings;
// }

// const simulateEnviroment = (ms:number) => {
//     if(settings) {
//         let direction = 0;
//         if(settings.temperature > enviromenttemperature) {
//             direction = 1;
//         }
//         if(settings.temperature < enviromenttemperature) {
//             direction = -1;
//         }

//         enviromenttemperature = direction * ms * settings.speed / scale;
//     }

//     vue.$emit("enviroment-update", enviromenttemperature);
// }

// export const getEnviromenttemperature = () : number => {
//     return enviromenttemperature;
// }

