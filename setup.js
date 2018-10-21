#!/usr/bin/env node

const inquirer = require('inquirer');

var questions = [{
  type: 'password',
  name: 'admin',
  message: "Enter a password for the admin account.",
}, {
  type: 'list',
  name: 'generate',
  message: "Enter your own JWT key or have us generate one for you?",
  choices: ["Enter it myself", "Go ahead and generate one"],
  filter: function(val) {
    return val[0];
  }
}];

inquirer.prompt(questions).then((answers) => {
  console.log(answers);
});