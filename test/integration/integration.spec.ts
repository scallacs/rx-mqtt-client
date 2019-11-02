import { expect } from 'chai';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

import { RxMqttClient } from '../../src/rx-mqtt-client';
import { MQTT_SERVER_URL, startBroker } from '../broker';

/**
 * RxMqttClient test
 */
describe("Broker integration test", () => {

    let servers: any;
    let client1: RxMqttClient, client2: RxMqttClient, client3: RxMqttClient;

    before(async function () {
        this.timeout(3000);
        client1 = new RxMqttClient();
        client2 = new RxMqttClient();
        client3 = new RxMqttClient();

        if (process.env['CREATE_MQTT_BROKER']) {
            console.info('Broker will be created with port ');
            servers = await startBroker();
        }
    });

    after(function () {
        if (client1) client1.disconnect();
        if (client2) client2.disconnect();
        if (client3) client3.disconnect();
        if (servers) {
            servers.close();
        }
    })

    it("should be able to connect and connection state should be set to connected", async function () {
        await forkJoin([
            client1.connect(MQTT_SERVER_URL),
            client2.connect(MQTT_SERVER_URL)
        ]).toPromise();

        expect(client1.connectionStateValue).to.be.eq(RxMqttClient.ConnectionState.CONNECTED);
        expect(client2.connectionStateValue).to.be.eq(RxMqttClient.ConnectionState.CONNECTED);
    })

    describe("when connected", function () {
        before(async function () {
            if (!client1.isConnected) {
                await client1.connect(MQTT_SERVER_URL).toPromise();
            }
            if (!client2.isConnected) {
                await client2.connect(MQTT_SERVER_URL).toPromise();
            }
        })

        it("should be able to receive data", function (done) {
            client1.subscribe([
                '/sensors/+/temperature',
                '/sensors/+/humidity'
            ])
                .subscribe();

            client1
                .stream('/sensors/+/temperature')
                .pipe(
                    map(msg => mqttMessageToSensorData<TemparatureData>(msg))
                )
                .subscribe((data) => {
                    // console.info(`Temperature for ${data.deviceId}: ${data.data.value}°C`);
                    client1.unsubscribe('/sensors/+/temperature');
                    expect(data.deviceId).to.be.eql('kitchen');
                    expect(data.data.value).to.be.eq(37.6);
                    done();
                });

            client2
                .publish('/sensors/kitchen/temperature', JSON.stringify({
                    value: 37.6
                })).toPromise();


        });
    })



    it("should connect/disconnect", async function () {
        await client3.connect(MQTT_SERVER_URL).toPromise();
        await client3.disconnect().toPromise();
        await client3.connect(MQTT_SERVER_URL).toPromise();
        await client3.disconnect().toPromise();
    });

    // TODO test when broker goes offline
    // test when internet is lost ? 
})


function mqttMessageToSensorData<T>(msg: RxMqttClient.Message): SensorData<T> {
    let sensorData = msg as SensorData<T>;
    sensorData.deviceId = msg.topic.wildcard(0);
    sensorData.data = JSON.parse(msg.payload.toString('utf8'));
    return sensorData;
}

interface TemparatureData {
    value: number,
    unit: string
}

interface SensorData<T> extends RxMqttClient.Message {
    deviceId: string,
    data: T
}
