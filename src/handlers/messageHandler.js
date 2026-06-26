'use strict';

/**
 * Orquestador principal de mensajes.
 *
 * Recibe el texto del usuario y su JID, consulta el estado de la sesion
 * y decide que flujo ejecutar. Devuelve siempre el texto que el bot
 * debe enviar de vuelta.
 */

const sessionManager = require('./sessionManager');
const menuFlow = require('../flows/menu.flow');
const misaFlow = require('../flows/misa.flow');
const documentosFlow = require('../flows/documentos.flow');
const infoFlow = require('../flows/info.flow');
const otrosFlow = require('../flows/otros.flow');
const logger = require('../utils/logger');

const RESET_KEYWORDS = ['menu', 'menú', 'inicio', 'cancelar', 'salir'];

const flows = {
  misa: misaFlow,
  documentos: documentosFlow,
  otros: otrosFlow,
};

/**
 * Procesa un mensaje entrante.
 * @param {string} jid  JID de WhatsApp (ej: 5731234567@s.whatsapp.net)
 * @param {string} text Texto recibido
 * @returns {Promise<string>} Texto a responder
 */
async function processMessage(jid, text) {
  const cleanText = (text || '').trim();

  if (!cleanText) {
    return 'No recibí tu mensaje. Por favor, escribe de nuevo.';
  }

  // Palabras clave para reiniciar la conversacion en cualquier momento.
  if (RESET_KEYWORDS.includes(cleanText.toLowerCase())) {
    sessionManager.resetSession(jid);
    return menuFlow.getMenuText();
  }

  const session = sessionManager.getSession(jid);

  // Si no hay flujo activo: mostrar menu o procesar la opcion elegida.
  if (!session.flow) {
    const chosen = menuFlow.parseMenuOption(cleanText);

    // Primer contacto: el usuario aun no eligio. Mostramos el menu.
    if (!chosen) {
      // Si la sesion es nueva (sin datos) mostramos saludo + menu.
      // Si ya intento elegir, mostramos mensaje de opcion invalida.
      const isFirstMessage = !session.data.shown;
      session.data.shown = true;
      sessionManager.updateSession(jid, { data: session.data });

      return isFirstMessage ? menuFlow.getMenuText() : menuFlow.INVALID_TEXT;
    }

    // Flujo informativo: no guarda estado, solo muestra la información.
    // El usuario puede elegir otra opción enseguida o escribir "menú".
    if (chosen === 'info') {
      return infoFlow.getInfoText();
    }

    // El usuario eligio una opcion valida -> iniciar el flujo correspondiente.
    const flow = flows[chosen];
    const { step, reply } = flow.start();
    sessionManager.updateSession(jid, {
      flow: chosen,
      step,
      data: {},
    });
    return reply;
  }

  // Hay un flujo activo: delegar al flujo correspondiente.
  const flow = flows[session.flow];
  if (!flow) {
    logger.warn(`Flujo desconocido en sesion ${jid}: ${session.flow}`);
    sessionManager.resetSession(jid);
    return menuFlow.getMenuText();
  }

  try {
    const { reply, done } = await flow.handle(session, cleanText);

    if (done) {
      sessionManager.resetSession(jid);
    } else {
      sessionManager.updateSession(jid, {
        step: session.step,
        data: session.data,
      });
    }

    return reply;
  } catch (err) {
    logger.error(`Error procesando flujo ${session.flow}:`, err.message);
    sessionManager.resetSession(jid);
    return 'Ocurrió un error inesperado. Escribe *menú* para empezar de nuevo.';
  }
}

module.exports = { processMessage };
