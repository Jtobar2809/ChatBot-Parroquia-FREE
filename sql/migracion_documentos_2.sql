-- ============================================================
--   MIGRACIÓN 2: campo nombre_relacionado en solicitudes_documentos
--   Fecha: 2026-06-24
-- ============================================================
-- Ejecuta este script en Supabase (SQL Editor -> New query -> RUN)
-- DESPUÉS de haber corrido migracion_documentos.sql.
-- Es idempotente y NO borra datos: se puede correr varias veces.
--
-- Nuevo campo:
--   - nombre_relacionado: guarda el nombre de los padres / cónyuge /
--     difunto según el tipo de documento elegido en el subflujo.
-- ============================================================

alter table public.solicitudes_documentos
  add column if not exists nombre_relacionado text;
