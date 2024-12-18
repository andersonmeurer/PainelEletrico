const CLASS_NAME = "SensorVoltagem";

const five = require("johnny-five");
const WebSocket = require('ws');

class SensorVoltagem {
  constructor(moduleName, board, wss, pin) {
    this.moduleName = moduleName;
    this.board = board;
    this.wss = wss;
    this.pin = pin;

    console.log(`${CLASS_NAME}::{moduleName:${moduleName}, pin:${pin}}`);
    const sensor = new five.Sensor({ pin: this.pin, freq: 2000 });

    sensor.on("data", () => {
      const valor = sensor.value;

      if (this.wss && this.wss.clients) {
        const dados = {
          moduleName: this.moduleName,
          class: CLASS_NAME,
          value: valor.toFixed(2)
        };

        this.wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            //console.log(`${CLASS_NAME}::Sending: ` + JSON.stringify(dados));
            client.send(JSON.stringify(dados));
          }
        });
      }
    });
  }
}

module.exports = SensorVoltagem;