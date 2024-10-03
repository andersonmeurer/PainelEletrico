const ws = new WebSocket('ws://localhost:8080');
//----------------------------------------------------------------------------
// criar configuração de dispositivos dinamicamente
//----------------------------------------------------------------------------
// Determine the number of devices you want to create
numDevices = 2;

// Get a reference to the container where you want to add the devices
var container = document.getElementById('deviceContainer');

// Loop through the number of devices
for (var i = 1; i <= numDevices; i++) {
    // Create the fieldset and legend
    var fieldset = document.createElement('fieldset');
    var legend = document.createElement('legend');
    legend.textContent = 'Dispositivo ' + i;
    fieldset.appendChild(legend);

    // Create the inputs for the rele, sensor_corrente, and sensor_voltagem
    var inputs = ['rele', 'sensor_corrente', 'sensor_voltagem','display_clk', 'display_dio'];
    for (var j = 0; j < inputs.length; j++) {
        var div = document.createElement('div');
        var label = document.createElement('label');
        label.setAttribute('for', 'dispositivo_' + inputs[j] + '_'+ i);
        label.textContent = 'Pino para o ' + inputs[j] + ':';
        div.appendChild(label);

        var input = document.createElement('input');
        input.setAttribute('type', 'number');
        input.setAttribute('id', 'dispositivo_' + inputs[j] + '_' + i);
        input.setAttribute('name', 'dispositivo_' + inputs[j] + '_' + i);
        input.setAttribute('min', '0');
        input.setAttribute('max', '40');
        div.appendChild(input);

        fieldset.appendChild(div);
    }

    // Add the fieldset to the container
    container.appendChild(fieldset);
}

//----------------------------------------------------------------------------
// monta a estrutura de dados para salvar no arquivo .properties
//----------------------------------------------------------------------------
document.getElementById("saveButton").addEventListener('click', function(event) {
    event.preventDefault(); // Prevent the form from being submitted

    var pins = {};

    for (var i = 1; i <= numDevices; i++) {
        let rele            =   document.getElementById('dispositivo_rele_' + i).value;
        let sensor_corrente =   document.getElementById('dispositivo_sensor_corrente_' + i).value;
        let sensor_voltagem =   document.getElementById('dispositivo_sensor_voltagem_' + i).value;
        let display_clk     =   document.getElementById('dispositivo_display_clk_' + i).value;
        let display_dio     =   document.getElementById('dispositivo_display_dio_' + i).value;

        // Verificar se os pinos já estão sendo usados
        if (!validateAndAddPin(rele) || !validateAndAddPin(sensor_corrente) || !validateAndAddPin(sensor_voltagem) || !validateAndAddPin(display_clk) || !validateAndAddPin(display_dio)) {
            usedPins = [];
            console.error('Erro: O mesmo pino está sendo usado em mais de um campo.');
            return;
        }

        // Salvar os pinos no objeto pins
        pins['dispositivo' + i] = {
            rele: rele,
            sensor_corrente: sensor_corrente,
            sensor_voltagem: sensor_voltagem,
            display_clk: display_clk,
            display_dio: display_dio
        };
    }

    saveConfig(pins);
    usedPins = [];
});

// Array para armazenar os pinos usados
let usedPins = [];

// Função para validar e adicionar um pino
function validateAndAddPin(pin) {
    if (usedPins.includes(pin)) {
        return false;
    } else {
        usedPins.push(pin);
        return true;
    }
}

//----------------------------------------------------------------------------
// savar dados no arquivo .properties
//----------------------------------------------------------------------------
function saveConfig(pins) {
    // Convert the pins object to a properties string
    let data = { type: 'saveConfig' };
    for (const device in pins) {
        for (const pin in pins[device]) {
            //data += `${device}.${pin}=${pins[device][pin]}\n`;
            data[device] = pins[device];
        }
    }

    ws.send(JSON.stringify(data));
    console.log('configJS.js: Mensagem recebida do servidor:', data);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function loadConfig() {
    console.log('configJS.js: Carregando configuração...', ws.readyState);
    while (!ws) {
        console.log('configJS.js: Aguardando ws1...');
        await sleep(1);
    }
    while (ws.readyState !== WebSocket.OPEN) {
        console.log('configJS.js: Aguardando ws2...');
        await sleep(1);
    }

    let requestMessage = {
        type: 'loadConfig'
    };
    
    // Enviar a mensagem de solicitação para o servidor retornar configuração carregada dos pinos para este cliente
    ws.send(JSON.stringify(requestMessage));    
}

 // Manipular a mensagem de resposta do servidor
 ws.onmessage = function(message) {
     let dados = JSON.parse(message.data);
     if (dados.type === 'loadConfig') {

        // Carregar os dados recebidos para o HTML
        for (var i = 1; i <= numDevices; i++) {
            var device = dados.data['dispositivo' + i];
            if (device) {                    
                document.getElementById('dispositivo_rele_' + i).value = device.rele;
                document.getElementById('dispositivo_sensor_corrente_' + i).value = device.sensor_corrente;
                document.getElementById('dispositivo_sensor_voltagem_' + i).value = device.sensor_voltagem;
                document.getElementById('dispositivo_display_clk_' + i).value = device.display_clk;
                document.getElementById('dispositivo_display_dio_' + i).value = device.display_dio;
            }
        }
    }
};

// Pinos analógicos do Arduino
const dados = {82: 'A15', 83: 'A14', 84: 'A13', 85: 'A12', 86: 'A11', 87: 'A10', 88: 'A9', 89: 'A8', 90: 'A7', 91: 'A6', 92: 'A5', 93: 'A4', 94: 'A3', 95: 'A2', 96: 'A1', 97: 'A0' };

// Cria a janela flutuante
const floatingWindow = document.createElement('div');
floatingWindow.style.position = 'fixed';
floatingWindow.style.right = '20px';
floatingWindow.style.top = '20px';
floatingWindow.style.border = '1px solid black';
floatingWindow.style.padding = '10px';
floatingWindow.style.backgroundColor = 'white';

// Gera o HTML para cada item de dados
for (let pin in dados) {
    const label = document.createElement('label');
    label.textContent = `Pin ${dados[pin]} - ${pin}`;
    label.htmlFor = `pin${pin}`;

    floatingWindow.appendChild(label);
}

// Adiciona a janela flutuante ao corpo do documento
document.body.appendChild(floatingWindow);

loadConfig();