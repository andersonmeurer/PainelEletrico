const modules = [];
const usedPins = new Set();
const analogPins = { 82: 'A15', 83: 'A14', 84: 'A13', 85: 'A12', 86: 'A11', 87: 'A10', 88: 'A9', 89: 'A8', 90: 'A7', 91: 'A6', 92: 'A5', 93: 'A4', 94: 'A3', 95: 'A2', 96: 'A1', 97: 'A0' };

function addModule() {
  const moduleName = document.getElementById('moduleName').value;
  if (!moduleName) {
    alert('Por favor, insira um nome para o módulo.');
    return;
  }

  if (modules.some(module => module.name === moduleName)) {
    alert('Este módulo já existe.');
    return;
  }

  modules.push({
    name: moduleName,
    devices: []
  });

  updateModuleList();
}

function updateModuleList() {
  const moduleList = document.getElementById('moduleList');
  moduleList.innerHTML = '';

  modules.forEach((module, index) => {
    const moduleElement = document.createElement('div');
    moduleElement.className = 'module';
    moduleElement.innerHTML = `
      <h2>${module.name}</h2>
      <div class="form-group">
        <label for="deviceType-${module.name}">Tipo de Dispositivo:</label>
        <select id="deviceType-${module.name}">
          <option value="Display">Display</option>
          <option value="Rele">Relê</option>
          <option value="SensorCorrente">Sensor de Corrente</option>
          <option value="SensorVoltagem">Sensor de Voltagem</option>
        </select>
        <button type="button" onclick="addDevice('${module.name}')">Adicionar Dispositivo</button>
      </div>
      <div id="${module.name}-devices">
        ${module.devices.map(device => createDeviceElement(module.name, device)).join('')}
      </div>
      <button onclick="moveModuleUp(${index})">Mover para Cima</button>
      <button onclick="moveModuleDown(${index})">Mover para Baixo</button>
      <button onclick="removeModule(${index})">Remover Módulo</button>
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
        <input type="number" id="${moduleName}-${device.type}-clk" value="${device.clk}" onchange="updateDevice('${moduleName}', '${device.type}', 'clk', this.value)">
        <label for="${moduleName}-${device.type}-dio">${device.label} DIO:</label>
        <input type="number" id="${moduleName}-${device.type}-dio" value="${device.dio}" onchange="updateDevice('${moduleName}', '${device.type}', 'dio', this.value)">
        <button onclick="removeDevice('${moduleName}', '${device.type}')">Remover</button>
      </div>
    `;
  } else if (device.type === 'Rele') {
    return `
    <div class="form-group">
      <label for="${moduleName}-${device.type}-pin">${device.label} PIN:</label>
      <input type="number" id="${moduleName}-${device.type}-pin" value="${device.pin}" onchange="updateDevice('${moduleName}', '${device.type}', 'pin', this.value)">
      <button onclick="removeDevice('${moduleName}', '${device.type}')">Remover</button>
    </div>
  `;
  } else if (device.type !== '') {
    return `
      <div class="form-group">
        <label for="${moduleName}-${device.type}">${deviceLabels[device.type]}:</label>
        <select id="${moduleName}-${device.type}-pin" onchange="updateDevice('${moduleName}', '${device.type}', 'pin', this.value)">
          ${Object.entries(analogPins).map(([key, value]) => {
            return `<option value="${key}" ${device.pin == key ? 'selected' : ''}>${value}</option>`;
          }).join('')}
        </select>
        <button onclick="removeDevice('${moduleName}', '${device.type}')">Remover</button>
      </div>
    `;
  }
}

function addDevice(moduleName) {
  const deviceTypeSelect = document.getElementById(`deviceType-${moduleName}`);
  const deviceType = deviceTypeSelect.value;

  const deviceLabel = {
    Display: 'Display',
    Rele: 'Relê',
    SensorCorrente: 'SensorCorrente',
    SensorVoltagem: 'SensorVoltagem'
  }[deviceType];

  if (!deviceLabel) {
    alert('Tipo de dispositivo inválido.');
    return;
  }

  const module = modules.find(module => module.name === moduleName);
  if (module.devices.some(device => device.type === deviceType)) {
    alert('Este dispositivo já existe no módulo.');
    return;
  }

  if (deviceType === 'Display') {
    module.devices.push({
      type: deviceType,
      label: deviceLabel,
      clk: '',
      dio: ''
    });
  } else {
    module.devices.push({
      type: deviceType,
      label: deviceLabel,
      pin: ''
    });
  }

  updateModuleList();
}

function updateDevice(moduleName, deviceType, pinType, pin) {
  const inputElement = document.getElementById(`${moduleName}-${deviceType}-${pinType}`);
  
  if (!inputElement) {
    console.error(`Elemento com ID ${moduleName}-${deviceType}-${pinType} não encontrado.`);
    return;
  }

  const module = modules.find(module => module.name === moduleName);
  const device = module.devices.find(device => device.type === deviceType);
  if (device[pinType] !== '') {
    usedPins.delete(device[pinType]);
  }

  device[pinType] = pin;
  usedPins.add(pin);
  inputElement.classList.remove('error');
}

function hasDuplicatePins(modules) {
  const pinUsage = new Set();

  for (const module of modules) {
    for (const device of module.devices) {
      console.log(`Verificando dispositivo: ${device.type}, pino: ${device.pin}`);
      if (device.type === 'Display') {
        if (pinUsage.has(device.clk) || pinUsage.has(device.dio) || device.clk === device.dio) {
          console.log(`Pino duplicado encontrado: ${device.clk} ou ${device.dio}`);
          return true;
        }
        pinUsage.add(device.clk);
        pinUsage.add(device.dio);
      } else {
        if (pinUsage.has(device.pin)) {
          console.log(`Pino duplicado encontrado: ${device.pin}`);
          return true;
        }
        pinUsage.add(device.pin);
      }
    }
  }

  return false;
}

function removeDevice(moduleName, deviceType) {
  const module = modules.find(module => module.name === moduleName);
  const deviceIndex = module.devices.findIndex(device => device.type === deviceType);
  if (deviceIndex !== -1) {
    const device = module.devices[deviceIndex];
    if (device.type === 'Display') {
      usedPins.delete(device.clk);
      usedPins.delete(device.dio);
    } else {
      usedPins.delete(device.pin);
    }
    module.devices.splice(deviceIndex, 1);
    updateModuleList();
  }
}

function moveModuleUp(index) {
  if (index > 0) {
    [modules[index - 1], modules[index]] = [modules[index], modules[index - 1]];
    updateModuleList();
  }
}

function moveModuleDown(index) {
  if (index < modules.length - 1) {
    [modules[index + 1], modules[index]] = [modules[index], modules[index + 1]];
    updateModuleList();
  }
}

function removeModule(index) {
  const module = modules[index];
  module.devices.forEach(device => {
    if (device.type === 'Display') {
      usedPins.delete(device.clk);
      usedPins.delete(device.dio);
    } else {
      usedPins.delete(device.pin);
    }
  });
  modules.splice(index, 1);
  updateModuleList();
}

function saveConfig() {
  if (hasDuplicatePins(modules)) {
    alert('Existem dispositivos utilizando o mesmo pino. Por favor, verifique as configurações.');
    return;
  }

    const config = modules.map(module => {
      const devicesConfig = module.devices.map(device => {
        if (device.type === 'Display') {
          return `display_clk=${device.clk}\ndisplay_dio=${device.dio}`;
        } else {
          return `${device.type.toLowerCase()}=${device.pin}`;
        }
      }).join('\n');
      return `[${module.name}]\n${devicesConfig}`;
    }).join('\n\n');
  
    fetch('/saveConfig', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ config })
    })
    .then(response => response.text())
    .then(data => {
      alert(data);
    })
    .catch(error => {
      console.error('Erro ao salvar a configuração:', error);
      alert('Erro ao salvar a configuração');
    });
}

//carregar configuracoes ja salvas
document.addEventListener('DOMContentLoaded', () => {
  fetch('/loadConfig')
    .then(response => {
      if (!response.ok) {
        throw new Error('Arquivo não encontrado');
      }
      return response.text();
    })
    .then(data => {
      loadConfig(data);
    })
    .catch(error => {
      console.error('Erro ao carregar a configuração:', error);
    });
});

function loadConfig(data) {
  const lines = data.split('\n');
  let currentModule = null;

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
        usedPins.add(value); // Adiciona o pino usado ao conjunto
      }
    }
  });

  updateModuleList();
}
