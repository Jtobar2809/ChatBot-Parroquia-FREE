'use strict';

/**
 * Flujo "Solicitar documento".
 *
 * Pasos:
 *   1. nombre del solicitante
 *   2. nombre del titular (persona que aparece en el documento)
 *   3. tipo de documento (menú numerado con subflujos):
 *        1 Partida de bautismo    -> año del sacramento + nombre de los padres
 *        2 Partida de confirmación -> año del sacramento + nombre de los padres
 *        3 Partida de matrimonio  -> año del sacramento + nombre del cónyuge
 *        4 Partida de defunción   -> fecha de defunción (el difunto ya es el titular)
 *        5 Otro                   -> especificar (sin fecha)
 *   4. parentesco del solicitante con el titular
 *   5. teléfono
 *   6. confirmación + guardado en Supabase
 */

const validators = require('../utils/validators');
const { crearSolicitudDocumento } = require('../services/solicitudesDocumentos.service');
const logger = require('../utils/logger');

const STEPS = {
  SOLICITANTE: 'solicitante',
  TITULAR: 'titular',
  TIPO: 'tipo',
  OTRO_ESPECIFICAR: 'otro_especificar',
  ANIO: 'anio',
  NOMBRE_REL: 'nombre_rel',
  PARENTESCO: 'parentesco',
  TELEFONO: 'telefono',
};

// Tipos que requieren año. Los que además llevan un nombre relacionado
// (padres o cónyuge) incluyen las propiedades rel*; la defunción no, porque
// el difunto es la misma persona que el titular.
// Cada tipo define qué fecha pide (año del sacramento o fecha de defunción)
// y, si aplica, un nombre relacionado (padres o cónyuge). La defunción no
// pide nombre relacionado porque el difunto es la misma persona que el titular.
const TIPOS = {
  '1': { label: 'Partida de bautismo', fechaTipo: 'anio', fechaPrompt: 'el *año del sacramento*', fechaEjemplo: '2010', fechaResumen: 'Año', relPrompt: 'nombre completo de los padres', relResumen: 'Padres', relIcon: '👨‍👩‍👧' },
  '2': { label: 'Partida de confirmación', fechaTipo: 'anio', fechaPrompt: 'el *año del sacramento*', fechaEjemplo: '2010', fechaResumen: 'Año', relPrompt: 'nombre completo de los padres', relResumen: 'Padres', relIcon: '👨‍👩‍👧' },
  '3': { label: 'Partida de matrimonio', fechaTipo: 'anio', fechaPrompt: 'el *año del sacramento*', fechaEjemplo: '2010', fechaResumen: 'Año', relPrompt: 'nombre completo del cónyuge', relResumen: 'Cónyuge', relIcon: '💍' },
  '4': { label: 'Partida de defunción', fechaTipo: 'fecha', fechaPrompt: 'la *fecha de defunción*', fechaEjemplo: '12 de marzo de 2020', fechaResumen: 'Fecha de defunción' },
};

const TIPO_MENU =
`📄 ¿Qué *tipo de documento* necesitas? Responde con el número correspondiente. Por ejemplo: *1*

1️⃣  Partida de bautismo
2️⃣  Partida de confirmación
3️⃣  Partida de matrimonio
4️⃣  Partida de defunción
5️⃣  Otro`;

const PARENTESCO_PROMPT =
`👪 Indica tu *parentesco con la persona que aparece en el documento*.

Ejemplo: _hijo, madre, esposo, mi documento, etc._`;

// Para defunción no aplica "mi documento", porque el titular es el difunto
// y no puede solicitar su propio documento.
const PARENTESCO_PROMPT_DEFUNCION =
`👪 Indica tu *parentesco con la persona que aparece en el documento*.

Ejemplo: _hijo, madre, esposo, etc._`;

function start() {
  return {
    step: STEPS.SOLICITANTE,
    reply:
`📜 *Solicitar documento*

Te ayudamos a tramitar tu documento parroquial.

Para empezar, escribe el *nombre completo de la persona que solicita* el documento:`,
  };
}

async function handle(session, text) {
  switch (session.step) {
    case STEPS.SOLICITANTE: {
      const v = validators.nombre(text);
      if (!v.ok) return { reply: v.error };
      session.data.solicitante = text.trim();
      session.step = STEPS.TITULAR;
      return {
        reply: '🪪 Ahora, escribe el *nombre completo de la persona que aparece en el documento*:',
      };
    }

    case STEPS.TITULAR: {
      const v = validators.nombre(text);
      if (!v.ok) return { reply: v.error };
      session.data.titular = text.trim();
      session.step = STEPS.TIPO;
      return { reply: TIPO_MENU };
    }

    case STEPS.TIPO: {
      const opt = (text || '').trim();

      // Opciones que piden una fecha (bautismo, confirmación, matrimonio, defunción).
      if (TIPOS[opt]) {
        const tipo = TIPOS[opt];
        session.data.tipoDocumento = tipo.label;
        session.data.fechaTipo = tipo.fechaTipo;
        session.data.fechaResumen = tipo.fechaResumen;
        if (tipo.relPrompt) {
          session.data.relPrompt = tipo.relPrompt;
          session.data.relResumen = tipo.relResumen;
          session.data.relIcon = tipo.relIcon;
        }
        session.step = STEPS.ANIO;
        return {
          reply:
`📆 Indica ${tipo.fechaPrompt}.

Ejemplo: _${tipo.fechaEjemplo}_`,
        };
      }

      // 5) Otro: pedir que especifique el documento.
      if (opt === '5' || ['otro', 'otros'].includes(opt.toLowerCase())) {
        session.step = STEPS.OTRO_ESPECIFICAR;
        return { reply: '✏️ Escribe *qué documento* necesitas:' };
      }

      // Opción inválida: volver a mostrar el menú.
      return { reply: `No entendí tu respuesta. 🤔 Responde con un número del *1* al *5*.\n\n${TIPO_MENU}` };
    }

    case STEPS.OTRO_ESPECIFICAR: {
      const v = validators.texto(text);
      if (!v.ok) return { reply: v.error };
      session.data.tipoDocumento = `Otro: ${text.trim()}`;
      session.step = STEPS.PARENTESCO;
      return { reply: PARENTESCO_PROMPT };
    }

    case STEPS.ANIO: {
      const v = validators[session.data.fechaTipo](text);
      if (!v.ok) return { reply: v.error };
      session.data.anio = v.value || text.trim();

      // La defunción no pide nombre relacionado (el difunto es el titular).
      if (session.data.relPrompt) {
        session.step = STEPS.NOMBRE_REL;
        return { reply: `${session.data.relIcon} Escribe el *${session.data.relPrompt}*:` };
      }

      // Solo la defunción llega aquí (no tiene relPrompt): usa el ejemplo
      // de parentesco sin "mi documento".
      session.step = STEPS.PARENTESCO;
      return { reply: PARENTESCO_PROMPT_DEFUNCION };
    }

    case STEPS.NOMBRE_REL: {
      const v = validators.nombre(text);
      if (!v.ok) return { reply: v.error };
      session.data.nombreRelacionado = text.trim();
      session.step = STEPS.PARENTESCO;
      return { reply: PARENTESCO_PROMPT };
    }

    case STEPS.PARENTESCO: {
      const v = validators.texto(text);
      if (!v.ok) return { reply: v.error };
      session.data.parentesco = text.trim();
      session.step = STEPS.TELEFONO;
      return { reply: '📞 Escribe tu *número de teléfono* (solo números):' };
    }

    case STEPS.TELEFONO: {
      const v = validators.telefono(text);
      if (!v.ok) return { reply: v.error };
      session.data.telefono = v.value;

      try {
        await crearSolicitudDocumento({
          solicitante: session.data.solicitante,
          titular: session.data.titular,
          tipoDocumento: session.data.tipoDocumento,
          anio: session.data.anio,
          nombreRelacionado: session.data.nombreRelacionado,
          parentesco: session.data.parentesco,
          telefono: session.data.telefono,
          jid: session.jid,
        });
      } catch (err) {
        logger.error('Error guardando solicitud de documento:', err.message);
        return {
          reply:
`⚠️ Hubo un problema guardando tu solicitud.

Por favor, intenta de nuevo más tarde o comunícate directamente con la parroquia.`,
          done: true,
        };
      }

      const d = session.data;
      const lineas = [
        '✅ *Solicitud de documento registrada*',
        '',
        `🧑 Solicitante: ${d.solicitante}`,
        `🪪 Titular del documento: ${d.titular}`,
        `📄 Documento: ${d.tipoDocumento}`,
      ];
      if (d.anio) lineas.push(`📆 ${d.fechaResumen}: ${d.anio}`);
      if (d.nombreRelacionado) lineas.push(`${d.relIcon} ${d.relResumen}: ${d.nombreRelacionado}`);
      lineas.push(
        `👪 Parentesco: ${d.parentesco}`,
        `📞 Teléfono: ${d.telefono}`,
        '',
        'La parroquia revisará tu solicitud y se comunicará contigo.',
        '',
        '🙏 Que Dios te bendiga.',
        '',
        '_Escribe *menú* si deseas hacer otra solicitud._'
      );

      return { reply: lineas.join('\n'), done: true };
    }

    default:
      return { reply: 'Algo salió mal. Escribe *menú* para empezar de nuevo.', done: true };
  }
}

module.exports = { start, handle };
