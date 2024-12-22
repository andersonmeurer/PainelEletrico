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

    const readings = [];
    const maxReadings = 10;
    // Fator de escala do divisor de tensão (ajuste conforme o sensor)
    const voltageDivider = 4.5; // Exemplo: 1/5 do valor real
    const analogResolution = 1023; // Resolução analógica do Arduino (10 bits)
    const referenceVoltage = 5; // Tensão de referência do Arduino
    
    sensor.on("data", () => {
      // Adiciona a nova leitura ao array
      readings.push(sensor.value);

      // Remove a leitura mais antiga se atingir o limite
      if (readings.length > maxReadings) {
        readings.shift();
      }

      // Calcula a média das leituras
      const averageReading = readings.reduce((sum, val) => sum + val, 0) / readings.length;

      const voltage = (averageReading / analogResolution) * referenceVoltage;
      const inputVoltage = voltage * voltageDivider;

      if (this.wss && this.wss.clients) {
        const dados = {
          moduleName: this.moduleName,
          class: CLASS_NAME,
          value: inputVoltage.toFixed(2)
        };

        this.wss.clients.forEach(server => {
          if (server.readyState === WebSocket.OPEN) {
            //console.log(`${CLASS_NAME}::Sending: ` + JSON.stringify(dados));
            //console.log(`${CLASS_NAME}::Tensão medida: ${inputVoltage.toFixed(2)}V`);
            server.send(JSON.stringify(dados));
          }
        });
      }
    });
  }
}

module.exports = SensorVoltagem;