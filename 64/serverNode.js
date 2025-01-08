const CLASS_NAME = "Server-Node";
logWithTimestamp(`${CLASS_NAME} is starting...`);

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
      try {
        loadProperties().then(properties => {
          const devices = boardOn_loadFile_loadDevices(properties);
          console.log('Arquivo lido com sucesso:', JSON.stringify(devices));
          res.json(devices);
        });
      } catch (parseError) {
        console.error('Erro ao analisar o arquivo de configuração:', parseError);
        res.status(500).send('Erro ao analisar o arquivo de configuração');
      }
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
    console.error(`${CLASS_NAME}::Placa não está pronta para receber comandos.`);
    return res.status(500).send('Placa não está pronta');
  }
});

app.get('/config', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'config/config.html'));
});
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, () => {
  logWithTimestamp(`${CLASS_NAME}::Servidor HTTP e WebSocket rodando em http://localhost:${PORT}`);
});

wss.on('connection', function connection(ws, req) {
  const clientAddress = req.socket.remoteAddress;
  const clientPort = req.socket.remotePort;
  logWithTimestamp(`${CLASS_NAME}::New client connected from ${req.socket.remoteAddress}`);
  logWithTimestamp(`${CLASS_NAME}::Novo cliente conectado: ${clientAddress}:${clientPort}`);

  ws.on('message', function incoming(message) {
    try {
      const data = JSON.parse(message);
      logWithTimestamp(`${CLASS_NAME}::Dados recebidos: ${JSON.stringify(data)}`);

      // Processar a mensagem recebida
      if (data.class === SENSOR_VOLTAGEM || data.class === SENSOR_CORRENTE) {
        logWithTimestamp(`Valor recebido do sensor ${data.moduleName}.${data.class}: ${data.value}`);
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

  ws.on('error', function error(err) {
    console.error('WebSocket client error:', err);
  });

  ws.on('close', function close() {
    logWithTimestamp(`${CLASS_NAME}::Client disconnected`);
  });

  ws.send(JSON.stringify({ message: 'Conexão estabelecida com sucesso' }));
});

let isBoardReady = false;
const board = new five.Board();

board.on("ready", () => {
  logWithTimestamp(`${CLASS_NAME}::Johnny-Five está pronto!`);
  isBoardReady = true;
  boardOn_loadFile();
});

board.on("error", (err) => {
  console.error("${CLASS_NAME}::Erro na inicialização da placa:", err);
});

const displays = [];

function loadProperties() {
  return new Promise((resolve, reject) => {
    fs.readFile(configFilePath, 'utf8', (err, properties) => {
      if (err) {
        console.error(`${CLASS_NAME}::Erro ao ler o arquivo de configuração:`, err);
        reject(err);
      } else {
        resolve(properties);
      }
    });
  });
}

function boardOn_loadFile() {
//JSON.stringify

    loadProperties().then(properties => {

    const devices = boardOn_loadFile_loadDevices(properties);

    devices.forEach(device => {
      if (device.name === 'Camera') {
        logWithTimestamp(`${CLASS_NAME}::Instanciando câmera: {moduleName:${device.name}, IP:${device.cameraIP}, Port:${device.cameraPort}}`);

      } else if (!device.sensorcorrente && !device.sensorvoltagem) {
        console.error(`${CLASS_NAME}::Erro: O módulo '${device.name}' deve ter pelo menos um sensor de corrente ou um sensor de voltagem.`);
        console.error('Configuração inválida:', device);
        return;
      }

      if (device.sensorcorrente) {
        logWithTimestamp(`${CLASS_NAME}::Instanciando sensor de corrente: {moduleName:${device.name}, Pin:${device.sensorcorrente}}`);
        new SensorCorrente(device.name, board, device.sensorcorrente, wss);

      } else if (device.sensorvoltagem) {
        logWithTimestamp(`${CLASS_NAME}::Instanciando sensor de voltagem: {moduleName:${device.name}, Pin:${device.sensorvoltagem}}`);
        new SensorVoltagem(device.name, board, wss, device.sensorvoltagem);

      } else if (device.display_clk && device.display_dio) {
        logWithTimestamp(`${CLASS_NAME}::Instanciando display: {moduleName:${device.name}, Name:${device.name}, {clk:${device.display_clk}, dio:${device.display_dio}}`);
        const display = new Display(device.name, board, device.display_clk, device.display_dio);
        displays.push(display);
      }
    });
  })
  .catch(err => {
    console.error(`${CLASS_NAME}::Erro ao carregar as propriedades:`, err);
  });
}

function boardOn_loadFile_loadDevices(config) {
  const devices = [];
  const lines = config.trim().split('\n');
  let currentDevice = null;
  let cameraIP = '';
  let cameraPort = '';

  lines.forEach(line => {
    if (line.startsWith('[') && line.endsWith(']')) {
      if (currentDevice) {
        devices.push(currentDevice);
      }
      currentDevice = { name: line.slice(1, -1) };
    } else if (currentDevice) {
      const [key, value] = line.split('=');
      if (!key || !value) {
        console.error(`${CLASS_NAME}::Linha inválida na configuração: ${line}`);
        return;
      }
      currentDevice[key.trim()] = value.trim();
    } else {
      const [key, value] = line.split('=');
      if (key.trim() === 'camera_ip') {
        cameraIP = value.trim();
      } else if (key.trim() === 'camera_port') {
        cameraPort = value.trim();
      }
    }
  });

  if (currentDevice) {
    devices.push(currentDevice);
  }

  // Add camera device with IP and port
  /*const camera = {
    name: 'Camera',
    ip: cameraIP, // Replace with actual IP
    port: cameraPort // Replace with actual port
  };
  devices.push(camera);*/
  return devices;
}

function logWithTimestamp(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${CLASS_NAME}::${message}`);
}