document.addEventListener('DOMContentLoaded', () => {
  // Carregar configurações já salvas
  fetch('/loadConfig')
    .then(response => {
      if (!response.ok) {
        throw new Error('Arquivo não encontrado');
      }
      return response.text();
    })
    .then(config => {
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
        } else if (device.type === 'display_clk') {
          deviceElement.innerHTML = `
            <div id="display-${device.pin}" class="display">
              DISPLAY_CLK: ${device.pin}
            </div>
          `;
        } else if (device.type === 'display_dio') {
          deviceElement.innerHTML = `
            <div id="display-${device.pin}" class="display">
              DISPLAY_DIO: ${device.pin}
            </div>
          `;
        } else if (device.type !== '') {
          deviceElement.innerHTML = `
            <label>${device.type.toUpperCase()}</label>
          `;
        }
        moduleElement.appendChild(deviceElement);
      });
      modulesContainer.appendChild(moduleElement);
    });
  }

  // Configurar WebSocket para receber dados do display
  const ws = new WebSocket('ws://localhost:8080');

  ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    if (data.class === 'SensorVoltagem') {
      const displayElement = document.getElementById(`display-${data.id}`);
      if (displayElement) {
        displayElement.textContent = `Tensão: ${data.tensao}`;
      }
    }
  };

  ws.onerror = function(error) {
    console.error('WebSocket error:', error);
  };
});