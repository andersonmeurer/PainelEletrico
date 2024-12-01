//TM1637Display
//precisa iniciar no codigo do arduino para apresentar os valores no display, ainda não foi resolvido isso
const five = require("johnny-five");
const WebSocket = require('ws');


let SEGMENTS = [
  0x3f, // 0
  0x06, // 1
  0x5b, // 2
  0x4f, // 3
  0x66, // 4
  0x6d, // 5
  0x7d, // 6
  0x07, // 7
  0x7f, // 8
  0x6f, // 9
];

module.exports = class Display {
  constructor(id, board, wss, clkPin, dioPin) {
    const self = this; // Store a reference to this
    this.clk = 0;
    this.dio = 0;
    this.id = id;
    this.board = board;
    this.wss = wss;
    this.clkPin = clkPin;//amarelo
    this.dioPin = dioPin;//verde
    this.brightness = 7;
    console.log(`Display{id: ${id} dioPin: ${dioPin} clkPin: ${clkPin}}`);

    // Assuming wss is your WebSocket server
    wss.on('connection', function connection(ws) {
      ws.on('message', function incoming(message) {
        // Parse the incoming message as JSON
        let dados = JSON.parse(message);

        // Check if the dados is intended for this display
        if (dados.dados?.class && dados.dados?.class === 'SensorVoltagem') {

          if (dados.dados?.id === id) {
            self.printNumber(dados.dados?.tensao);
          }
        }
      });
    });

    board.on("ready",
      function inicia() {
        self.clk = new five.Pin(clkPin); // Replace with your CLK pin number
        self.dio = new five.Pin(dioPin); // Replace with your DIO pin number
        //----------------------------------------------------
        // Write some data to the display
        self.sendCommand(0x40); // Set auto increment mode
        self.start();
        self.writeByte(0xc0); // Set starting address to 0
        for (let i = 0; i < 4; i++) {
          self.writeByte(0xff); // Write all segments on
        }
        self.stop();

        wss.onmessage = function (event) {
          console.log('Mensagem recebida do servidor:', event.data);
        }
      }
    );
  }
  printNumber(number) {
    number = number.toString().replace(/\./g, '');
    // Convert number to bytes
    const bytes = Array.from(number.toString().padStart(4, '0')).map(digit => SEGMENTS[digit]);
    // Write bytes to the display
    this.sendCommand(0x40); // Set auto increment mode
    this.sendCommandBrightness(0x88, 7);
    this.start();
    this.writeByte(0xc0); // Set starting address to 0
    for (let i = 0; i < bytes.length; i++) {
      this.writeByte(bytes[i]);
    }
    this.stop();
  }

  // Define a function to send a command to the display
  sendCommand(command) {
    this.start();
    this.writeByte(command);
    this.stop();
  }

  // Define a function to send a command to the display
  sendCommandBrightness(command, brightness) {
    this.start();
    this.writeByte(command + (brightness & 0x07));
    this.stop();
  }

  /*function delay(callback, duration) {
    setTimeout(callback, duration);
  }*/

  // Define a simple function to write a byte to the display
  writeByte(byte) {
    if (this.isPinoInstanciado()) {
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
      
      // Wait for the display to acknowledge the data
      this.clk.low();
      this.dio.high();
      this.clk.high();
      this.clk.low();
    }
  }


  // Define functions for start and stop conditions
  start() {
    if (this.isPinoInstanciado()) {
      this.dio.low();
      this.clk.high();
    }
  }

  stop() {
    if (this.isPinoInstanciado()) {
      this.dio.low();
      this.clk.high();
      this.dio.high();
    }
  }

  isPinoInstanciado() {
    return (this.dio && this.clk);
  }
}

/*
#include <Arduino.h>
#include <TM1637Display.h>

TM1637Display display1(2, 3);
TM1637Display display2(4, 5);

void setup(){}

void loop(){
  display1.setBrightness(0x0f);
  display2.setBrightness(0x0f);

  display1.clear();
  display2.clear();
  display1.showNumberDec(1, false);
  display2.showNumberDec(2, false);
  delay(10000);
}
*/