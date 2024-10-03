const EventEmitter = require('events');
const fs = require('fs');

class DeviceConfigLoader extends EventEmitter {
    constructor(filePath) {
        super();
        this.filePath = filePath;
    }

    loadConfig(callback) {
        fs.readFile(this.filePath, 'utf8', (err, data) => {
            if (err) {
                console.error('An error occurred:', err);
                return;
            }
    
            const lines = data.split('\n');
            const parsedData = {};
            let currentDevice = null;
    
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.endsWith(': {')) {
                    currentDevice = trimmedLine.slice(0, -3);
                    parsedData[currentDevice] = {};
                } else if (trimmedLine.endsWith(',') && trimmedLine !== '},') {
                    const [key, value] = trimmedLine.slice(0, -1).split(': ');
                    if (currentDevice) {
                        parsedData[currentDevice][key] = Number(value);
                    }
                }
            }
            callback(parsedData);
        });
    }
    saveConfig(dados) {
        /*
        salva as configurações recebidas do cliente em um arquivo pinos.properties
        */
        let dataString = '';
        for (const device in dados) {
            if (device === 'type') continue; // Skip the 'type' field
            dataString += `${device}: {\n`;
            for (const pin in dados[device]) {
                dataString += `    ${pin}: ${dados[device][pin]},\n`;
            }
            dataString += '},\n';
        }

        const fs = require('fs');
        fs.writeFile(this.filePath, dataString, (err) => {
            if (err) {
                console.error('An error occurred:', err);
                //res.status(500).send('An error occurred while writing the file');
            } else {
                console.log('DeviceConfigLoades.js: Configuration saved successfully');
                //res.status(200).send('Configuration saved successfully');
            }
        });
        console.log('DeviceConfigLoades.js: saveConfig - Mensagem recebida do cliente:', dados);
        this.emit('configUpdated');
    }
}

module.exports = DeviceConfigLoader;