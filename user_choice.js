const colored = require('colored.js');
const { once, EventEmitter } = require('events');
const { stdin, stdout } = process;
const { moveCursor, emitKeypressEvents } = require('readline');

/**
 * make life easier with a event emitter
 * @param {EventEmitter} keyboard 
 */
function initialize_input(keyboard) {
  emitKeypressEvents(stdin);
  stdin.on('keypress', (_, { sequence }) => {
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
        moveCursor(stdout, 0, 100);
        stdout.write('\r\n');
        process.exit();
    }
  });
  stdin.setRawMode(true);
}

function uninitialize_input() {
  stdin.removeAllListeners('keypress');
  stdin.setRawMode(false);
}

/**
 * start receiving keypresses, wait until user presses enter/return key
 * @param {EventEmitter} keyboard 
 */
async function safely_wait_for_enter(keyboard) {
  stdin.resume();
  await once(keyboard, 'enter');
  stdin.pause();
}

/**
 * Display values to a user for them to choose and return their choice.
 * @param {any[]} choices array of choices the user can choose from
 * @returns {Promise<any>} user-chosen value
 */
async function user_choice(choices) {
  // create formatted strings for printing
  const ss = [], ss_inv = [];
  const max = choices.length;
  for(let i = 1; i <= max; ++i) {
    ss[i] = `${i}. ${choices[i-1]}`;
    ss_inv[i] = colored.inverse(ss[i]);
  }

  // write strings to stdout
  stdout.write(ss_inv[1]);
  for(let i = 2; i < max; ++i)
    stdout.write(`\n${ss[i]}`);
  if(max > 1) stdout.write(`\n${ss[max]}`);

  // move cursor up to first selection
  stdout.write('\r');
  moveCursor(stdout, 0, -max+1);
  let selection = 1;

  /* receive user input */ {
    const keyboard = new EventEmitter();
    initialize_input(keyboard);
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
    await safely_wait_for_enter(keyboard);
    keyboard.removeAllListeners();
    uninitialize_input();
  }
  
  // move cursor below choices
  moveCursor(stdout, 0, max-selection);
  stdout.write('\r\n');

  return choices[selection-1];
}

module.exports = user_choice;
