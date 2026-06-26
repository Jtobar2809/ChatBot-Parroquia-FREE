'use strict';

/**
 * Flujo del menú principal.
 * Se ejecuta cuando el usuario no tiene un flujo activo
 * o cuando escribe palabras clave como "menú", "inicio", "hola".
 */

const MENU_TEXT =
`✝️ *Bienvenido al despacho de la Parroquia Cristo Resucitado.*
_Arquidiócesis de Popayán._

Por favor, selecciona una opción respondiendo con el número correspondiente. Por ejemplo: *1*

1️⃣  ⛪ Agendar Eucaristía.
2️⃣  📜 Solicitar documento.
3️⃣  ℹ️ Ver información de la parroquia.
4️⃣  ✉️ Otro asunto.

_Escribe en cualquier momento *menú* para volver aquí._`;

const INVALID_TEXT =
`No entendí tu respuesta. 🤔

Por favor, responde con *1*, *2*, *3* o *4*:

1️⃣  ⛪ Agendar Eucaristía.
2️⃣  📜 Solicitar documento.
3️⃣  ℹ️ Ver información de la parroquia.
4️⃣  ✉️ Otro asunto.`;

function getMenuText() {
  return MENU_TEXT;
}

/**
 * Procesa la opción elegida por el usuario.
 * Devuelve el siguiente flujo a iniciar, o null si la opción fue inválida.
 */
function parseMenuOption(text) {
  const opt = (text || '').trim().toLowerCase();

  if (['1', '1️⃣', 'eucaristia', 'eucaristía', 'agendar eucaristia', 'agendar eucaristía', 'misa', 'agendar misa'].includes(opt)) return 'misa';
  if (['2', '2️⃣', 'documento', 'documentos', 'solicitar documento'].includes(opt)) return 'documentos';
  if (['3', '3️⃣', 'info', 'informacion', 'información', 'ver informacion', 'ver información'].includes(opt)) return 'info';
  if (['4', '4️⃣', 'otro', 'otros', 'otro asunto'].includes(opt)) return 'otros';

  return null;
}

module.exports = {
  getMenuText,
  parseMenuOption,
  INVALID_TEXT,
};
