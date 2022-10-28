const colored = require('colored.js');
const { once, EventEmitter } = require('events');
const { stdin, stdout, exit } = process;
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
        exit();
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

const ascii_a = 'a'.charCodeAt(0);

// honestly fuck typescript we don't need it

class ChoicePrefixOptions {
  /**
   * Choices will be ordered starting from `1`. Mutually exclusive with `lettered`.
   * @type {boolean}
   */
  numbered;

  /**
   * Choices will be ordered starting from `a`. Mutually exclusive with `numbered`.
   * @type {boolean}
   */
  lettered;

  /**
   * Choice prefixes will be surrounded with parentheses. Mutually exclusive with `dot`.
   * 
   * For example: `(a)` or `(1)`
   * @type {boolean}
   */
  parentheses;

  /**
   * Choice prefixes will be appended with a dot. Mutually exclusive with `parentheses`.
   * 
   * For example: `a.` or `1.`
   * @type {boolean}
   */
  dot;
}

/**
 * Display values to a user for them to choose and return their choice.
 * @param {any[]} choices array of choices the user can choose from
 * @param {ChoicePrefixOptions} choice_prefix_options choice prefixing options; if `undefined` choices are not prefixed
 * @returns {Promise<any>} user-chosen value
 */
async function user_choice(choices, choice_prefix_options) {

  let numbered, lettered;
  if(choice_prefix_options) {
    ({ numbered, lettered, parentheses, dot } = choice_prefix_options);
    if(numbered && lettered)
      throw 'user_choice: Cannot use both numbered and lettered choice prefixes!';
    if(parentheses && dot)
      throw 'user_choice: Cannot use both parentheses and dots after prefixes!';
  }

  // create formatted strings for printing
  const ss = [], ss_inv = [];
  const max = choices.length;
  for(let i = 1; i <= max; ++i) {
    // avoid unnecessary errors
    if(choices[i-1] === undefined)
      throw 'user_choice: One of your choices is `undefined`!';
    
    // create prefix if options were supplied
    let prefix = '';
    if(numbered)
      prefix = (parentheses) ? `(${i}) ` : `${i}. `;
    else if(lettered) {
      const letter = String.fromCharCode(ascii_a+(i-1));
      prefix = (parentheses) ? `(${letter}) ` : `${letter}. `;
    }

    ss[i] = `${prefix}${choices[i-1]}`;
    ss_inv[i] = colored.inverse(ss[i]);
  }

  // write strings to stdout
  stdout.write(ss_inv[1]);
  for(let i = 2; i < max; ++i)
    stdout.write(`\n${ss[i]}`);
  if(max > 1) stdout.write(`\n${ss[max]}`);

  // move cursor up to first selection
  stdout.write('\r\n');
  moveCursor(stdout, 0, -max);
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
  moveCursor(stdout, 0, max-selection+1);
  stdout.write('\r');

  return choices[selection-1];
}

module.exports = user_choice;
