const nodeMajorVersion = parseInt(process.versions.node.split('.')[0], 10);
if (nodeMajorVersion < 12) {
    console.error('Unsupported NodeJS version! Please install NodeJS 12 or newer.');
    process.exit(1);
}

const fs = require('fs');
const path = require('path');
require('dotenv').config();

try {
    fs.accessSync(path.join(__dirname, 'node_modules'));
} catch (e) {
    console.error('Please run "npm i" or run the install.bat before starting the bot!');
    process.exit(1);
}

try {
    fs.accessSync(path.join(__dirname, 'config.json'));
} catch (e) {
    console.error('You need to rename config.example.json to config.json, and fill in the values!');
    process.exit(1);
}

try {
    fs.accessSync(path.join(__dirname, '.env'));
} catch (e) {
    console.error('You need to rename .env.example to .env, and fill in the values!');
    process.exit(1);
}

if(!process.env.token) {
    console.error('You need to specify the bot token in the .env file!');
    process.exit(1);
}

const Discord = require('discord.js');

const config = require('./config.json');

const Client = new Discord.Client();
Client.login(process.env.token).catch(() => {
    console.error('The token you specified is invalid!');
})