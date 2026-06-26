'use strict';

/**
 * Servicio para persistir solicitudes de documentos parroquiales.
 */

const supabase = require('../config/supabase');
const logger = require('../utils/logger');

const TABLE = 'solicitudes_documentos';

async function crearSolicitudDocumento(datos) {
  const payload = {
    nombre_solicitante: datos.solicitante,
    nombre_titular: datos.titular,
    tipo_documento: datos.tipoDocumento,
    anio_sacramento: datos.anio,
    nombre_relacionado: datos.nombreRelacionado,
    parentesco: datos.parentesco,
    telefono: datos.telefono,
    whatsapp_jid: datos.jid,
  };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    logger.error('No se pudo guardar la solicitud de documento:', error.message);
    throw error;
  }

  logger.success(`Solicitud de documento guardada (id=${data.id})`);
  return data;
}

module.exports = { crearSolicitudDocumento };
