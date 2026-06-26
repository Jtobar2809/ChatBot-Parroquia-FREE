'use strict';

/**
 * Carga y valida todas las variables de entorno del proyecto.
 * Si falta alguna variable critica, el proceso se detiene
 * para evitar errores silenciosos en produccion.
 */

require('dotenv').config();

const requiredVars = ['SUPABASE_URL', 'SUPABASE_KEY'];

// Verificamos que las variables criticas existan antes de arrancar.
for (const key of requiredVars) {
  if (!process.env[key]) {
    console.error(`[ENV] Falta la variable de entorno requerida: ${key}`);
    process.exit(1);
  }
}

const env = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
  },

  whatsapp: {
    sessionFolder: process.env.SESSION_FOLDER || 'auth_session',
    botName: process.env.BOT_NAME || 'Parroquia Bot',
  },
};

module.exports = env;
