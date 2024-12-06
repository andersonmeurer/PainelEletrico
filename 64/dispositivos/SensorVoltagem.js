// SENSOR DE VOLTAGEM: https://lastminuteengineers.com/voltage-sensor-arduino-tutorial/

const five = require("johnny-five");

class SensorVoltagem {
  constructor(id, board, wss, pin) {
    this.id = id;
    this.board = board;
    this.wss = wss;
    this.pin = pin;
    this.valorFiltrado = 0;
    this.alpha = 0.1; // Constante de suavização

    console.log(`Sensor-Voltagem{id:${id}, pin: ${pin}}`);

    const sensor = new five.Sensor({ pin: this.pin, freq: 3000 });

    sensor.on("data", () => {

      let adcVoltage = (sensor.value * 5.0) / 1023.0;
      let inVoltage = adcVoltage * (30000.0 + 7500.0) / 7500.0;

      // Aplicar filtro passa-baixa
      this.valorFiltrado = this.alpha * inVoltage + (1 - this.alpha) * this.valorFiltrado;

      if (wss && wss.clients) {
        //console.log('Sensor de Voltagem: ', this.valorFiltrado.toFixed(2));
        const dados = {
          class: `SensorVoltagem`,
          type: `voltagem${id}`,
          id: id,
          value: this.valorFiltrado.toFixed(2)
        };

        wss.clients.forEach(function (server) {
          server.send(JSON.stringify(dados));
        });
      }
    });
  };
}

module.exports = SensorVoltagem;