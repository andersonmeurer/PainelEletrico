const CLASS_NAME = "Sensor-Corrente";

const five = require("johnny-five");
const WebSocket = require('ws');

class SensorCorrente {
  constructor(id, board, pin, wss) {
    this.id = id;
    this.board = board;
    this.pin = pin;
    this.wss = wss; // Armazena a instância do WebSocket Server
    this.count = 0;
    this.somaDasCorrentes = 0;

    console.log(`${CLASS_NAME}::{id:${id}, pin: ${this.pin}}`);
    const sensor = new five.Sensor({ pin: this.pin, freq: 3000 });
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
            type: `corrente${id}`,
            id: id,
            value: valor.toFixed(2)
          };

          this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              console.log(`${CLASS_NAME}::Sending: ` + JSON.stringify(dados));
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

module.exports = SensorCorrente;