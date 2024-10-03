// SENSOR DE VOLTAGEM: https://lastminuteengineers.com/voltage-sensor-arduino-tutorial/

const five = require("johnny-five");

class SensorVoltagem {
  constructor(id, board, wss, pin) {
    this.id = id;
    this.board = board;
    this.wss = wss;
    this.pin = pin;

    this.board.on("ready", () => {
      const sensor = new five.Pin({ pin: this.pin, freq: 2500 });

      sensor.read((error, value) => {
        let adcVoltage = (value * 5.0) / 1023.0;
        let inVoltage = adcVoltage * (30000.0 + 7500.0) / 7500.0;

        if (wss && wss.clients) {
          const dados = {
            class: `SensorVoltagem`,
            type: `voltagem${id}`,
            id: id,
            tensao: inVoltage.toFixed(2)
          };
  
          wss.clients.forEach(function (server) {
            server.send(JSON.stringify(dados));
          });
        }
      });
    });
  }
}

module.exports = SensorVoltagem;