import { Stats, Settings, MasterSettings, LoginInfo, Event  } from './model';
import eventBus from './main';

/**
 * @param message {string} when error, provide a hint error message
 * @param data {T} when success, provide a data
 */
export interface ServiceResponse<T> {
    data?: T;
    message? : string;
}


class Service {
    
    

    mockStats = {
        total_fee: 5.5,
        fee: 2.1
    }

    /**
     * Request update stats when timer expire
     * - According to doc, this should invoke in a period
     * - Success: Invoke an onStatsUpdate Global event
     * - Error: Do nothing
     */
    getStats = async ()  : Promise< ServiceResponse<Stats> > => {
        let stats:Stats = this.mockStats;
        this.mockStats.fee += 0.01;
        this.mockStats.total_fee += 0.01;
        
        eventBus.$emit(Event.onStatsUpdate, stats);
    
        return Promise.resolve({
            data: stats
        })
    };

    /**
     * Get Master Air Condition Settings
     * - Success: Invoke an onStatsUpdate Global event
     * - Error: Do nothing
     * - According to doc, this should invoke in a period
     */
    getMasterSettings = async (): Promise< ServiceResponse<MasterSettings> > => {
        return Promise.resolve< ServiceResponse<MasterSettings> >({
            data: {
                mode: "cold",
                min_tempareture: 16,
                max_tempareture: 26
            }
        });
    }
    
    /**
     * Request Server to Permit Change Settings
     * - Success: return null
     * - Error: return error message
     */
    setSettings = async (settings: Settings) : Promise< ServiceResponse<Settings> > => {
        console.log(settings);
        if(settings.speed == 5) {
            return Promise.resolve< ServiceResponse<Settings> >({
                message: "设置失败！"
            });
        }
        else {
            return Promise.resolve< ServiceResponse<Settings> >({
                data: settings
            });
        }
        
    };


    /**
     * Request Server To Change Settings
     * - Success: return null
     * - Error: return error message
     */
    login = async (loginInfo? : LoginInfo) : Promise< ServiceResponse<LoginInfo> > => {
        return Promise.resolve< ServiceResponse<LoginInfo> >({
        });
    }
    
}

const service = new Service();

setInterval(() => {
    
    service.getStats();
}, 1000)

export default service;




// /**
//  * Request update stats when timer expire
//  * - According to doc, this should invoke in a period
//  * - Success: Invoke an onStatsUpdate Global event
//  * - Error: Do nothing
//  */
// export const updateStats = async ()  : Promise< ServiceResponse<Stats> > => {
//     let stats:Stats = {
//         total_fee: 5.5,
//         fee: 2.1
//     }

//     vue.$emit('onStatsUpdate', stats);

//     return Promise.resolve({
//         data: stats
//     })
// };


// /**
//  * Get Master Air Condition Settings
//  * - Success: Invoke an onStatsUpdate Global event
//  * - Error: Do nothing
//  * - According to doc, this should invoke in a period
//  */
// export const getMasterSettings = async (): Promise< ServiceResponse<MasterSettings> > => {
//     return Promise.resolve< ServiceResponse<MasterSettings> >({
//         data: {
//             mode: "cold",
//             min_tempareture: 16,
//             max_tempareture: 26
//         }
//     });
// }

// /**
//  * Request Server To Change Settings
//  * - Success: return null
//  * - Error: return error message
//  */
// export const requestSettings = async (settings: Settings) : Promise< ServiceResponse<Settings> > => {
//     return Promise.resolve< ServiceResponse<Settings> >({
//         data: settings
//     });
// };


// /**
//  * Request Server To Change Settings
//  * - Success: return null
//  * - Error: return error message
//  */
// export const login = async (loginInfo? : LoginInfo) : Promise< ServiceResponse<LoginInfo> > => {
//     return Promise.resolve< ServiceResponse<LoginInfo> >({
//     });
// }

// setTimeout(() => {
//     updateStats();
// }, 1000)