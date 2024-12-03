//SENSOR DE CORRENTE https://www.usinainfo.com.br/blog/projeto-medindo-corrente-com-o-sensor-acs712-e-o-arduino/
//https://www.youtube.com/watch?v=4GlKsWehGP4
const five = require("johnny-five");

class SensorCorrente {
  constructor(id, board, pin, wss) {
    this.id = id;
    this.board = board;
    this.pin = pin;
    this.wss = wss; // Armazena a instância do WebSocket Server
    this.count = 0;
    this.somaDasCorrentes = 0;

    console.log(`Sensor-Corrente{id:${id}, pin: ${pin}}`);

    this.iniciarLeitura(wss, id, pin);
  }

  iniciarLeitura(wss, id, pin) {
    console.log(`Sensor-Corrente{id:${id}, pin: ${this.pin}}`);
    const sensor = new five.Sensor({ pin: this.pin, freq: 500 });

    sensor.on("data", () => {

      console.log('Sensor de Corrente: ', sensor.value);

      this.somaDasCorrentes += sensor.value;
      this.count++;

      if (this.count >= 100) { // Número de amostras para média
        console.log(`Soma das correntes: ${this.somaDasCorrentes}`);
        
        let valor = this.calculaCorrente(this.somaDasCorrentes / this.count); // Filtro digital
        this.count = 0;
        this.somaDasCorrentes = 0;

        if (wss && wss.clients) {
          const dados = {
            class: `SensorCorrente`,
            type: `corrente${id}`,
            id: id,
            corrente: valor.toFixed(2)
          };

          wss.clients.forEach(function (server) {
            server.send(JSON.stringify(dados));
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