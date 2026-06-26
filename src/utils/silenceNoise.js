'use strict';

/**
 * Silencia el "ruido" de descifrado de libsignal/Baileys.
 *
 * libsignal imprime directamente por console.* (no por el logger de Baileys,
 * que ya está silenciado) mensajes como "Bad MAC", "Failed to decrypt
 * message" o "Closing session: SessionEntry {...}" cuando WhatsApp reenvía
 * mensajes viejos que ya no se pueden descifrar. Son inofensivos pero
 * ensucian los logs.
 *
 * Este módulo envuelve console.log/error/warn y descarta SOLO las líneas
 * que coincidan con esos patrones conocidos; cualquier otro mensaje
 * (incluidos los errores reales) se imprime con normalidad.
 */

const NOISE_PATTERNS = [
  'Failed to decrypt message',
  'Session error',
  'Closing session',
  'Closing open session',
  'Bad MAC',
  'MessageCounterError',
  'SessionEntry',
  'decryptWithSessions',
  'No matching sessions',
  'No session record',
];

function looksLikeNoise(args) {
  for (const a of args) {
    let s = '';
    if (typeof a === 'string') s = a;
    else if (a && typeof a === 'object') s = `${a.message || ''} ${a.stack || ''}`;
    if (s && NOISE_PATTERNS.some((p) => s.includes(p))) return true;
  }
  return false;
}

function install() {
  for (const method of ['log', 'error', 'warn']) {
    const original = console[method].bind(console);
    console[method] = (...args) => {
      if (looksLikeNoise(args)) return;
      original(...args);
    };
  }
}

module.exports = { install };
