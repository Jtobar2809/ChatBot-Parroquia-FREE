'use strict';

/**
 * Servicio para persistir solicitudes de Eucaristía en Supabase.
 */

const supabase = require('../config/supabase');
const logger = require('../utils/logger');

const TABLE = 'solicitudes_misa';

async function crearSolicitudMisa(datos) {
  const payload = {
    nombre_completo: datos.nombre,
    telefono: datos.telefono,
    fecha_misa: datos.fecha,
    intencion: datos.intencion,
    whatsapp_jid: datos.jid,
  };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    logger.error('No se pudo guardar la solicitud de Eucaristía:', error.message);
    throw error;
  }

  logger.success(`Solicitud de Eucaristía guardada (id=${data.id})`);
  return data;
}

module.exports = { crearSolicitudMisa };
