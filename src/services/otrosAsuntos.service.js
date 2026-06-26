'use strict';

/**
 * Servicio para persistir mensajes libres / otros asuntos.
 */

const supabase = require('../config/supabase');
const logger = require('../utils/logger');

const TABLE = 'otros_asuntos';

async function crearOtroAsunto(datos) {
  const payload = {
    mensaje: datos.mensaje,
    whatsapp_jid: datos.jid,
    nombre_remitente: datos.nombre || null,
  };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    logger.error('No se pudo guardar el otro asunto:', error.message);
    throw error;
  }

  logger.success(`Otro asunto guardado (id=${data.id})`);
  return data;
}

module.exports = { crearOtroAsunto };
