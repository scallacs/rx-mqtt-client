import { RxMqttClient } from "rx-mqtt-client";
import { map } from "rxjs/operators";

let client = new RxMqttClient();

client
    .connect('mqtt://mybrokerurl.com', {
        // Any options here
    })
    .subscribe(() => {
        // On connected here
    });


client.publish('/my-topic', "hello world!").subscribe();

client.messages.subscribe((event) => {
    console.info(`[topic:${event.topicString}] ${event.payload.toString()}`);
})

client.stream('device/+/input')
    .subscribe((msg: RxMqttClient.Message) => {
        let deviceId = msg.topic.wildcard(0);
        let newMsg = msg.payload;
    });

client.unsubscribe('');



// TODO


let tempeartureStream = client
    .stream('/sensors/+/temperature')
    .pipe(
        map(msg => mqttMessageToSensorData<TemparatureData>(msg)),
    );

tempeartureStream
    .subscribe((msg) => {
        console.log(`[${msg.deviceId}] temperature ${msg.data.value}`)
    });

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
