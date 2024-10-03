numDevices = 2;

for (let id = 1; id <= numDevices; id++) {
    const device = createDeviceHTML(id);
    //document.body.appendChild(device);
    document.getElementById('dadosDoBackend').appendChild(device);
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
            //dados.corrente = 0;
            //ws.send(JSON.stringify({ dados: dados }));
        } else {
            // Atualizar os campos correspondentes no HTML com os dados recebidos do backend
            $(`#corrente_${dados.id}`).text(dados.corrente || '');
            ws.send(JSON.stringify({ id: dados.id, value: dados.corrente }));
            //ws.send(JSON.stringify({ dados: dados }));
        }
    } else if (dados.class === 'SensorVoltagem') {
        let isOn = $(`#rele_${dados.id}`);
        if (!isOn.prop('checked')) {
            $(`#tensao_${dados.id}`).text('0');
            //ws.send(JSON.stringify({ id: dados.id, value: 0 }));
            dados.tensao = 0;
            ws.send(JSON.stringify({ dados: dados }));
        } else {
            // Atualizar os campos correspondentes no HTML com os dados recebidos do backend
            $(`#tensao_${dados.id}`).text(dados.tensao || '');
            //ws.send(JSON.stringify({ id: dados.id, value: dados.tensao }));
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

        ws.send(JSON.stringify(message))
    });
});


function createDeviceHTML(deviceNumber) {
    // Cria o elemento principal
    const deviceDiv = document.createElement('div');
    deviceDiv.id = 'dispositivo' + deviceNumber;

    // Cria o container do checkbox
    const checkboxContainer = document.createElement('div');
    checkboxContainer.className = 'checkbox-container';

    // Cria o input do checkbox
    const checkboxInput = document.createElement('input');
    checkboxInput.type = 'checkbox';
    checkboxInput.id = 'rele_' + deviceNumber;

    // Cria o label do checkbox
    const checkboxLabel = document.createElement('label');
    checkboxLabel.className = 'checkbox-slider';
    checkboxLabel.htmlFor = 'rele_' + deviceNumber;

    // Adiciona o input e o label ao container do checkbox
    checkboxContainer.appendChild(checkboxInput);
    checkboxContainer.appendChild(checkboxLabel);

    // Cria o título do dispositivo
    const deviceTitle = document.createElement('h3');
    deviceTitle.textContent = 'Dispositivo ' + deviceNumber;

    // Cria o parágrafo da corrente
    const currentP = document.createElement('p');
    currentP.textContent = 'Corrente: ';
    const currentSpan = document.createElement('span');
    currentSpan.id = 'corrente_' + deviceNumber;
    currentP.appendChild(currentSpan);

    // Cria o parágrafo da tensão
    const voltageP = document.createElement('p');
    voltageP.textContent = 'Tensão: ';
    const voltageSpan = document.createElement('span');
    voltageSpan.id = 'tensao_' + deviceNumber;
    voltageP.appendChild(voltageSpan);

    // Adiciona todos os elementos ao elemento principal
    deviceDiv.appendChild(checkboxContainer);
    deviceDiv.appendChild(deviceTitle);
    deviceDiv.appendChild(currentP);
    deviceDiv.appendChild(voltageP);

    // Retorna o elemento principal
    return deviceDiv;
}