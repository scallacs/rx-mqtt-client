
export const MQTT_SERVER_URL = 'tcp://localhost:1883'
export const WS_SERVER_URL = 'ws://localhost:1884'
export function startBroker() {
    const mqttServer = require('mqtt-server');

    return new Promise((resolve, reject) => {
        try {
            let servers = mqttServer({
                mqtt: MQTT_SERVER_URL,
                // mqtts: 'ssl://localhost:8883',
                mqttws: WS_SERVER_URL,
                // mqtwss: 'wss://localhost:8884'
            }, {
                // ssl: {
                //     key: fs.readFileSync('./server.key'),
                //     cert: fs.readFileSync('./server.crt')
                // },
                emitEvents: true // default
            }, function (client: any) {
                client.connack({
                    returnCode: 0
                });
            });


            servers.listen(function () {
                resolve(servers);
            });

        }
        catch (err) {
            reject(err);
        }
    })
}


// import * as mosca from "mosca";

// export function startMoscaBroker() {
//     var ascoltatore = {
//         //using ascoltatore
//         type: 'mongo',
//         url: 'mongodb://localhost:27017/mqtt',
//         pubsubCollection: 'ascoltatori',
//         mongo: {}
//     };

//     var settings = {
//         port: 1883,
//         backend: ascoltatore
//     };

//     var server = new mosca.Server(settings);

//     server.on('clientConnected', function (client) {
//         console.log('client connected', client.id);
//     });

//     // fired when a message is received
//     server.on('published', function (packet, client) {
//         console.log('Published', packet.payload);
//     });

//     server.on('ready', setup);

//     // fired when the mqtt server is ready
//     function setup() {
//         console.log('Mosca server is up and running');
//     }
// }
