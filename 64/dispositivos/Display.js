const CLASS_NAME = "Display";

const five = require('johnny-five');

const SEGMENTS = {
  '0': 0x3F,
  '1': 0x06,
  '2': 0x5B,
  '3': 0x4F,
  '4': 0x66,
  '5': 0x6D,
  '6': 0x7D,
  '7': 0x07,
  '8': 0x7F,
  '9': 0x6F
};

class Display {
  constructor(moduleName, board, clkPin, dioPin) {
    this.moduleName = moduleName;
    this.board = board;
    this.clkPin = clkPin;
    this.dioPin = dioPin;
    this.brightness = 7;

    this.clk = new five.Pin(clkPin);
    this.dio = new five.Pin(dioPin);

    console.log(`${CLASS_NAME}::{module:${moduleName}, dioPin:${dioPin}, clkPin:${clkPin}}`);

    board.on("ready", () => {
      this.initializeDisplay();
    });
  }

  initializeDisplay() {
    this.sendCommand(0x40); // Set auto increment mode
    this.start();
    this.writeByte(0xc0); // Set starting address to 0
    for (let i = 0; i < 4; i++) {
      this.writeByte(0xff); // Write all segments on
    }
    this.stop();
    this.printNumber(1000); // Inicializa o display com o número 1000
  }

  printNumber(number) {
    console.log(`${CLASS_NAME}::{moduleName:${this.moduleName}}::printNumber(${number})`);
    number = number.toString().replace(/\./g, '');
    const bytes = Array.from(number.toString().padStart(4, '0')).map(digit => SEGMENTS[digit]);
    this.sendCommand(0x40); // Set auto increment mode
    this.sendCommandBrightness(0x88, this.brightness);
    this.start();
    this.writeByte(0xc0); // Set starting address to 0
    for (let i = 0; i < bytes.length; i++) {
      this.writeByte(bytes[i]);
    }
    this.stop();
  }

  sendCommand(command) {
    this.start();
    this.writeByte(command);
    this.stop();
  }

  sendCommandBrightness(command, brightness) {
    this.start();
    this.writeByte(command + (brightness & 0x07));
    this.stop();
  }

  writeByte(byte) {
    for (let i = 0; i < 8; i++) {
      this.clk.low();
      if (byte & 0x01) {
        this.dio.high();
      } else {
        this.dio.low();
      }
      this.clk.high();
      byte >>= 1;
    }
    this.clk.low();
    this.dio.high();
    this.clk.high();
    this.clk.low();
  }

  start() {
    this.dio.low();
    this.clk.high();
  }

  stop() {
    this.dio.low();
    this.clk.high();
    this.dio.high();
  }
}

module.exports = Display;