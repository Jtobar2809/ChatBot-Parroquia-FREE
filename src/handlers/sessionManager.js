'use strict';

/**
 * Gestor de sesiones conversacionales en memoria.
 *
 * Cada usuario (identificado por su JID de WhatsApp) tiene un estado
 * con el flujo activo y los datos recolectados hasta el momento.
 *
 * Las sesiones expiran tras INACTIVITY_MS de no recibir mensajes,
 * para que un usuario que abandono un flujo vuelva al menu principal.
 */

const INACTIVITY_MS = 10 * 60 * 1000; // 10 minutos

const sessions = new Map();

function getSession(jid) {
  const now = Date.now();
  const existing = sessions.get(jid);

  if (existing && now - existing.updatedAt > INACTIVITY_MS) {
    sessions.delete(jid);
    return createSession(jid);
  }

  if (!existing) {
    return createSession(jid);
  }

  existing.updatedAt = now;
  return existing;
}

function createSession(jid) {
  const session = {
    jid,
    flow: null,   // 'misa' | 'documentos' | 'otros' | null
    step: null,
    data: {},
    updatedAt: Date.now(),
  };
  sessions.set(jid, session);
  return session;
}

function updateSession(jid, patch) {
  const session = getSession(jid);
  Object.assign(session, patch, { updatedAt: Date.now() });
  return session;
}

function resetSession(jid) {
  sessions.delete(jid);
  return createSession(jid);
}

function activeSessionsCount() {
  return sessions.size;
}

module.exports = {
  getSession,
  updateSession,
  resetSession,
  activeSessionsCount,
};
