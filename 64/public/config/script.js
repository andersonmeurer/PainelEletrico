const CLASS_NAME = 'script.js->config.js';
const modules = [];
const usedPins = new Set();
const analogPins = { 69: 'A15', 68: 'A14', 67: 'A13', 66: 'A12', 65: 'A11', 64: 'A10', 63: 'A9', 62: 'A8', 61: 'A7', 60: 'A6', 59: 'A5', 58: 'A4', 57: 'A3', 56: 'A2', 55: 'A1', 54: 'A0' };

//--
class Device {
  constructor(type, label) {
    this.type = type;
    this.label = label;
  }
}

class Camera extends Device {
  constructor(ip, port) {
    super('camera', 'Camera');
    this.ip = ip;
    this.port = port;
  }
}

class Display extends Device {
  constructor(dio, clk) {
    super('display', 'Display');
    this.dio = dio;
    this.clk = clk;
  }
}

class Rele extends Device {
  constructor(pin) {
    super('rele', 'Rele');
    this.pin = pin;
  }
}

class SensorCorrente extends Device {
  constructor(pin) {
    super('sensorcorrente', 'Sensor de Corrente');
    this.pin = pin;
  }
}

class SensorVoltagem extends Device {
  constructor(pin) {
    super('sensorvoltagem', 'Sensor de Voltagem');
    this.pin = pin;
  }
}

class Module {
  constructor(name) {
    this.name = name;
    this.devices = [];
  }

  addDevice(device) {
    this.devices.push(device);
  }
}
//--

const SENSOR_VOLTAGEM = new SensorVoltagem();
const SENSOR_CORRENTE = new SensorCorrente();
const RELE = new Rele();
const CAMERA = new Camera();
const DISPLAY = new Display();

const deviceLabels = {
  sensorcorrente: SENSOR_CORRENTE.label,
  sensorvoltagem: SENSOR_VOLTAGEM.label,
  rele: RELE.label,
  display: DISPLAY.label
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

  modules.forEach((module, index) => {
    const moduleDiv = document.createElement('div');
    moduleDiv.className = 'module-item';
    renderModule(module, index, moduleDiv);
    moduleList.appendChild(moduleDiv);
  });
}

function renderModule(module, index, moduleDiv) {
  logWithTimestamp(`${CLASS_NAME}::renderModule()`);
  const moduleHeader = document.createElement('h3');
  moduleHeader.textContent = module.name;
  moduleDiv.appendChild(moduleHeader);

  if (module.name.toLowerCase() != CAMERA.type) {
    const deviceDiv = document.createElement('div');
    deviceDiv.innerHTML += `
      <div class="devices">
        <label for="deviceType-${module.name}">Tipo de Dispositivo:</label>
        <select id="deviceType-${module.name}">
          <option value="${DISPLAY.type}">${DISPLAY.label}</option>
          <option value="${RELE.type}">${RELE.label}</option>
          <option value="${SENSOR_CORRENTE.type}">${SENSOR_CORRENTE.label}</option>
          <option value="${SENSOR_VOLTAGEM.type}">${SENSOR_VOLTAGEM.label}</option>
        </select>
        <button type="button" onclick="addDevice('${module.name}')">Adicionar Dispositivo</button>
      </div>`;
      moduleDiv.appendChild(deviceDiv);
  }
  
  module.devices.forEach(device => {
    const deviceDiv = document.createElement('div');
    deviceDiv.className = 'device-item';
    
    if (device.type === CAMERA.type) {
      deviceDiv.innerHTML = `
      <div class="devices">
      <label for="cameraIP-${CAMERA}">IP da Câmera:</label>
      <input type="text" id="cameraIP-${device.type}" value="${device.ip}">
      </div>
      <div class="devices">
      <label for="cameraPort-${device.type}">Porta da Câmera:</label>
      <input type="text" id="cameraPort-${device.type}" value="${device.port}">
      </div>
      `;
    }
      /*case DISPLAY.type.toLowerCase():
        logWithTimestamp(`${CLASS_NAME}::Error: ${DEVICE_TYPE} DIO: ${device.dio} CLK: ${device.clk}`);
        const DISPLAY_CLK = DISPLAY.label + '_CLK';
        const DISPLAY_DIO = DISPLAY.label + '_DIO';
        deviceDiv.innerHTML = `
          <div class="devices" id="${module.name}-${DEVICE_TYPE}">
            <label for="${module.name}-${DISPLAY_CLK}">${DISPLAY_CLK}:</label>
            <input type="number" id="${module.name}-${DISPLAY_CLK}-pin" value="${device.clk}" onchange="updateDevice('${module.name}', '${DISPLAY.label} CLK', 'pin', this.value)">
            <label for="${module.name}-${DISPLAY}_DIO.type">${DISPLAY.type}_DIO:</label>
            <input type="number" id="${module.name}-${DISPLAY_DIO}-pin" value="${device.dio}" onchange="updateDevice('${module.name}', '${DISPLAY.label} DIO', 'pin', this.value)">
            <button onclick="removeDevice('${module.name}', '${DEVICE_TYPE}')">Remover</button>
          </div>
        `;
        break;
      case RELE.type.toLowerCase():
          deviceDiv.innerHTML = `
            <div class="devices" id="${module.name}-${DEVICE_TYPE}">
              <label for="${module.name}-${DEVICE_TYPE}-pin">${deviceLabels[DEVICE_TYPE]} PIN:</label>
              <input type="number" id="${module.name}-${DEVICE_TYPE}-pin" value="${device.pin}" onchange="updateDevice('${module.name}', '${DEVICE_TYPE}', 'pin', this.value)">
              <button onclick="removeDevice('${module.name}', '${DEVICE_TYPE}')">Remover</button>
            </div>
          `;
          break;
      case SENSOR_CORRENTE.type.toLowerCase():
      case SENSOR_VOLTAGEM.type.toLowerCase():
        deviceDiv.innerHTML = `
          <div class="devices" id="${module.name}-${DEVICE_TYPE}">
            <label for="${module.name}-${DEVICE_TYPE}-pin">${deviceLabels[DEVICE_TYPE]} PIN:</label>
            <select id="${module.name}-${DEVICE_TYPE}-pin" onchange="updateDevice('${module.name}', '${DEVICE_TYPE}', 'pin', this.value)">
              ${Object.entries(analogPins).map(([key, value]) => {
                return `<option value="${key}" ${device.pin == key ? 'selected' : ''}>${value}</option>`;
              }).join('')}
            </select>
            <button onclick="removeDevice('${module.name}', '${DEVICE_TYPE}')">Remover</button>
          </div>
        `;
        break;*/
      /*default:
        logWithTimestamp(`${CLASS_NAME}::Error: ${DEVICE_TYPE}`);
        deviceDiv.innerHTML = `
          <label>${device.label} Type: ${device.type}</label><br>
          <label>${device.label} Pin: ${device.pin}</label>
        `;
        break;*/
//    }

    moduleDiv.appendChild(deviceDiv);
  });

  if (module.name.toLowerCase() === CAMERA.type) { //a camera nao pode adicionar dispositivos. Este modulo é fixo
    return;
  }

  moduleDiv.innerHTML += `
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

/*function renderDevice(module, index, moduleDiv) {
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
}*/

function createDeviceElement(moduleName, device) {
  
  const DEVICE_TYPE = device.type.toLowerCase();
  logWithTimestamp(`${CLASS_NAME}::createDeviceElement()`);

  switch (DEVICE_TYPE) {
    case DISPLAY.type:
      const DISPLAY_CLK = DISPLAY.type + '_CLK';
      const DISPLAY_DIO = DISPLAY.type + '_DIO';
      return `
      <div class="devices" id="${moduleName}-${DEVICE_TYPE}">
        <label for="${moduleName}-${DISPLAY_CLK}">${DISPLAY_CLK}:</label>
        <select id="${moduleName}-${DISPLAY_CLK}-pin" onchange="updateDevice('${moduleName}', '${DISPLAY.label} CLK', 'pin', this.value)">
          ${Object.entries(analogPins).map(([key, value]) => {
            return `<option value="${key}" ${device.pin == key ? 'selected' : ''}>${value}</option>`;
          }).join('')}
        </select>
        <label for="${moduleName}-${DISPLAY_DIO}">${DISPLAY_DIO.label}:</label>
        <select id="${moduleName}-${DISPLAY_DIO}-pin" onchange="updateDevice('${moduleName}', '${DISPLAY.label} DIO', 'pin', this.value)">
          ${Object.entries(analogPins).map(([key, value]) => {
            return `<option value="${key}" ${device.pin == key ? 'selected' : ''}>${value}</option>`;
          }).join('')}
        </select>
        <button onclick="removeDevice('${moduleName}', '${DEVICE_TYPE}')">Remover</button>
      </div>
    `;
      break;
    case RELE.type:
      return `
        <div class="devices" id="${moduleName}-${DEVICE_TYPE}">
          <label for="${moduleName}-${DEVICE_TYPE}-pin">${deviceLabels[DEVICE_TYPE]} PIN:</label>
          <input type="number" id="${moduleName}-${DEVICE_TYPE}-pin" value="${device.pin}" onchange="updateDevice('${moduleName}', '${DEVICE_TYPE}', 'pin', this.value)">
          <button onclick="removeDevice('${moduleName}', '${DEVICE_TYPE}')">Remover</button>
        </div>
      `;
      break;
    case SENSOR_CORRENTE.type:
    case SENSOR_VOLTAGEM.type:
      return `
        <div class="devices" id="${moduleName}-${DEVICE_TYPE}">
          <label for="${moduleName}-${DEVICE_TYPE}">${DEVICE_TYPE}:</label>
          <select id="${moduleName}-${DEVICE_TYPE}-pin" onchange="updateDevice('${moduleName}', '${DEVICE_TYPE}', 'pin', this.value)">
            ${Object.entries(analogPins).map(([key, value]) => {
              return `<option value="${key}" ${device.pin == key ? 'selected' : ''}>${value}</option>`;
            }).join('')}
          </select>
          <button onclick="removeDevice('${moduleName}', '${DEVICE_TYPE}')">Remover</button>
        </div>
      `;
      break;
    default:
      if (DEVICE_TYPE.type !== '') {
        return;
      }
      /*return `
        <div class="devices" id="${moduleName}-${DEVICE_TYPE}">
          <label for="${moduleName}-${DEVICE_TYPE}">${DEVICE_TYPE}:</label>
          <select id="${moduleName}-${DEVICE_TYPE}-pin" onchange="updateDevice('${moduleName}', '${DEVICE_TYPE}', 'pin', this.value)">
            ${Object.entries(analogPins).map(([key, value]) => {
              return `<option value="${key}" ${device.pin == key ? 'selected' : ''}>${value}</option>`;
            }).join('')}
          </select>
          <button onclick="removeDevice('${moduleName}', '${DEVICE_TYPE}')">Remover</button>
        </div>
      `;*/
    }
  }

  function addDevice(moduleName) {
    logWithTimestamp(`${CLASS_NAME}::addDevice()`);
    const module = modules.find(module => module.name === moduleName);
    if (!module) {
      console.error(`Módulo com nome ${moduleName} não encontrado.`);
      return;
    }
  
    const deviceTypeSelect = document.getElementById(`deviceType-${moduleName}`);
    const deviceType = deviceTypeSelect.value;
  
    let newDevice;
    switch (deviceType) {
      case DISPLAY.type:
        newDevice = new Display();
        break;
      case RELE.type:
        newDevice = new Rele();
        break;
      case SENSOR_CORRENTE.type:
        newDevice = new SensorCorrente();
        break;
      case SENSOR_VOLTAGEM.type:
        newDevice = new SensorVoltagem();
        break;
      default:
        console.error(`Tipo de dispositivo desconhecido: ${deviceType}`);
        return;
    }
  
    module.devices.push(newDevice);
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
  const module = modules.find(module => module.name === moduleName); // Certifique-se de que 'modules' é um array
  if (!module) {
    console.error(`Módulo com nome ${moduleName} não encontrado.`);
    return;
  }
  const deviceIndex = module.devices.findIndex(device => device.type === deviceType);
  if (deviceIndex !== -1) {
    const device = module.devices[deviceIndex];
    if (device.type === DISPLAY.type) {
      usedPins.delete(device.clk);
      usedPins.delete(device.dio);
    } else {
      usedPins.delete(device.pin);
    }
    module.devices.splice(deviceIndex, 1);
    updateModuleList(); // Atualizar a lista de módulos
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
  const module = modules[index]; // Acessar o módulo a partir do array 'modules'
  if (!module) {
    console.error(`Módulo no índice ${index} não encontrado.`);
    return;
  }
  module.devices.forEach(device => {
    if (device.type === DISPLAY.type) {
      usedPins.delete(device.clk);
      usedPins.delete(device.dio);
    } else {
      usedPins.delete(device.pin);
    }
  });
  modules.splice(index, 1); // Remover o módulo do array 'modules'
  updateModuleList(); // Atualizar a lista de módulos
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
    if (moduleName === CAMERA.type) {
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
  logWithTimestamp(`${CLASS_NAME}::DOMContentLoaded`);
  fetch('/loadConfig')
    .then(response => {
      console.log('Resposta do servidor recebida:', response);
      if (!response.ok) {
        throw new Error('Arquivo não encontrado');
      }
      return response.json();
    })
    .then(data => {
      console.log('Arquivo lido com sucesso:', JSON.stringify(data));
      loadConfig(JSON.stringify(data));
    })
    .catch(error => {
      console.error('Erro ao carregar a configuração:', error);
    });
});

function loadConfig(data) {
  logWithTimestamp(`${CLASS_NAME}::loadConfig()`);
  const jsonConfig = JSON.parse(data);
  const config = parseConfig(jsonConfig);

  modules.push(...config);
  updateModuleList();
}

function parseConfig(config) {
  logWithTimestamp(`${CLASS_NAME}::parseConfig()`);
  const modules = config.map(module => {
    const devices = Object.keys(module).filter(key => key !== 'name').map(key => {
      const pin = module[key];
      switch (key) {
        case 'camera_ip':
          return new Camera(pin, module.camera_port);
        case 'display_clk':
          return new Display(module.display_dio, pin);
        case 'display_dio':
          return null; // Already handled with display_clk
        case RELE.type:
          return new Rele(pin);
        case SENSOR_CORRENTE.type:
          return new SensorCorrente(pin);
        case SENSOR_VOLTAGEM.type:
          return new SensorVoltagem(pin);
        default:
          return new Device(key, pin);
      }
    }).filter(device => device !== null);
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