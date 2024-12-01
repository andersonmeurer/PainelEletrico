/*document.addEventListener('DOMContentLoaded', () => {
    fetch('/loadConfig')
        .then(response => response.text())
        .then(data => loadConfig(data))
        .catch(error => console.error('Erro ao carregar a configuração:', error));
});

function loadConfig(data) {
    const lines = data.split('\n');
    let currentModule = null;
    const modules = [];

    const deviceLabels = {
        SensorCorrente: 'Sensor de Corrente',
        SensorVoltagem: 'Sensor de Voltagem',
        Rele: 'Relê',
        Display: 'Display'
    };

    lines.forEach(line => {
        if (line.startsWith('[') && line.endsWith(']')) {
            const moduleName = line.slice(1, -1);
            currentModule = {
                name: moduleName,
                devices: []
            };
            modules.push(currentModule);
        } else if (currentModule) {
            const [key, value] = line.split('=');
            if (key.startsWith('display_')) {
                const type = 'Display';
                let device = currentModule.devices.find(device => device.type === type);
                if (!device) {
                    device = { type, label: deviceLabels[type], clk: '', dio: '' };
                    currentModule.devices.push(device);
                }
                if (key === 'display_clk') {
                    device.clk = value;
                } else if (key === 'display_dio') {
                    device.dio = value;
                }
            } else {
                const type = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
                let device = currentModule.devices.find(device => device.type === type);
                if (!device) {
                    device = { type, label: deviceLabels[type] || type, pin: '' };
                    currentModule.devices.push(device);
                }
                device.pin = value;
            }
        }
    });

    updateModuleList(modules);
}

function updateModuleList(modules) {
    const moduleList = document.getElementById('dadosDoBackend');
    moduleList.innerHTML = '';

    modules.forEach(module => {
        const moduleElement = document.createElement('div');
        moduleElement.className = 'module';
        moduleElement.innerHTML = `
            <h2>${module.name}</h2>
            <div id="${module.name}-devices">
                ${module.devices.map(device => createDeviceElement(module.name, device)).join('')}
            </div>
        `;
        moduleList.appendChild(moduleElement);
    });
}

function createDeviceElement(moduleName, device) {
    const deviceLabels = {
        SensorCorrente: 'Sensor de Corrente',
        SensorVoltagem: 'Sensor de Voltagem',
        Rele: 'Relê',
        Display: 'Display'
    };

    if (device.type === 'Display') {
        return `
            <div class="form-group">
                <label for="${moduleName}-${device.type}-clk">${device.label} CLK:</label>
                <input type="number" id="${moduleName}-${device.type}-clk" value="${device.clk}">
                <label for="${moduleName}-${device.type}-dio">${device.label} DIO:</label>
                <input type="number" id="${moduleName}-${device.type}-dio" value="${device.dio}">
            </div>
        `;
    } else if (device.type === 'Rele') {
        return `
            <div class="form-group">
                <label for="${moduleName}-${device.type}-pin">${deviceLabels[device.type]}:</label>
                <input type="number" id="${moduleName}-${device.type}-pin" value="${device.pin}">
                <label for="${moduleName}-${device.type}-state">Estado:</label>
                <input type="radio" id="${moduleName}-${device.type}-on" name="${moduleName}-${device.type}-state" value="on"> Ligar
                <input type="radio" id="${moduleName}-${device.type}-off" name="${moduleName}-${device.type}-state" value="off"> Desligar
            </div>
        `;
    } else {
        return `
            <div class="form-group">
                <label for="${moduleName}-${device.type}-pin">${deviceLabels[device.type]}:</label>
                <input type="number" id="${moduleName}-${device.type}-pin" value="${device.pin}">
            </div>
        `;
    }
}

// Criar uma instância do WebSocket, conectando-a ao servidor
const ws = new WebSocket('ws://localhost:8080');

// Manipulador de eventos para mensagens recebidas
ws.onmessage = function(event) {
    console.log('Client.js: Mensagem recebida do servidor:', event.data);
    let dados = JSON.parse(event.data);

    if (dados.class === 'SensorCorrente') {
        let isOn = $(`#rele_${dados.id}`);
        if (!isOn.prop('checked')) {
            $(`#corrente_${dados.id}`).text('0');
            ws.send(JSON.stringify({ id: dados.id, value: 0 }));
        } else {
            $(`#corrente_${dados.id}`).text(dados.corrente || '');
            ws.send(JSON.stringify({ id: dados.id, value: dados.corrente }));
        }
    } else if (dados.class === 'SensorVoltagem') {
        let isOn = $(`#rele_${dados.id}`);
        if (!isOn.prop('checked')) {
            $(`#tensao_${dados.id}`).text('0');
            dados.tensao = 0;
            ws.send(JSON.stringify({ dados: dados }));
        } else {
            $(`#tensao_${dados.id}`).text(dados.tensao || '');
            ws.send(JSON.stringify({ dados: dados }));
        }
    }
};

// Definir evento para quando a conexão WebSocket é fechada
ws.onclose = function () {
    console.log('ServerJS.js: Conexão WebSocket fechada');
};

// Função para enviar uma mensagem para o servidor
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value;

    // Enviar a mensagem para o servidor
    ws.send(message);

    // Limpar o campo de entrada de mensagem
    messageInput.value = '';
}

$(document).ready(function(){
    $('input[type="checkbox"]').prop('checked', false);

    $('input[type="checkbox"]').change(function(){
        const isChecked = $(this).prop('checked');
        const relayId = $(this).attr('id');
        const dispositivo = $(this).parent().parent().attr('id');

        const message = {
            type: 'relayStatusChange',
            id: relayId,
            status: isChecked,
            dispositivo: dispositivo
        };

        ws.send(JSON.stringify(message));
    });
});
*/