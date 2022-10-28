const user_choice = require('./user-choice');

user_choice([1, 2, 3, 4, 5], { lettered: true, parentheses: true, dot: true }).then(console.log).catch(console.error);
