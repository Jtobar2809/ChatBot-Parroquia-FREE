'use strict';

/**
 * Cliente unico de Supabase reutilizado por todos los servicios.
 * Se exporta como singleton para evitar abrir multiples conexiones.
 */

const { createClient } = require('@supabase/supabase-js');
const env = require('./env');

const supabase = createClient(env.supabase.url, env.supabase.key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

module.exports = supabase;
