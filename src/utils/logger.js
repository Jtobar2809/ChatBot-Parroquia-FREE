'use strict';

/**
 * Logger sencillo con colores para la consola.
 * Usamos chalk para pintar los niveles y timestamps.
 */

const chalk = require('chalk');

const timestamp = () => {
  const now = new Date();
  return chalk.gray(`[${now.toLocaleString('es-CO')}]`);
};

const logger = {
  info: (msg, ...args) => {
    console.log(`${timestamp()} ${chalk.cyan('[INFO]')} ${msg}`, ...args);
  },
  success: (msg, ...args) => {
    console.log(`${timestamp()} ${chalk.green('[OK]  ')} ${msg}`, ...args);
  },
  warn: (msg, ...args) => {
    console.log(`${timestamp()} ${chalk.yellow('[WARN]')} ${msg}`, ...args);
  },
  error: (msg, ...args) => {
    console.log(`${timestamp()} ${chalk.red('[ERR] ')} ${msg}`, ...args);
  },
  bot: (msg, ...args) => {
    console.log(`${timestamp()} ${chalk.magenta('[BOT] ')} ${msg}`, ...args);
  },
  banner: (msg) => {
    const line = chalk.cyan('='.repeat(60));
    console.log(`\n${line}\n${chalk.bold.cyan('  ' + msg)}\n${line}\n`);
  },
};

module.exports = logger;
