'use strict';

/**
 * Flujo "Ver información de la parroquia".
 *
 * Es un flujo informativo: no guarda nada en la base de datos ni
 * mantiene estado. Solo devuelve los datos de contacto de la parroquia.
 */

const INFO_TEXT =
`ℹ️ *Información de la parroquia*

✝️ *Parroquia Cristo Resucitado*
⛪ Arquidiócesis de Popayán
🧾 NIT 817.006.337-8

📍 Dirección: Cra. 1AE N.° 7-89, B/ Santa Inés, Popayán, Cauca
📧 Correo: cristoresucitadopopayan@gmail.com
📞 Teléfono: 311 847 6387

🙏 Que Dios te bendiga.

_Escribe *menú* para volver al inicio._`;

function getInfoText() {
  return INFO_TEXT;
}

module.exports = { getInfoText };
