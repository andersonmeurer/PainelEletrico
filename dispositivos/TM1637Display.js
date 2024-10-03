const five = require("johnny-five");
var board = new five.Board({ port: 'COM9' });

const SEGMENTS = [
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

board.on("ready", function() {
  const clk = new five.Pin(2); // Replace with your CLK pin number
  const dio = new five.Pin(3); // Replace with your DIO pin number
  //this.brightness = 0x0f; // Default brightness

  setBrightness(0, false); // Set brightness to maximum and turn on the display

  function setBrightness(brightness, on) {
    /*console.log('setBrightness', brightness, on);
    this.brightness = (brightness & 0x07) | (on ? 0x08 : 0x00);
    
      // Convert number to bytes
    const number = 1;
    const bytes = Array.from(number.toString()).map(digit => SEGMENTS[digit]);
    console.log('log', bytes);*/
  }

  // Define a simple function to write a byte to the display
  function writeByte(byte) {
    for (let i = 0; i < 8; i++) {
      clk.low();
      if (byte & 0x01) {
        dio.high();
      } else {
        dio.low();
      }
      clk.high();
      byte >>= 1;
    }

    // Wait for the display to acknowledge the data
    clk.low();
    dio.high();
    clk.high();
    //const ack = dio.read();
    clk.low();

    //return ack;
  }

  // Define a function to send a command to the display
  function sendCommand(command) {
    start();
    writeByte(command);
    stop();
  }
  // Define a function to send a command to the display
  function sendCommand(command, brightness) {
    start();
    writeByte(command + (brightness & 0x07));
    stop();
  }

  // Define functions for start and stop conditions
  function start() {
    dio.low();
    clk.high();
  }

  function stop() {
    dio.low();
    clk.high();
    dio.high();
  }

  // Initialize the display
  sendCommand(0x8f); // Display on, max brightness

  // Write some data to the display
  sendCommand(0x40); // Set auto increment mode
  start();
  writeByte(0xc0); // Set starting address to 0
  for (let i = 0; i < 4; i++) {
    writeByte(0xff); // Write all segments on
  }
  stop();

  //----------------------------------
  // Convert number to bytes
  const number = 1;
  const bytes = Array.from(number.toString()).map(digit => SEGMENTS[digit]);

  // Write bytes to the display
  sendCommand(0x40); // Set auto increment mode
  start();
  writeByte(0xc0); // Set starting address to 0
  for (let i = 0; i < bytes.length; i++) {
    writeByte(bytes[i]);
  }
  stop();
  //----------------------------------

  sendCommand(0x88, 7);
});