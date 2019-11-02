# Rx MQTT Client

[![Coverage Status](https://coveralls.io/repos/github/scallacs/rx-mqtt-client/badge.svg?branch=master)](https://coveralls.io/github/scallacs/rx-mqtt-client?branch=master)
[![Maintainability](https://api.codeclimate.com/v1/badges/04e310df793ede49eb29/maintainability)](https://codeclimate.com/github/scallacs/rx-mqtt-client/maintainability)

Reactive extension for MQTT client.

### Usage

```bash
npm install rx-mqtt-client
```


<!-- AUTO-GENERATED-CONTENT:START (CODE:syntax=typescript&src=./docs/samples/connection.ts) -->
<!-- The below code snippet is automatically added from ./docs/samples/connection.ts -->
```typescript
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
```
<!-- AUTO-GENERATED-CONTENT:END -->
