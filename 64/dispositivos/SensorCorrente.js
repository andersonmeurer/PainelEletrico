const CLASS_NAME = "Sensor-Corrente";

const five = require("johnny-five");
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3000');

class SensorCorrente {
  constructor(id, board, pin, wss) {
    this.id = id;
    this.board = board;
    this.pin = pin;
    this.wss = wss; // Armazena a instância do WebSocket Server
    this.count = 0;
    this.somaDasCorrentes = 0;

    console.log(`${CLASS_NAME}::{id:${id}, pin: ${this.pin}}`);
    const sensor = new five.Sensor({ pin: this.pin, freq: 2000 });
    let valorFiltrado = 0;

    sensor.on("data", () => {
      this.somaDasCorrentes += sensor.value;
      this.count++;

      if (this.count >= 1) { // Número de amostras para média
        let valor = this.somaDasCorrentes / this.count;
        valorFiltrado = this.calculaCorrente(valor); // Filtro digital
        this.count = 0;
        this.somaDasCorrentes = 0;

        if (this.wss && this.wss.clients) {
          const dados = {
            class: `SensorCorrente`,
            id: this.id,
            value: valorFiltrado.toFixed(2)
          };

          this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              //console.log(`${CLASS_NAME}::Sending: ` + JSON.stringify(dados));
              client.send(JSON.stringify(dados));
            }
          });
        }
      }
    });
  }

  calculaCorrente(valor) {
    const tensaoDC = 12.000; // Defina aqui a tensão DC que você está usando para alimentar seu circuito
    const SENSIBILIDADE_A30 = 0.066; // Sensibilidade do sensor ACS712-30A
    const corrente = (valor - (tensaoDC / 2)) / SENSIBILIDADE_A30;
    return corrente;
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

module.exports = SensorCorrente;