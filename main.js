const colored = require('colored.js');
const { once, EventEmitter } = require('events');
const { stdin, stdout, exit } = process;
const { moveCursor, cursorTo, emitKeypressEvents } = require('readline');

const keyboard = new EventEmitter();

emitKeypressEvents(stdin);
stdin.on('keypress', (_, { sequence }) => {
  //console.log({ sequence });
  switch(sequence) {
    case '\x1b[A':
      moveCursor(stdout, -1, 0);
      keyboard.emit('up');
      break;
    case '\x1b[B':
      moveCursor(stdout, -1, 0);
      keyboard.emit('down');
      break;
    case '\r': keyboard.emit('enter'); break;
    case '\x03':
    case '\x04':
      stdin.pause();
  }
});
stdin.setRawMode(true);

async function main() {
  console.log('Choose a selection:\n');
  const ss = [], ss_inv = [];
  const max = 6;
  for(let i = 1; i <= max; ++i) {
    ss[i] = `${i}. Selection ${i}`;
    ss_inv[i] = colored.inverse(ss[i]);
  }
  console.log(ss_inv[1]);
  for(let i = 2; i <= max; ++i)
    console.log(ss[i]);
  moveCursor(stdout, 0, -max);
  let selection = 1;
  keyboard.on('up', () => {
    stdout.write('\r');
    if(selection === 1) return;
    stdout.write(ss[selection]);
    moveCursor(stdout, -100, -1);
    stdout.write(ss_inv[--selection]);
    stdout.write('\r');
  });
  keyboard.on('down', () => {
    stdout.write('\r');
    if(selection === max) return;
    stdout.write(ss[selection]);
    moveCursor(stdout, -100, 1);
    stdout.write(ss_inv[++selection]);
    stdout.write('\r');
  });
  stdin.resume();
  await once(keyboard, 'enter');
  stdin.pause();
  keyboard.removeAllListeners();
  stdout.write('\r');
  moveCursor(stdout, 0, 2*max-selection);
  console.log(`Your selection: ${selection}`);
}

main();
