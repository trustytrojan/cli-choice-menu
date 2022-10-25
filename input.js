// Author: github.com/trustytrojan

const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

/**
 * Mimicking Python's input().
 * @param {string} query string to print before user input
 * @returns {Promise<string>} resolves when user hits enter
 */
module.exports = function(query) {
  return new Promise(resolve => rl.question(query ?? '', (answer) => resolve(answer)));
}
