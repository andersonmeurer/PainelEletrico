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

const DISPLAY_CLK = DISPLAY.type + '_clk';
const DISPLAY_DIO = DISPLAY.type + '_dio';

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
  const moduleHeader = document.createElement('h2');
  moduleHeader.textContent = module.name;
  moduleDiv.appendChild(moduleHeader);
  
  const deviceDiv = document.createElement('div');
  if (module.name.toLowerCase() === CAMERA.type) {
    if (module.devices.length > 0) {
      const device = module.devices[0];
      deviceDiv.innerHTML = `
        <div class="devices">
        <label for="${CAMERA.type}_ip">IP da Câmera:</label>
        <input type="text" id="${CAMERA.type}_ip" value="${device.ip === undefined ? '0.0.0.0' : device.ip}">
        </div>
        <div class="devices">
        <label for="${CAMERA.type}_port">Porta da Câmera:</label>
        <input type="text" id="${CAMERA.type}_port" value="${device.port===undefined?'0':device.port}">
        </div>
        `;
    }
  } else {
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
    }
    moduleDiv.appendChild(deviceDiv);

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

function createDeviceElement(moduleName, device) {
  logWithTimestamp(`${CLASS_NAME}::createDeviceElement()`);
  
  const DEVICE_TYPE = device.type.toLowerCase();
  
  switch (DEVICE_TYPE) {
    case DISPLAY.type:
      return `
      <div class="devices" id="${moduleName}-${DEVICE_TYPE}">
        <label for="${moduleName}-${DISPLAY_CLK}">${DISPLAY.label} CLK:</label>
        <input type="number" id="${moduleName}-${DISPLAY_CLK}-pin" value="${device.clk}" onchange="updateDevice('${moduleName}', '${DISPLAY_CLK}', 'pin', this.value)"></input>
        <label for="${moduleName}-${DISPLAY_DIO}">${DISPLAY.label} DIO:</label>
        <input type="number" id="${moduleName}-${DISPLAY_DIO}-pin" value="${device.dio}" onchange="updateDevice('${moduleName}', '${DISPLAY_DIO}', 'pin', this.value)"/>
        <button onclick="removeDevice('${moduleName}', '${DEVICE_TYPE}')">Remover</button>
      </div>
    `;
      break;
    case RELE.type:
      return `
        <div class="devices" id="${moduleName}-${DEVICE_TYPE}">
          <label for="${moduleName}-${DEVICE_TYPE}-pin">${device.label} PIN:</label>
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
  const device = document.getElementById(`${moduleName}-${deviceType}-${pinType}`);
  if (!device) {
    console.error(`Device ID: '${moduleName}-${deviceType}-${pinType}' não encontrado.`);
    return;
  }

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
  let hasDuplicate = false;

  moduleElements.forEach(moduleElement => {
    if (hasDuplicate) return; // Interrompe o loop se um pino duplicado for encontrado
    const deviceElements = moduleElement.querySelectorAll('.devices');

    deviceElements.forEach(deviceElement => {
      if (hasDuplicate) return; // Interrompe o loop se um pino duplicado for encontrado
      const pinInputs = deviceElement.querySelectorAll('input[type="text"], input[type="number"]');
      
      pinInputs.forEach(input => {
        if (hasDuplicate) return; // Interrompe o loop se um pino duplicado for encontrado
        const pin = input.value.trim();
        if (pin) {
          console.log(`Verificando pino: ${pin}`);
          if (pinUsage.has(pin)) {
            console.log(`Pino duplicado encontrado: ${pin}`);
            alert(`Pino duplicado encontrado: ${pin}`);
            hasDuplicate = true;
            return;
          }
          pinUsage.add(pin);
        }
      });
    });
  });

  return hasDuplicate;
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

  const config = modules.map(module => {
    if (module.name.toLowerCase() === CAMERA.type) {
      return `[${module.name}]\ncamera_ip=${document.getElementById(`${CAMERA.type}_ip`).value}\ncamera_port=${document.getElementById(`${CAMERA.type}_port`).value}`;
    } else {
      const devicesConfig = module.devices.map(device => {
        switch (device.type) {
          case DISPLAY.type:
            return `${DISPLAY.type}_clk=${device.clk}\n${DISPLAY.type}_dio=${device.dio}`;
          case RELE.type:
          case SENSOR_CORRENTE.type:
          case SENSOR_VOLTAGEM.type:
            return `${device.type}=${device.pin}`;
          default:
            return `${device.type}=${device.pin}`;
        }
      }).join('\n');
      return `[${module.name}]\n${devicesConfig}`;
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
        case DISPLAY_CLK:
          return new Display(module.display_dio, pin);
        case DISPLAY_DIO:
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