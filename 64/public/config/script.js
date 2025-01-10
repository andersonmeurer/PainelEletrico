const CLASS_NAME = 'script.js->config.js';
const modules = [];
const usedPins = new Set();
const analogPins = { 69: 'A15', 68: 'A14', 67: 'A13', 66: 'A12', 65: 'A11', 64: 'A10', 63: 'A9', 62: 'A8', 61: 'A7', 60: 'A6', 59: 'A5', 58: 'A4', 57: 'A3', 56: 'A2', 55: 'A1', 54: 'A0' };
const SENSOR_VOLTAGEM = 'SensorVoltagem';
const SENSOR_CORRENTE = 'SensorCorrente';
const RELE = 'Rele';
const DISPLAY = 'Display';
const DISPLAY_DIO = 'Display_DIO';
const DISPLAY_CLK = 'Display_CLK';
const CAMERA = 'Camera';


const deviceLabels = {
  SensorCorrente: SENSOR_CORRENTE,
  SensorVoltagem: SENSOR_VOLTAGEM,
  Rele: RELE,
  Display: DISPLAY
};

function addModule() {
  logWithTimestamp(`${CLASS_NAME}::addModule()`);
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
  logWithTimestamp(`${CLASS_NAME}::updateModuleList()`);
  const moduleList = document.getElementById('moduleList');
  moduleList.innerHTML = '';

  logWithTimestamp(`${CLASS_NAME}::updateModuleList():`+JSON.stringify(modules));
  modules.forEach((module, index) => {
    const moduleDiv = document.createElement('div');
    moduleDiv.className = 'module-item';

    if (module.name === CAMERA) {
      const cameraIP = module.devices.find(device => device.type === 'camera_ip').pin;
      const cameraPort = module.devices.find(device => device.type === 'camera_port').pin;

      moduleDiv.innerHTML = `
        <h2>${module.name}</h2>
        <div class="devices">
          <label for="cameraIP-${module.name}">IP da Câmera:</label>
          <input type="text" id="cameraIP-${module.name}" value="${cameraIP}">
        </div>
        <div class="devices">
          <label for="cameraPort-${module.name}">Porta da Câmera:</label>
          <input type="text" id="cameraPort-${module.name}" value="${cameraPort}">
        </div>
      `;
    } else {
      moduleDiv.innerHTML = `
        <h2>${module.name}</h2>
        <div class="devices">
          <label for="deviceType-${module.name}">Tipo de Dispositivo:</label>
          <select id="deviceType-${module.name}">
            <option value="${DISPLAY}">${DISPLAY}</option>
            <option value="${RELE}">${RELE}</option>
            <option value="SensorCorrente">${SENSOR_CORRENTE}</option>
            <option value="SensorVoltagem">${SENSOR_VOLTAGEM}</option>
          </select>
          <button type="button" onclick="addDevice('${module.name}')">Adicionar Dispositivo</button>
        </div>
        <div id="${module.name}-devices">
          ${module.devices.map(device => createDeviceElement(module.name, device)).join('')}
        </div>
        <div class="button-group">
          <button onclick="moveModuleUp(${index})">Mover para Cima</button>
          <button onclick="moveModuleDown(${index})">Mover para Baixo</button>
          <button onclick="removeModule(${index})">Remover Módulo</button>
        </div>
      `;
    }
    moduleList.appendChild(moduleDiv);
  });
}

function createDeviceElement(moduleName, device) {
  
  const DEVICE_TYPE = device.type.toLowerCase();
  logWithTimestamp(`${CLASS_NAME}::createDeviceElement()>>>>>>>>>>>>>`+DEVICE_TYPE+'--'+JSON.stringify(device));

  switch (DEVICE_TYPE) {
    case DISPLAY_CLK.toLowerCase():
    case DISPLAY_DIO.toLowerCase():
      return `
        <div class="devices">
          <label for="${moduleName}-${DEVICE_TYPE}-clk">${device.label} CLKK:</label>
          <input type="number" id="${moduleName}-${DEVICE_TYPE}-clk" value="${device.pin}" onchange="updateDevice('${moduleName}', '${DEVICE_TYPE}', 'clk', this.value)">
          <label for="${moduleName}-${DEVICE_TYPE}-dio">${device.label} DIO:</label>
          <input type="number" id="${moduleName}-${DEVICE_TYPE}-dio" value="${device.dio}" onchange="updateDevice('${moduleName}', '${DEVICE_TYPE}', 'dio', this.value)">
          <button onclick="removeDevice('${moduleName}', '${DEVICE_TYPE}')">Remover</button>
        </div>
      `;
      break;
    case RELE.toLowerCase():
      return `
        <div class="devices">
          <label for="${moduleName}-${DEVICE_TYPE}-pin">${device.label} PIN:</label>
          <input type="number" id="${moduleName}-${DEVICE_TYPE}-pin" value="${device.pin}" onchange="updateDevice('${moduleName}', '${DEVICE_TYPE}', 'pin', this.value)">
          <button onclick="removeDevice('${moduleName}', '${DEVICE_TYPE}')">Remover</button>
        </div>
      `;
      break;
    default:
      if (DEVICE_TYPE !== '') {
        return;
      }
      return `
        <div class="devices">
          <label for="${moduleName}-${DEVICE_TYPE}">${DEVICE_TYPE}:</label>
          <select id="${moduleName}-${DEVICE_TYPE}-pin" onchange="updateDevice('${moduleName}', '${DEVICE_TYPE}', 'pin', this.value)">
            ${Object.entries(analogPins).map(([key, value]) => {
              return `<option value="${key}" ${device.pin == key ? 'selected' : ''}>${value}</option>`;
            }).join('')}
          </select>
          <button onclick="removeDevice('${moduleName}', '${DEVICE_TYPE}')">Remover</button>
        </div>
      `;
    }
  }

function addDevice(moduleName) {
  logWithTimestamp(`${CLASS_NAME}::addDevice()`);
  const deviceTypeSelect = document.getElementById(`deviceType-${moduleName}`);
  const deviceType = deviceTypeSelect.value;

  const deviceLabel = deviceLabels[deviceType];

  if (!deviceLabel) {
    alert('Tipo de dispositivo inválido.');
    return;
  }

  const module = modules.find(module => module.name === moduleName);
  if (module.devices.some(device => device.type === deviceType)) {
    alert('Este dispositivo já existe no módulo.');
    return;
  }

  if (deviceType === DISPLAY) {
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
  logWithTimestamp(`${CLASS_NAME}::updateDevice()`);
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

function hasDuplicatePins() {
  logWithTimestamp(`${CLASS_NAME}::hasDuplicatePins()`);
  const pinUsage = new Set();
  const moduleElements = document.querySelectorAll('.module-item');

  moduleElements.forEach(moduleElement => {
    const deviceElements = moduleElement.querySelectorAll('.device');

    deviceElements.forEach(deviceElement => {
      const pinInputs = deviceElement.querySelectorAll('input[type="text"], input[type="number"]');
      
      pinInputs.forEach(input => {
        const pin = input.value.trim();
        if (pin) {
          console.log(`Verificando pino: ${pin}`);
          if (pinUsage.has(pin)) {
            console.log(`Pino duplicado encontrado: ${pin}`);
            return true;
          }
          pinUsage.add(pin);
        }
      });
    });
  });

  return false;
}

function removeDevice(moduleName, deviceType) {
  logWithTimestamp(`${CLASS_NAME}::removeDevice()`);
  const module = modules.find(module => module.name === moduleName);
  const deviceIndex = module.devices.findIndex(device => device.type === deviceType);
  if (deviceIndex !== -1) {
    const device = module.devices[deviceIndex];
    if (device.type === DISPLAY) {
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
  logWithTimestamp(`${CLASS_NAME}::moveModuleUp()`);
  if (index > 0) {
    [modules[index - 1], modules[index]] = [modules[index], modules[index - 1]];
    updateModuleList();
  }
}

function moveModuleDown(index) {
  logWithTimestamp(`${CLASS_NAME}::moveModuleDown()`);
  if (index < modules.length - 1) {
    [modules[index + 1], modules[index]] = [modules[index], modules[index + 1]];
    updateModuleList();
  }
}

function removeModule(index) {
  logWithTimestamp(`${CLASS_NAME}::removeModule()`);
  const module = modules[index];
  module.devices.forEach(device => {
    if (device.type === DISPLAY) {
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
  logWithTimestamp(`${CLASS_NAME}::saveConfig()`);
  if (hasDuplicatePins()) {
    alert('Existem dispositivos utilizando o mesmo pino. Por favor, verifique as configurações.');
    return;
  }

  const moduleElements = document.querySelectorAll('.module-item');
  const config = Array.from(moduleElements).map(moduleElement => {
    const moduleName = moduleElement.querySelector('h2').textContent.trim();
    if (moduleName === CAMERA) {
      const cameraIP = moduleElement.querySelector('input[id^="cameraIP"]').value.trim();
      const cameraPort = moduleElement.querySelector('input[id^="cameraPort"]').value.trim();
      return `[${moduleName}]\ncamera_ip=${cameraIP}\ncamera_port=${cameraPort}`;
    } else {
      const devices = moduleElement.querySelectorAll('.devices');
      const devicesConfig = Array.from(devices).map(deviceElement => {
        const label = deviceElement.querySelector('label').textContent.trim().toUpperCase().replace(':', '');
        const pin = deviceElement.querySelector('select').value.trim();
        if (label === 'tipo de dispositivo') {
          return ''; // Skip this line
        }
        return `${label}=${pin}`;
      }).join('\n');
      return `[${moduleName}]\n${devicesConfig}`;
    }
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
      console.log('Resposta do servidor recebida:', response);
      if (!response.ok) {
        throw new Error('Arquivo não encontrado');
      }
      return response.json();
    })
    .then(data => {
      const listModules = parseConfig(data);
      console.log('Arquivo lido com sucesso:', JSON.stringify(listModules));
      loadConfig(listModules);
    })
    .catch(error => {
      console.error('Erro ao carregar a configuração:', error);
    });
});

function loadConfig(listModules) {
  logWithTimestamp(`${CLASS_NAME}::loadConfig()`);
  listModules.forEach(module => {
    const currentModule = {
      name: module.name,
      devices: module.devices.map(device => ({
        type: device.type,
        pin: device.pin,
        label: deviceLabels[device.type] || device.type
      }))
    };
    modules.push(currentModule);
  });
  updateModuleList();
}

function parseConfig(config) {
  logWithTimestamp(`${CLASS_NAME}::parseConfig()`);
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

function logWithTimestamp(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${CLASS_NAME}::${message}`);
}