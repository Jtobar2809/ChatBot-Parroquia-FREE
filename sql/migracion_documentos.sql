-- ============================================================
--   MIGRACIÓN: nuevos campos en solicitudes_documentos
--   Fecha: 2026-06-24
-- ============================================================
-- Ejecuta este script en Supabase (SQL Editor -> New query -> RUN)
-- SOLO si ya habías creado las tablas antes con la versión anterior
-- de schema.sql. Es idempotente y NO borra datos: se puede correr
-- varias veces sin problema.
--
-- Cambios:
--   - nombre_completo  ->  nombre_solicitante (renombrado)
--   - + nombre_titular     (persona que aparece en el documento)
--   - + anio_sacramento    (año del sacramento o de expedición)
--   - + parentesco         (parentesco del solicitante con el titular)
-- ============================================================

-- 1) Renombrar nombre_completo a nombre_solicitante (solo si aplica).
do $$
begin
  if exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = 'solicitudes_documentos'
          and column_name = 'nombre_completo'
      )
     and not exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = 'solicitudes_documentos'
          and column_name = 'nombre_solicitante'
      )
  then
    alter table public.solicitudes_documentos
      rename column nombre_completo to nombre_solicitante;
  end if;
end $$;

-- 2) Agregar las nuevas columnas (si no existen).
alter table public.solicitudes_documentos
  add column if not exists nombre_solicitante text;

alter table public.solicitudes_documentos
  add column if not exists nombre_titular text;

alter table public.solicitudes_documentos
  add column if not exists anio_sacramento text;

alter table public.solicitudes_documentos
  add column if not exists parentesco text;
