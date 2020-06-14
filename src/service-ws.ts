const io = require('socket.io-client');

class ServiceWS {

    host = 'http://112.126.65.59:2022/';
    mode: string;
    socket: any;

    constructor() {
        this.mode = "non";
        this.socket = null;

    }

    // 请求断开
    disconnect() {
        console.log('[WS - DISCONNECT]');
        this.socket.emit('disconnect');
    }

    // 重试
    onAttempingReconnect() {
        console.log('[WS - ATTEMPT RECONNECT]');
        // if(this.socket) {
        this.socket.io.opts.transports = ['polling'];
        // }

    }
    // 连接时
    onConnect() {
        console.log('[WS - CONNECTED]');
    }

    // 断开时
    onDisconnect() {
        console.log('[WS - DISCONNECTED]');
        // this.socket = null;
    }

    // 开始送风
    startSupply(fan_speed: string, mode: string) {
        console.log('[WS - START SUPPLY]', new Date(Date.now()).toUTCString(), this.mode, fan_speed, mode);
        this.mode = mode;

        let speed = 0;
        switch (mode) {
            case "non":
                speed = 0;
                break;
            case "low":
                speed = 1;
                break;
            case "mid":
                speed = 2;
                break;
            case "high":
                speed = 3;
                break;
        }

        if (this.handler) {
            this.handler(speed);
        }
    }

    handler: ((speed: number) => void) | null = null;

    // 停止送风
    stopSupply() {
        console.log('[WS - STOP SUPPLY]', new Date(Date.now()).toUTCString());
        this.mode = "non";
    }

    connect(room: string) {
        let socket_options = {
            query: {
                room_id: room
            },
            transports: ['polling']
        };
        this.socket = io(this.host, socket_options);
        this.socket.on('reconnect_attempt', () => this.onAttempingReconnect());
        this.socket.on('connect', () => this.onConnect());
        this.socket.on('disconnect', () => this.onDisconnect());
        this.socket.on('start_supply', (speed: string, mode: string) => this.startSupply(speed, mode));
        this.socket.on('stop_supply', () => this.stopSupply());
    }
}

const ws = new ServiceWS();
export default ws;
// setTimeout(() => {
//     conn.disconnect();
// }, 5000);
