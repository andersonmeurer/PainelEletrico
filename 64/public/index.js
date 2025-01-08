document.addEventListener('DOMContentLoaded', (event) => {
  console.log('DOM completamente carregado e analisado');

  // Carregar configurações já salvas
  fetch('/loadConfig')
    .then(response => {
      console.log('Resposta do servidor recebida:', response);
      if (!response.ok) {
        throw new Error('Arquivo não encontrado');
      }
      return response.text();
    })
    .then(config => {
      console.log('Configurações carregadas:', config);
      const modules = parseConfig(config);
      renderModules(modules);
    })
    .catch(error => {
      console.error('Erro ao carregar a configuração:', error);
    });

  const modulesContainer = document.getElementById('modules-container');

  function parseConfig(config) {
    const modules = [];
    const lines = config.trim().split('\n');
    let currentModule = null;

    lines.forEach(line => {
      if (line.startsWith('[') && line.endsWith(']')) {
        if (currentModule) {
          modules.push(currentModule);
        }
        currentModule = { name: line.slice(1, -1), devices: [] };
      } else if (currentModule) {
        const [key, value] = line.split('=');
        currentModule.devices.push({ type: key, pin: value });
      }
    });

    if (currentModule) {
      modules.push(currentModule);
    }

    return modules;
  }

  function renderModules(modules) {
    modulesContainer.innerHTML = '';
    modules.forEach(module => {
      const moduleElement = document.createElement('div');
      moduleElement.className = 'module';
      moduleElement.innerHTML = `<h2>${module.name}</h2>`;
      module.devices.forEach(device => {
        const deviceElement = document.createElement('div');
        deviceElement.className = 'device';
        if (device.type === 'rele') {
          deviceElement.innerHTML = `
            <label class="switch">
              <input type="checkbox" data-pin="${device.pin}">
              <span class="slider"></span>
            </label>
          `;
          deviceElement.querySelector('input').addEventListener('change', (event) => {
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
          deviceElement.innerHTML = `
            <div id="display-${device.pin}" class="display">
              DISPLAY_CLK: ${device.pin}, DISPLAY_DIO: ${device.pin}
            </div>
          `;
        } else {
          deviceElement.innerHTML = `
            <label>${device.type.toUpperCase()}</label>
          `;
        }
        moduleElement.appendChild(deviceElement);
      });
      modulesContainer.appendChild(moduleElement);
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