const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());

app.get('/v2/config/pinos.properties', (req, res) => {
  const filePath = path.join(__dirname, 'config', 'pinos.properties');

  fs.readFile(filePath, 'utf8', (err, data) => {
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

app.post('/saveConfig', (req, res) => {
  const config = req.body.config;
  const filePath = path.join(__dirname, 'config', 'pinos.properties');

  fs.writeFile(filePath, config, (err) => {
    if (err) {
      console.error('Erro ao salvar o arquivo:', err);
      res.status(500).send('Erro ao salvar o arquivo');
    } else {
      res.send('Arquivo salvo com sucesso');
    }
  });
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
const five = require('johnny-five');
var board = new five.Board();

board.on("ready", () => {
  console.log("Johnny-Five está pronto!");
  isBoardReady = true;
});

board.on("error", (err) => {
  console.error("Erro na inicialização da placa:", err);
});
//------------------------------------------------------------ johnny-five