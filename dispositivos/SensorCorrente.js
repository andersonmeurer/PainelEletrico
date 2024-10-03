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

    console.log(`SensorCorrente{id:${id} pin: ${pin}}`);

    this.board.on("ready", () => {
      this.iniciarLeitura(wss, id, pin);
    });
  }

  iniciarLeitura(wss, id, pin) {
    // https://www.youtube.com/watch?v=4GlKsWehGP4
    // Inicializa o sensor
    //const sensor = new five.Pin(this.pin, "analog");
    const sensor = new five.Pin(this.pin, 2, 100);

    let voltage = 0;
    let somaDasCorrentes = 0;

    sensor.read((error, value) => {
      this.somaDasCorrentes += value;
      this.count++;

      if (this.count >= AMOSTRAS) {
        let valor = calculaCorrente(this.somaDasCorrentes / this.count);//filtro digital
        this.count = 0;
        this.somaDasCorrentes = 0;
      }
    });

    let tensaoDC = 12.000; // Defina aqui a tensão DC que você está usando para alimentar seu circuito
    let corrente = 0;
    const SENSIBILIDADE_A30 = 0.066;
    const SENSIBILIDADE_A20 = 0.100;
    const SENSIBILIDADE_A5 = 0.185;
    const AMOSTRAS = 50;
    const calc = (5.000) / 1023.000 * SENSIBILIDADE_A5;

    function calculaCorrente(media) {
      //console.log(`media: ${media}`);
      let amperes = (508 - media) * (5.000) / 1023.000 * SENSIBILIDADE_A5;
      if (media > 508) {
        amperes = (media - 508) * (5.000) / 1023.000 * SENSIBILIDADE_A5;
      }
      //console.log(`Corrente: ${amperes}`);
      if (amperes < 0) {
        amperes = amperes * (-1);
      }
      let volts = (amperes - tensaoDC);

      if (volts < 0) {
        volts = volts * (-1);
      }

      if (amperes > 1) {
        amperes = amperes.toFixed(3) + " A";
      } else {
        amperes = amperes.toFixed(3) + " mA";
      }


      // Exibir os valores no console
      // Enviar dados para o frontend via WebSocket
      if (wss && wss.clients) {
        const dados = {
          class: 'SensorCorrente',
          type: `corrente${id}`,
          id: id,
          corrente: amperes,
//          tensao: volts.toFixed(2)
        };

        wss.clients.forEach(function (server) {
          //console.log("Enviando para o front-end: " + JSON.stringify(dados));
          server.send(JSON.stringify(dados));
        });
      }
    }
  }
}

module.exports = SensorCorrente;