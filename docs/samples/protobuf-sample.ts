// import { RxMqttClient } from "rx-mqtt-client";

// let client = new RxMqttClient();

// let msgSample = client
//     .stream('/sensors/kitchen-temperature')
//     .pipe(
//         map(mqttMessageToJson)
//     )
//     .subscribe((event:  ) => {

//     });

// function mqttMessageToSensorData<T>(msg: RxMqttClient.RawMessage): SensorData<T> {
//     let data = JSON.parse(msg.p)
// }

// interface SensorData<T> extends RxMqttClient.Message {
//     deviceId: string,
//     data: T
// }