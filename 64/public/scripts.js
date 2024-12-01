document.addEventListener('DOMContentLoaded', () => {
  const modulesContainer = document.getElementById('modules-container');

  fetch('/v2/config/pinos.properties')
    .then(response => response.text())
    .then(config => {
      const modules = parseConfig(config);
      renderModules(modules);
    })
    .catch(error => {
      console.error('Erro ao carregar a configuração:', error);
    });

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
              <input type="checkbox">
              <span class="slider"></span>
            </label>
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
});