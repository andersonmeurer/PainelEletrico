const SensorCorrente    = require("./SensorCorrente");
const SensorVoltagem    = require("./SensorVoltagem");
const Display           = require("./Display");
const analogPins        = require('./pinos/pins');

module.exports = class DispositivosControlerNode {

    constructor(wss, board) {
        this.wss = wss;
        this.board = board;

    }

   async instanciarDispositivos(pinosJS) {
        let instances = [];

        console.log('DispositivosControlerNode.js: Iniciando Dispositivos...');
        while (!pinosJS) {
            console.log('DispositivosControlerNode.js: Aguardando pinosJS...');
            await delay(100);
        }

        for (let id = 1; id <= numDevices; id++) {
            let dispositivo = pinosJS[`dispositivo${id}`];

            // SENSORE DE CORRENTE
            if (dispositivo && dispositivo.sensor_corrente) {

                var pin = analogPins[dispositivo.sensor_corrente];
                let sensorCorrente = new SensorCorrente(id, this.board, pin, this.wss);
                instances.push(sensorCorrente);
            }

            // DISPLAY
            if (dispositivo && dispositivo.display_clk && dispositivo.display_dio) {
                var clkPin = dispositivo.display_clk;
                var clkDio = dispositivo.display_dio;
                let display = new Display(id, this.board, id, this.wss, clkPin, clkDio);
                instances.push(display);
            }

            // SENSOR DE VOLTAGEM
            if (dispositivo && dispositivo.sensor_voltagem) {
                var pin = analogPins[dispositivo.sensor_voltagem];
                let sensorVoltagem = new SensorVoltagem(id, board, wss, pin);
                instances.push(sensorVoltagem);
            }
            console.log('DispositivosControlerNode.js: Dispositivos Iniciados ...');
        }
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}