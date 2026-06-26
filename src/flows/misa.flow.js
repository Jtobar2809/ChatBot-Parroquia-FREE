'use strict';

/**
 * Flujo "Agendar Eucaristía".
 *
 * Pasos:
 *   1. nombre
 *   2. teléfono
 *   3. fecha
 *   4. intención
 *   5. confirmación + guardado en Supabase
 */

const validators = require('../utils/validators');
const { crearSolicitudMisa } = require('../services/solicitudesMisa.service');
const logger = require('../utils/logger');

const STEPS = {
  NOMBRE: 'nombre',
  TELEFONO: 'telefono',
  FECHA: 'fecha',
  INTENCION: 'intencion',
};

function start() {
  return {
    step: STEPS.NOMBRE,
    reply:
`⛪ *Agendar Eucaristía*

Para registrar tu solicitud, necesito algunos datos.

Por favor, escribe tu *nombre completo*:`,
  };
}

async function handle(session, text) {
  switch (session.step) {
    case STEPS.NOMBRE: {
      const v = validators.nombre(text);
      if (!v.ok) return { reply: v.error };
      session.data.nombre = text.trim();
      session.step = STEPS.TELEFONO;
      return { reply: '📞 Gracias. Ahora escribe tu *número de teléfono* (solo números):' };
    }

    case STEPS.TELEFONO: {
      const v = validators.telefono(text);
      if (!v.ok) return { reply: v.error };
      session.data.telefono = v.value;
      session.step = STEPS.FECHA;
      return {
        reply:
`📅 Perfecto. Ahora indica la *fecha y hora* deseada para la Eucaristía.

Ejemplo: _25 de diciembre de 2026, 8:00 a. m._`,
      };
    }

    case STEPS.FECHA: {
      const v = validators.fecha(text);
      if (!v.ok) return { reply: v.error };
      session.data.fecha = text.trim();
      session.step = STEPS.INTENCION;
      return {
        reply:
`🕯️ Por último, cuéntanos la *intención o motivo* de la Eucaristía.

Ejemplo: _Por el eterno descanso de: (nombre del difunto) O Acción de gracias O petición por : ..._`,
      };
    }

    case STEPS.INTENCION: {
      const v = validators.texto(text);
      if (!v.ok) return { reply: v.error };
      session.data.intencion = text.trim();

      try {
        await crearSolicitudMisa({
          nombre: session.data.nombre,
          telefono: session.data.telefono,
          fecha: session.data.fecha,
          intencion: session.data.intencion,
          jid: session.jid,
        });
      } catch (err) {
        logger.error('Error guardando solicitud de Eucaristía:', err.message);
        return {
          reply:
`⚠️ Hubo un problema guardando tu solicitud.

Por favor, intenta de nuevo más tarde o comunícate directamente con la parroquia.`,
          done: true,
        };
      }

      const resumen =
`✅ *Solicitud de Eucaristía registrada*

👤 Nombre: ${session.data.nombre}
📞 Teléfono: ${session.data.telefono}
📅 Fecha: ${session.data.fecha}
🕯️ Intención: ${session.data.intencion}

La parroquia se comunicará contigo para confirmar.

🙏 Que Dios te bendiga.

_Escribe *menú* si deseas hacer otra solicitud._`;

      return { reply: resumen, done: true };
    }

    default:
      return { reply: 'Algo salió mal. Escribe *menú* para empezar de nuevo.', done: true };
  }
}

module.exports = { start, handle };
