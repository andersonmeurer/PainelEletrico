document.addEventListener('DOMContentLoaded', (event) => {
  console.log('DOM completamente carregado e analisado');

  // Carregar configurações já salvas
  fetch('/loadConfig')
    .then(response => {
      console.log('Resposta do servidor recebida:', response);
      if (!response.ok) {
        throw new Error('Arquivo não encontrado');
      }
      return response.json();
    })
    .then(data => {
      try {
        const modules = parseConfig(data);
        console.log('Arquivo lido com sucesso:', JSON.stringify(modules));
        renderModules(modules);

        // Set the camera IP and port
        const cameraModule = modules.find(module => module.name === 'Camera');
        if (cameraModule) {
          const cameraIP = cameraModule.devices.find(device => device.type === 'camera_ip').pin;
          const cameraPort = cameraModule.devices.find(device => device.type === 'camera_port').pin;
          const videoElement = document.getElementById('videoElement');
          videoElement.src = `http://${cameraIP}:${cameraPort}/`;
        }
      } catch (parseError) {
        console.error('Erro ao analisar o arquivo de configuração:', parseError);
        res.status(500).send('Erro ao analisar o arquivo de configuração');
      }
    });

  const modulesContainer = document.getElementById('modules-container');

  function parseConfig(config) {
    const modules = config.map(module => {
      const devices = Object.keys(module).filter(key => key !== 'name').map(key => ({
        type: key,
        pin: module[key]
      }));
      return {
        name: module.name,
        devices: devices
      };
    });
    return modules;
  }

  function renderModules(modules) {
    modulesContainer.innerHTML = '';

    modules.forEach(module => {
      if (module.name === 'Camera') {
        return;
      }

      const moduleDiv = document.createElement('div');
      moduleDiv.className = 'module';
      moduleDiv.innerHTML = `<h2>${module.name}</h2>`;

      if (module.devices && Array.isArray(module.devices)) {
        module.devices.forEach(device => {

          const deviceDiv = document.createElement('div');
          deviceDiv.className = 'device';
          if (device.type === 'rele') {
            deviceDiv.innerHTML = `
              <label class="switch">
                <input type="checkbox" data-pin="${device.pin}">
                <span class="slider"></span>
              </label>
            `;
            deviceDiv
              .querySelector('input')
              .addEventListener('change', (event) => {
                const pin = event.target.getAttribute('data-pin');
                const state = event.target.checked ? 'on' : 'off';
                fetch('/togglePin', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ pin, state })
                }).catch(error => console.error('Erro ao enviar comando para o Arduino:', error));
              });
          } else if (device.type.includes('display')) {
            //nao apresentar os pinos do display
          } else {
            deviceDiv.innerHTML = `
              <label>${device.type.toUpperCase()}</label>
            `;
          }

          moduleDiv.appendChild(deviceDiv);
        });
      } else {
        console.warn(`Module ${module.name} does not have a devices array.`);
      }
      modulesContainer.appendChild(moduleDiv);
    });
  }

  const ws = new WebSocket("ws://localhost:3000");

  ws.onopen = () => {
    console.log('Conectado ao servidor WebSocket');
  };

  ws.onerror = (error) => {
    console.error('Erro no WebSocket:', error);
  };

  ws.onclose = () => {
    console.log('Conexão com o servidor WebSocket fechada');
  };

  ws.onmessage = (event) => {
    console.log('Mensagem recebida do servidor:', event.data);
    const data = JSON.parse(event.data);
    if (data.class === undefined) { return; }
    const messagesContainer = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.textContent = `Classe: ${data.class}, Valor:${data.value}`;
    messagesContainer.prepend(messageElement); // Adiciona a nova mensagem no topo
  };
});