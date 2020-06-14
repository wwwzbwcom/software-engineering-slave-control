import { Settings, Events  } from './model';
import eventBus from './main';

/** Every Second */
const scale = 10000;

class EnviromentSim {
    enviromentTempareture : number = 16;
    settings : Settings | null = null;

    setSettings = (settings: Settings) => {
        this.settings = settings;
    }

    simulateEnviroment = (ms:number) => {
        if(this.settings) {
            if(this.settings.on) {
                let direction = 0;
                if(this.settings.tempareture > this.enviromentTempareture) {
                    direction = 1;
                }
                if(this.settings.tempareture < this.enviromentTempareture) {
                    direction = -1;
                }
        
                this.enviromentTempareture += direction * ms * this.settings.speed * this.settings.speed / scale;
            }
            else {
                this.enviromentTempareture -= 1;
            }
        }
    
        eventBus.$emit(Events.onEnviromentUpdate, this.enviromentTempareture);
    }

    getEnviromentTempareture = () : number => {
        return this.enviromentTempareture;
    }
}




const enviromentSim = new EnviromentSim();
setInterval(() => {
    enviromentSim.simulateEnviroment(1000);
}, 1000)
export default enviromentSim;



// let enviromentTempareture : number = 16;
// let settings : Settings | null = null;

// export const setSettings = (new_settings: Settings) => {
//     settings = new_settings;
// }

// const simulateEnviroment = (ms:number) => {
//     if(settings) {
//         let direction = 0;
//         if(settings.tempareture > enviromentTempareture) {
//             direction = 1;
//         }
//         if(settings.tempareture < enviromentTempareture) {
//             direction = -1;
//         }

//         enviromentTempareture = direction * ms * settings.speed / scale;
//     }

//     vue.$emit("enviroment-update", enviromentTempareture);
// }

// export const getEnviromentTempareture = () : number => {
//     return enviromentTempareture;
// }

