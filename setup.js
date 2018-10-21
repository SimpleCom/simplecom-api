#!/usr/bin/env node

const inquirer = require('inquirer');

let allAnswers = {};

let questions = [{
  type: 'password',
  name: 'admin',
  message: "Enter a password for the admin account.",
}, {
  type: 'input',
  name: 'mysqlUser',
  message: "Enter the mysql user name.",
}, {
  type: 'password',
  name: 'mysqlPassword',
  message: "Enter the mysql password.",
}, {
  type: 'input',
  name: 'mysqlHost',
  message: "Enter the mysql host.",
}, {
  type: 'input',
  name: 'mysqlDB',
  message: "Enter the mysql database.",
}, {
  type: 'input',
  name: 'mysqlPort',
  message: "Enter the mysql port.",
  default: 3306
}, {
  type: 'input',
  name: 'sendgridKey',
  message: "Enter a sendgrid key.",
}, {
  type: 'input',
  name: 'AWS AccessKey',
  message: "Enter an AWS Access key.",
}, {
  type: 'input',
  name: 'AWS AccessSecret',
  message: "Enter an AWS Access secret.",
}, {
  type: 'input',
  name: 'AWS AccessSecret',
  message: "Enter an AWS Region.",
}, {
  type: 'input',
  name: 'AWS AccessSecret',
  message: "Enter an AWS S3 Bucket.",
}, {
  type: 'input',
  name: 'AWS AccessSecret',
  message: "Enter an AWS Account ID.",
}, {
  type: 'input',
  name: 'AWS AccessSecret',
  message: "Enter an AWS Access secret.",
}, {
  type: 'input',
  name: 'jwtKey',
  message: "Enter a 40 character JWT key using upper and lower case number, numbers and, symbols or leave it blank and we will generate one for you.",
}];

inquirer.prompt(questions).then((answers) => {
  allAnswers = {...answers};
  console.log(allAnswers);
  if (allAnswers.generate === 'E') {
    questions = [];
    inquirer.prompt(questions).then((answers) => {
      allAnswers = {...allAnswers, ...answers};
    });
  }else{
    allAnswers.jwtKey = generateKey(40);
  }

});

function generateKey(len){
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcedfghijklmnopqrstuvwxyz0123456789#$%^&*@";
  for (var i = 0; i < len; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}