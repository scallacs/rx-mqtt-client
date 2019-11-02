import { RxMqttClient } from "./rx-mqtt-client"
import { expect } from "chai";

/**
 * RxMqttClient test
 */
describe("RxMqttClient test", () => {

  it("RxMqttClient is instantiable", () => {
    expect(new RxMqttClient()).to.be.instanceOf(RxMqttClient)
  })


  // describe("connection state", function () {
  //   it("should be able to connect to a broker", async function () {
  //     let client = new RxMqttClient();
  //     await client.connect("mqtt://localhost").toPromise();
  //   });

  //   it("should timeout if cannot connect to broker", async function () {
  //     let client = new RxMqttClient();
  //     return expect(client.connect("mqtt://myinvalidhost"));
  //   });

  //   it("should throw an error if trying to connect twice", async function () {
  //     let client = new RxMqttClient();
  //     await client.connect("mqtt://localhost").toPromise();
  //     await client.connect("mqtt://localhost").toPromise();

  //   })
  // });
})
