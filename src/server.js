'use strict';

/**
 * Servidor Express minimo.
 *
 * Cumple dos funciones:
 *   1. Endpoint /health: ping para servicios como Render/Railway
 *      que necesitan un puerto HTTP abierto para considerar la app "viva".
 *   2. Endpoint /status: estado del bot (conectado o no).
 */

const express = require('express');
const env = require('./config/env');
const logger = require('./utils/logger');
const { getStatus } = require('./services/whatsapp.service');
const { activeSessionsCount } = require('./handlers/sessionManager');

function startServer() {
  const app = express();

  app.get('/', (_req, res) => {
    res.send('Chatbot de la parroquia esta corriendo. 🙏');
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.get('/status', (_req, res) => {
    res.json({
      ...getStatus(),
      activeSessions: activeSessionsCount(),
      env: env.nodeEnv,
    });
  });

  app.listen(env.port, () => {
    logger.success(`Servidor HTTP escuchando en puerto ${env.port}`);
  });

  return app;
}

module.exports = { startServer };
