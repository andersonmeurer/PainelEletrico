const CLASS_NAME = "Server-Node";

const SENSOR_CORRENTE = 'SensorCorrente';
const SENSOR_VOLTAGEM = 'SensorVoltagem';

const express = require('express');
const fs = require('fs');
const path = require('path');
const five = require('johnny-five');
const http = require('http');
const WebSocket = require('ws');
const Display = require(path.join(__dirname, 'dispositivos', 'Display'));
const SensorVoltagem = require(path.join(__dirname, 'dispositivos', 'SensorVoltagem'));
const SensorCorrente = require(path.join(__dirname, 'dispositivos', 'SensorCorrente'));

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = 3000;

const configFilePath = path.join(__dirname, 'config', 'pinos.properties');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/loadConfig', (req, res) => {
  fs.readFile(configFilePath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.status(404).send('Arquivo não encontrado');
      } else {
        console.error('Erro ao ler o arquivo:', err);
        res.status(500).send('Erro ao ler o arquivo');
      }
    } else {
      res.send(data);
    }
  });
});

app.get('/configFilePath', (req, res) => {
  res.json({ path: configFilePath });
});

app.post('/saveConfig', (req, res) => {
  const config = req.body.config;

  fs.writeFile(configFilePath, config, (err) => {
    if (err) {
      console.error('Erro ao salvar o arquivo:', err);
      res.status(500).send('Erro ao salvar o arquivo');
    } else {
      res.send('Arquivo salvo com sucesso');
    }
  });
});

app.post('/togglePin', (req, res) => {
  const { pin, state } = req.body;
  if (isBoardReady) {
    const led = new five.Led(pin);
    if (state === 'on') {
      led.on();
    } else {
      led.off();
    }
    res.send('Comando enviado ao Arduino');
  } else {
    res.status(500).send('Placa não está pronta');
  }
});

app.get('/config', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'config/config.html'));
});
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`${CLASS_NAME}::Servidor HTTP e WebSocket rodando em http://localhost:${PORT}`);
});

wss.on('connection', function connection(ws, req) {
  const clientAddress = req.socket.remoteAddress;
  const clientPort = req.socket.remotePort;

  console.log(`${CLASS_NAME}::Novo cliente conectado: ${clientAddress}:${clientPort}`);

  ws.on('message', function incoming(message) {
    console.log(`${CLASS_NAME}::Mensagem recebida do cliente:`, message.toString());
    try {
      const data = JSON.parse(message);
      console.log(`${CLASS_NAME}::Dados recebidos:`, data);

      // Processar a mensagem recebida
      if (data.class === SENSOR_VOLTAGEM || data.class === SENSOR_CORRENTE) {
        console.log(`Valor recebido do sensor ${data.id}: ${data.value}`);
        // Enviar o valor para o display correspondente
        displays.forEach(display => {
          if (display.moduleName === data.moduleName) {
            display.printNumber(data.value);
          }
        });
      }
    } catch (error) {
      console.error(`${CLASS_NAME}::Erro ao processar a mensagem:`, error);
    }
  });

  ws.send(JSON.stringify({ message: 'Conexão estabelecida com sucesso' }));
});

let isBoardReady = false;
const board = new five.Board();

board.on("ready", () => {
  console.log(`${CLASS_NAME}::Johnny-Five está pronto!`);
  isBoardReady = true;
  boardOn_loadFile();
});

board.on("error", (err) => {
  console.error("${CLASS_NAME}::Erro na inicialização da placa:", err);
});

const displays = [];

function boardOn_loadFile() {
  fs.readFile(configFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('${CLASS_NAME}::Erro ao ler o arquivo de configuração:', err);
      return;
    }

    const config = boardOn_loadFile_parseConfig(data);

    config.forEach(device => {
      if (!device.sensorcorrente && !device.sensorvoltagem) {
        console.error(`${CLASS_NAME}::Erro: O módulo ${device.name} deve ter pelo menos um sensor de corrente ou um sensor de voltagem.`);
        console.error('Configuração inválida:', device);
        return;
      }

      if (device.sensorcorrente) {
        console.log(`${CLASS_NAME}::Instanciando sensor de corrente: {moduleName:${device.name}, Pin:${device.sensorcorrente}}`);
        new SensorCorrente(device.name, board, device.sensorcorrente, wss);
      }

      if (device.sensorvoltagem) {
        console.log(`${CLASS_NAME}::Instanciando sensor de voltagem: {moduleName:${device.name}, Pin:${device.sensorvoltagem}`);
        new SensorVoltagem(device.name, board, wss, device.sensorvoltagem);
      }

      if (device.display_clk && device.display_dio) {
        console.log(`${CLASS_NAME}::Instanciando display: {moduleName:${device.name}, Name:${device.name}, {clk:${device.display_clk}, dio:${device.display_dio}}`);
        const display = new Display(device.name, board, device.display_clk, device.display_dio);
        displays.push(display);
      }
    });
  });
}

function boardOn_loadFile_parseConfig(config) {
  const devices = [];
  const lines = config.trim().split('\n');
  let currentDevice = null;

  lines.forEach(line => {
    if (line.startsWith('[') && line.endsWith(']')) {
      if (currentDevice) {
        devices.push(currentDevice);
      }
      currentDevice = { name: line.slice(1, -1) };
    } else if (currentDevice) {
      const [key, value] = line.split('=');
      currentDevice[key] = value;
    }
  });

  if (currentDevice) {
    devices.push(currentDevice);
  }

  return devices;
}