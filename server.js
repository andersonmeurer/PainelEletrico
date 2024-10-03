numDevices = 2;

//SENSOR DE CORRENTE https://www.usinainfo.com.br/blog/projeto-medindo-corrente-com-o-sensor-acs712-e-o-arduino/
// SENSOR DE VOLTAGEM: https://lastminuteengineers.com/voltage-sensor-arduino-tutorial/

//
    const express = require('express');
    const path = require('path');

    const app = express();
    const PORT = 3000; // ou qualquer porta que você preferir

    // Servir arquivos estáticos (CSS, JS, imagens, etc.)
    app.use('/css', express.static(path.join(__dirname, 'css')));
    app.use('/js', express.static(path.join(__dirname, 'js')));
    app.use('/html', express.static(path.join(__dirname, 'html')));

    // Servir a página HTML
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'html/index.html')); // ajuste o caminho conforme necessário
    });

    // Servir a página config.html
    app.get('/config', (req, res) => {
        res.sendFile(path.join(__dirname, 'html/config.html')); // ajuste o caminho conforme necessário
    });

    // Iniciar o servidor
    app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    });
//

//https://johnny-five.io/api/pin/
const SensorCorrente        = require("./dispositivos/SensorCorrente");
const SensorVoltagem        = require("./dispositivos/SensorVoltagem");
const Display               = require("./dispositivos/Display");
const DeviceConfigLoader    = require("./pinos/DeviceConfigLoader");
const analogPins            = require('./pinos/pins');
const PINOS_PROPERTIES_FILE = './conf/pinos.properties';

// Inicialização da placa Johnny-Five
var five = require("johnny-five");
var board = new five.Board(/*{ port: 'COM9' }*/);

// Inicialização do servidor WebSocket
const WebSocket = require('ws');
// Crie um servidor WebSocket na porta desejada
const wss = new WebSocket.Server({ port: 8080 });

// carrega as configurações do arquivo pinos.properties - inicio
const configLoader = new DeviceConfigLoader(PINOS_PROPERTIES_FILE);
let pinosJS = "";
let pinosJson = "";
function loadConfig() {
    configLoader.loadConfig((config) => {
        pinosJS = config;
        pinosJson = JSON.stringify(config);
        //dispositivosControler.instanciarDispositivos(pinosJS);
    });
}
loadConfig();
// carrega as configurações do arquivo pinos.properties - fim


// Evento disparado quando um cliente se conecta ao servidor WebSocket
wss.on('connection', function connection(ws) {
  // Evento disparado quando o servidor recebe uma mensagem do cliente
  ws.on('message', function incoming(message) {

    const dados = JSON.parse(message);

    // Verifique o tipo da mensagem para diferenciar os parâmetros
    if(dados.type === 'relayStatusChange') {

        //verifica se o dispositivo esta configurado
        if (pinosJS[dados.dispositivo]) {

            const relayId = dados.id;
            const status = dados.status;
            var pino = pinosJS[dados.dispositivo].rele;
            const rele = new five.Pin(pino);
            (!status ? rele.high() : rele.low());
        }
    } else if(dados.type === 'loadConfig') {
        const message = {
            type: 'loadConfig',
            data: pinosJS
        };
        wss.clients.forEach(function(client) {
            ws.send(JSON.stringify(message));
        });
    } else if(dados.type === 'saveConfig') {
        configLoader.saveConfig(dados);
    }
  });

  // Evento disparado quando a conexão com o cliente é fechada
  ws.on('close', function close() {
    console.log('Server.js: Cliente desconectado');
  });
});

// Evento disparado quando o servidor WebSocket estiver pronto para aceitar conexões
wss.on('listening', function() {
    console.log('Server.js: Servidor WebSocket está pronto e ouvindo conexões.');
});

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function instanciarDispositivos() {

    console.log('Server.js: Iniciando Dispositivos...');
    while (!pinosJS) {
        console.log('Server.js: Aguardando pinosJS...');
        await delay(1);
    }

    for (let id = 1; id <= numDevices; id++) {
        let dispositivo = pinosJS[`dispositivo${id}`];

        // SENSORE DE CORRENTE
        if (dispositivo && dispositivo.sensor_corrente) {

            var pin = analogPins[dispositivo.sensor_corrente];
            new SensorCorrente(id, board, pin, wss);
        }

        // DISPLAY
        if (dispositivo && dispositivo.display_clk && dispositivo.display_dio) {
            var clkPin = dispositivo.display_clk;
            var clkDio = dispositivo.display_dio;
            new Display(id, board, wss, clkPin, clkDio);
        }

        // SENSOR DE VOLTAGEM
        if (dispositivo && dispositivo.sensor_voltagem) {
            var pin = analogPins[dispositivo.sensor_voltagem];
            new SensorVoltagem(id, board, wss, pin);
        }
        console.log('Server.js: Dispositivos Iniciados ...');
    }
}
instanciarDispositivos();