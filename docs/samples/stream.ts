import { RxMqttClient } from "rx-mqtt-client";

let client = new RxMqttClient();

client
    .stream('device/+/input')
    .subscribe((msg: RxMqttClient.Message) => {
        let deviceId = msg.topic.wildcard(0);
        let newMsg = msg.payload;
    });

    
