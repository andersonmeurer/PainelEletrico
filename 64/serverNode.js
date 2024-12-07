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

wss.on('connection', (ws) => {

  console.log(`${CLASS_NAME}::Cliente conectado`);

  // Receber mensagens dos clientes
  ws.on('message', (message) => {
      console.log(`${CLASS_NAME}::Mensagem recebida do cliente:${message.toString()}`);

      // Opcional: enviar uma resposta ao cliente
      //ws.send(`Mensagem recebida: ${message}`);
  });

  // Evento para lidar com desconexão
  ws.on('close', () => {
      console.log('${CLASS_NAME}::Cliente desconectado');
  });

  // Evento para lidar com erros
  ws.on('error', (error) => {
      console.error('${CLASS_NAME}::Erro no WebSocket:', error);
  });
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
      if (device.sensorcorrente) {
        device.sensorcorrente_id = board_on_loadFile_generateId(); // Gerar um ID único de 3 dígitos para sensor de corrente
        console.log(`${CLASS_NAME}::Instanciando sensor de corrente: {Id: `, device.sensorcorrente_id, 'Pin: ', device.sensorcorrente, 'Name:', device.name, '}');
        new SensorCorrente(device.sensorcorrente_id, board, device.sensorcorrente, wss);
      } else if (device.sensorvoltagem) {
        device.sensorvoltagem_id = board_on_loadFile_generateId(); // Gerar um ID único de 3 dígitos para sensor de voltagem
        console.log(`${CLASS_NAME}::Instanciando sensor de voltagem: {Id: `, device.sensorvoltagem_id, ' Name: ', device.name, ' Pin: ', device.sensorvoltagem, '}');
        new SensorVoltagem(device.sensorvoltagem_id, board, wss, device.sensorvoltagem);
      } else if (device.rele) {
        device.rele_id = board_on_loadFile_generateId(); // Gerar um ID único de 3 dígitos para relé
        console.log(`${CLASS_NAME}::Instanciando relé: {Id:`, device.rele_id, ' Name: ', device.name, 'Pin: ', device.rele, '}');
        // Adicione a lógica para instanciar o relé aqui, se necessário
      } else if (device.display_clk && device.display_dio) {
        device.display_id = board_on_loadFile_generateId(); // Gerar um ID único de 3 dígitos para display
        console.log(`${CLASS_NAME}::Instanciando display: {Id:`, device.display_id, 'Name:', device.name, '{clk:', device.display_clk, ',dio:', device.display_dio, '}}');
        const display = new Display(device.display_id, board, device.display_clk, device.display_dio);
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

function board_on_loadFile_generateId() {
  return Math.floor(100 + Math.random() * 900).toString(); // Gera um ID de 3 dígitos
}