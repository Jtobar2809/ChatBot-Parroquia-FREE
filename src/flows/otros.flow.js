'use strict';

/**
 * Flujo "Otro asunto".
 * Solo solicita un mensaje libre y lo guarda en Supabase.
 */

const validators = require('../utils/validators');
const { crearOtroAsunto } = require('../services/otrosAsuntos.service');
const logger = require('../utils/logger');

const STEPS = {
  MENSAJE: 'mensaje',
};

function start() {
  return {
    step: STEPS.MENSAJE,
    reply:
`✉️ *Otro asunto*

Cuéntanos en qué podemos ayudarte. Escribe tu mensaje y la parroquia lo revisará.`,
  };
}

async function handle(session, text) {
  switch (session.step) {
    case STEPS.MENSAJE: {
      const v = validators.texto(text);
      if (!v.ok) return { reply: v.error };
      session.data.mensaje = text.trim();

      try {
        await crearOtroAsunto({
          mensaje: session.data.mensaje,
          jid: session.jid,
        });
      } catch (err) {
        logger.error('Error guardando otro asunto:', err.message);
        return {
          reply:
`⚠️ Hubo un problema guardando tu mensaje.

Por favor, intenta de nuevo más tarde o comunícate directamente con la parroquia.`,
          done: true,
        };
      }

      const resumen =
`✅ *Mensaje recibido*

Gracias por escribirnos. La parroquia leerá tu mensaje y se comunicará contigo si es necesario.

🙏 Que Dios te bendiga.

_Escribe *menú* si deseas hacer otra solicitud._`;

      return { reply: resumen, done: true };
    }

    default:
      return { reply: 'Algo salió mal. Escribe *menú* para empezar de nuevo.', done: true };
  }
}

module.exports = { start, handle };
