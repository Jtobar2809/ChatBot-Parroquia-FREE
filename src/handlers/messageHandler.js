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

const RESET_KEYWORDS = ['menu', 'inicio', 'cancelar', 'salir'];
const RESET_PHRASE = 'Hasta pronto bendiciones';

const flows = {
  misa: misaFlow,
  documentos: documentosFlow,
  otros: otrosFlow,
};

function normalizeText(text) {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isResetPhrase(text) {
  const normalizedInput = normalizeText(text);
  const normalizedPhrase = normalizeText(RESET_PHRASE);

  return normalizedInput === normalizedPhrase;
}

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

  const session = sessionManager.getSession(jid);
  const normalizedText = normalizeText(cleanText);

  // Solo reinicia dentro de un flujo activo.
  if (session.flow && (
    RESET_KEYWORDS.includes(normalizedText) ||
    isResetPhrase(cleanText)
  )) {
    sessionManager.resetSession(jid);
    return menuFlow.getMenuText();
  }

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
