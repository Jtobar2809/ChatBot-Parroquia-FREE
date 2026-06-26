-- ============================================================
--   MIGRACIÓN 3: eliminar el campo correo de solicitudes_documentos
--   Fecha: 2026-06-24
-- ============================================================
-- Ejecuta este script en Supabase (SQL Editor -> New query -> RUN)
-- DESPUÉS de migracion_documentos.sql y migracion_documentos_2.sql.
-- Es idempotente: se puede correr varias veces sin problema.
--
-- Motivo: el bot ya no le pide el correo electrónico a la persona,
-- así que la columna 'correo' (que era NOT NULL) se elimina para que
-- los registros se guarden sin ese dato.
-- ============================================================

alter table public.solicitudes_documentos
  drop column if exists correo;
