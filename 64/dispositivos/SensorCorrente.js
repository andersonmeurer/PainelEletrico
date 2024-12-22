const CLASS_NAME = "SensorCorrente";

const five = require("johnny-five");
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3000');

const SENSIBILIDADE_A30 = 0.066; // Sensibilidade do sensor ACS712-30A
const SENSIBILIDADE_A20 = 0.100;// 20A: 100 mV/A
const SENSIBILIDADE_A05 = 0.185;// 5A: 185 mV/A
const analogResolution = 1023; // Resolução ADC (10 bits)
const referenceVoltage = 5; // Tensão de referência (5V)
const zeroCurrentVoltage = referenceVoltage / 2; // Offset de repouso (2.5V)
const readings = []; // Armazena leituras para a média
const maxReadings = 10; // Número máximo de leituras para calcular a média

class SensorCorrente {
  constructor(moduleName, board, pin, wss) {
    this.moduleName = moduleName;
    this.board = board;
    this.pin = pin;
    this.wss = wss; // Armazena a instância do WebSocket Server
    this.count = 0;
    this.somaDasCorrentes = 0;

    console.log(`${CLASS_NAME}::{moduleName:${moduleName}, pin:${pin}}`);
    const sensor = new five.Sensor({ pin: this.pin, freq: 1000 });

    sensor.on("data", () => {

      // Adiciona a nova leitura ao array
      readings.push(sensor.value);

      // Remove a leitura mais antiga se atingir o limite
      if (readings.length > maxReadings) {
        readings.shift();
      }

      // Calcula a média das leituras
      const averageReading = readings.reduce((sum, val) => sum + val, 0) / readings.length;

      // Conversão da leitura analógica para tensão
      const voltage = (averageReading / analogResolution) * referenceVoltage;

      // Calcula a corrente com base na sensibilidade
      const current = (voltage - zeroCurrentVoltage) / SENSIBILIDADE_A05;

      //console.log(`Leitura do sensor: ${sensor.value}`);
      //console.log(`Tensão medida: ${voltage.toFixed(2)}V`);
      //console.log(`Corrente: ${current.toFixed(2)}A`);

      if (this.wss && this.wss.clients) {
        const dados = {
          moduleName: this.moduleName,
          class: CLASS_NAME,
          value: current.toFixed(2)
        };

        this.wss.clients.forEach(server => {
          if (server.readyState === WebSocket.OPEN) {
            console.log(`${CLASS_NAME}::Sending: ` + JSON.stringify(dados));
            server.send(JSON.stringify(dados));
          }
        });
      }
    });
  }

  calculaCorrente(valor) {
    const tensaoDC = 12.000; // Defina aqui a tensão DC que você está usando para alimentar seu circuito
    const SENSIBILIDADE_A30 = 0.066; // Sensibilidade do sensor ACS712-30A
    const SENSIBILIDADE_A20 = 0.100;// 20A: 100 mV/A
    const SENSIBILIDADE_A05 = 0.185;// 5A: 185 mV/A
    const corrente = (valor - (tensaoDC / 2)) / SENSIBILIDADE_A05;
    return corrente;
  }
}

ws.on('open', () => {
  console.log(`${CLASS_NAME}:: Conexão estabelecida com o servidor!`);
});

ws.on('message', (data) => {
  ws.send(data);
});

module.exports = SensorCorrente;