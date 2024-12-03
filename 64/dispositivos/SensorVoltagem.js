// SENSOR DE VOLTAGEM: https://lastminuteengineers.com/voltage-sensor-arduino-tutorial/

const five = require("johnny-five");

class SensorVoltagem {
  constructor(id, board, wss, pin) {
    this.id = id;
    this.board = board;
    this.wss = wss;
    this.pin = pin;

    console.log(`Sensor-Voltagem{id:${id}, pin: ${pin}}`);

    const sensor = new five.Sensor({ pin: this.pin, freq: 500 });

    sensor.on("data", () => {

      console.log('Sensor de Voltagem: ', sensor.value);

      let adcVoltage = (sensor.value * 5.0) / 1023.0;
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
  };
}

module.exports = SensorVoltagem;