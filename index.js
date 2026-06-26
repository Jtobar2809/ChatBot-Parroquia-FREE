'use strict';

/**
 * Punto de entrada del chatbot de la parroquia.
 *
 * Arranca en paralelo:
 *   - El servidor Express (necesario para Render/Railway).
 *   - La conexion a WhatsApp via Baileys.
 *
 * Tambien instala manejadores globales de errores para que
 * un fallo no derribe todo el proceso en silencio.
 */

// Silenciar el ruido de descifrado de libsignal antes que nada.
require('./src/utils/silenceNoise').install();

const logger = require('./src/utils/logger');
const { startServer } = require('./src/server');
const { startWhatsApp } = require('./src/services/whatsapp.service');

async function main() {
  logger.banner('CHATBOT PARROQUIA - INICIANDO');

  // Levantar Express primero: si falla esto, no tiene sentido conectar WA.
  startServer();

  // Conectar a WhatsApp.
  try {
    await startWhatsApp();
  } catch (err) {
    logger.error('No se pudo iniciar WhatsApp:', err.message);
    process.exit(1);
  }
}

// Errores no manejados: los reportamos pero no tumbamos el proceso,
// asi la conexion de WhatsApp sigue viva.
process.on('unhandledRejection', (reason) => {
  logger.error('Promesa rechazada sin manejar:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Excepcion no capturada:', err.message);
});

main();
