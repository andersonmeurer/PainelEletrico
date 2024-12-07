const CLASS_NAME = "Sensor-Voltagem";

const five = require("johnny-five");
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3000');

class SensorVoltagem {
  constructor(id, board, wss, pin) {
    this.id = id;
    this.board = board;
    this.wss = wss;
    this.pin = pin;

    console.log(`${CLASS_NAME}::{id:${id}, pin: ${this.pin}}`);
    const sensor = new five.Sensor({ pin: this.pin, freq: 2000 });

    sensor.on("data", () => {
      const valor = sensor.value;

      if (this.wss && this.wss.clients) {
        const dados = {
          class: `SensorVoltagem`,
          id: this.id,
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

ws.on('open', () => {
  console.log(`${CLASS_NAME}:: Conexão estabelecida com o servidor!`);

  setInterval(() => {
      ws.send(`${CLASS_NAME}:: teste`);
  }, 3000);
});

ws.on('message', (data) => {
  console.log(`${CLASS_NAME}:: Cliente enviando ao servidor: ${data.toString()}`);
});

module.exports = SensorVoltagem;