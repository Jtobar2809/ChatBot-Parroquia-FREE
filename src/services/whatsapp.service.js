'use strict';

/**
 * Conexion a WhatsApp usando Baileys.
 *
 * Responsabilidades:
 *   - Manejar la autenticacion multi-archivo (auth_session/).
 *   - Mostrar el QR en la terminal cuando hace falta enlazar.
 *   - Reconectar automaticamente si se cae la sesion.
 *   - Delegar cada mensaje entrante al messageHandler.
 */

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');

const env = require('../config/env');
const logger = require('../utils/logger');
const { processMessage } = require('../handlers/messageHandler');

let sock = null;
let isConnected = false;

async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(env.whatsapp.sessionFolder);
  const { version } = await fetchLatestBaileysVersion();

  logger.info(`Usando Baileys version: ${version.join('.')}`);

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false, // imprimimos nosotros manualmente con qrcode-terminal
    browser: [env.whatsapp.botName, 'Chrome', '1.0.0'],
    logger: pino({ level: 'silent' }), // Baileys log silenciado, usamos nuestro logger
    syncFullHistory: false,
    markOnlineOnConnect: true,
  });

  // Guardar credenciales cada vez que cambien.
  sock.ev.on('creds.update', saveCreds);

  // Manejo de conexion / QR / reconexion.
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      logger.banner('ESCANEA EL QR CON TU WHATSAPP');
      qrcode.generate(qr, { small: true });
      logger.info('Abre WhatsApp -> Dispositivos vinculados -> Vincular un dispositivo.');
    }

    if (connection === 'open') {
      isConnected = true;
      logger.success(`Conectado a WhatsApp como "${env.whatsapp.botName}".`);
    }

    if (connection === 'close') {
      isConnected = false;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      logger.warn(`Conexion cerrada (code=${statusCode}).`);

      if (shouldReconnect) {
        logger.info('Reintentando conexion en 3 segundos...');
        setTimeout(() => {
          startWhatsApp().catch((err) =>
            logger.error('Fallo reconectando:', err.message)
          );
        }, 3000);
      } else {
        logger.error('Sesion cerrada por el usuario. Elimina la carpeta auth_session/ y vuelve a escanear el QR.');
      }
    }
  });

  // Mensajes entrantes.
  sock.ev.on('messages.upsert', async (event) => {
    if (event.type !== 'notify') return;

    for (const msg of event.messages) {
      try {
        await handleIncomingMessage(msg);
      } catch (err) {
        logger.error('Error procesando mensaje:', err.message);
      }
    }
  });

  return sock;
}

/**
 * Extrae texto, filtra mensajes propios y de grupos,
 * y envia la respuesta del bot.
 */
async function handleIncomingMessage(msg) {
  // Ignorar mensajes enviados por nosotros mismos.
  if (msg.key.fromMe) return;

  // Solo atendemos chats individuales. Ignoramos grupos, canales
  // (newsletter), listas de difusión y estados para que el bot no
  // responda en lugares no deseados.
  const jid = msg.key.remoteJid;
  if (
    !jid ||
    jid.endsWith('@g.us') ||         // grupos
    jid.endsWith('@newsletter') ||   // canales
    jid.endsWith('@broadcast')       // listas de difusión y status@broadcast
  ) {
    return;
  }

  const text = extractText(msg);
  if (!text) return;

  logger.bot(`<- [${jid}] ${text}`);

  // Mostrar "escribiendo..." mientras procesamos.
  await sock.sendPresenceUpdate('composing', jid).catch(() => {});

  const reply = await processMessage(jid, text);

  await sock.sendMessage(jid, { text: reply });
  await sock.sendPresenceUpdate('paused', jid).catch(() => {});

  logger.bot(`-> [${jid}] ${reply.split('\n')[0].slice(0, 60)}...`);
}

/**
 * Baileys soporta muchos tipos de mensajes; aqui extraemos
 * solo el texto plano que nos interesa.
 */
function extractText(msg) {
  const m = msg.message;
  if (!m) return null;

  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.buttonsResponseMessage?.selectedButtonId ||
    m.listResponseMessage?.singleSelectReply?.selectedRowId ||
    null
  );
}

function getStatus() {
  return {
    connected: isConnected,
  };
}

module.exports = { startWhatsApp, getStatus };
