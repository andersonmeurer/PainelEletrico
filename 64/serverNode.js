const express = require('express');
const fs = require('fs');
const path = require('path');
const five = require('johnny-five');
const WebSocket = require('ws');
const Display = require(path.join(__dirname, 'dispositivos', 'Display')); // Importe a classe Display

const app = express();
const PORT = 3000;

// Variável global para o caminho do arquivo
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

// Rota para a página inicial
app.get('/config', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'config/config.html'));
});
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

//------------------------------------------------------------ johnny-five
let isBoardReady = false;
const board = new five.Board();

board.on("ready", () => {
  console.log("Johnny-Five está pronto!");
  isBoardReady = true;

  const wss = new WebSocket.Server({ port: 8080 });

  // Ler a configuração do arquivo pinos.properties
  fs.readFile(configFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Erro ao ler o arquivo de configuração:', err);
      return;
    }

    const config = parseConfig(data);
    const displayConfig = config.find(device => device.display_clk && device.display_dio);
    

    // nao esta entrando aqui. Continuar a partir daqui
    
    //console.log(data);
    if (displayConfig) {
      console.log('oi ' + displayConfig.id, displayConfig.clkPin, displayConfig.dioPin);
      const display = new Display(displayConfig.id, board, displayConfig.clkPin, displayConfig.dioPin); // Instancie o display com os pinos configurados

      wss.on('connection', function connection(ws) {
        ws.on('message', function incoming(message) {
          const data = JSON.parse(message);
          if (data.class === 'SensorVoltagem' && data.id === display.id) {
            display.printNumber(data.tensao);
          }
        });

        ws.send(JSON.stringify({ message: 'something' }));
      });
    }
  });
});

board.on("error", (err) => {
  console.error("Erro na inicialização da placa:", err);
});
//------------------------------------------------------------ johnny-five

function parseConfig(config) {
  const devices = [];
  const lines = config.trim().split('\n');
  let currentDevice = null;

  lines.forEach(line => {
    if (line.startsWith('[') && line.endsWith(']')) {
      if (currentDevice) {
        devices.push(currentDevice);
      }
      currentDevice = { name: line.slice(1, -1), devices: [] };
    } else if (currentDevice) {
      const [key, value] = line.split('=');
      if (key === 'display_clk') {
        currentDevice.clkPin = value;
      } else if (key === 'display_dio') {
        currentDevice.dioPin = value;
      } else {
        currentDevice[key] = value;
      }
    }
  });

  if (currentDevice) {
    devices.push(currentDevice);
  }

  return devices;
}