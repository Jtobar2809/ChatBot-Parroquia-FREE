-- ============================================================
--   ESQUEMA DE BASE DE DATOS - CHATBOT PARROQUIA
-- ============================================================
-- Ejecuta este script en el editor SQL de Supabase
-- (Supabase Dashboard -> SQL Editor -> New query).
--
-- Crea las 3 tablas que usa el bot:
--   1. solicitudes_misa
--   2. solicitudes_documentos
--   3. otros_asuntos
-- ============================================================

-- Extension para UUIDs (Supabase la suele tener activa por defecto).
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1) SOLICITUDES DE MISA
-- ------------------------------------------------------------
create table if not exists public.solicitudes_misa (
  id              uuid          primary key default gen_random_uuid(),
  nombre_completo text          not null,
  telefono        text          not null,
  fecha_misa      text          not null,
  intencion       text          not null,
  whatsapp_jid    text,
  estado          text          not null default 'pendiente',
  created_at      timestamptz   not null default now()
);

create index if not exists idx_solicitudes_misa_created_at
  on public.solicitudes_misa (created_at desc);

create index if not exists idx_solicitudes_misa_estado
  on public.solicitudes_misa (estado);

-- ------------------------------------------------------------
-- 2) SOLICITUDES DE DOCUMENTOS
-- ------------------------------------------------------------
create table if not exists public.solicitudes_documentos (
  id                 uuid          primary key default gen_random_uuid(),
  nombre_solicitante text          not null,   -- quien solicita el documento
  nombre_titular     text          not null,   -- persona que aparece en el documento
  tipo_documento     text          not null,
  anio_sacramento    text,                      -- año del sacramento o de expedición
  nombre_relacionado text,                      -- padres / cónyuge / difunto, según el tipo
  parentesco         text,                      -- parentesco del solicitante con el titular
  telefono           text          not null,
  whatsapp_jid       text,
  estado             text          not null default 'pendiente',
  created_at         timestamptz   not null default now()
);

create index if not exists idx_solicitudes_doc_created_at
  on public.solicitudes_documentos (created_at desc);

create index if not exists idx_solicitudes_doc_estado
  on public.solicitudes_documentos (estado);

-- ------------------------------------------------------------
-- 3) OTROS ASUNTOS
-- ------------------------------------------------------------
create table if not exists public.otros_asuntos (
  id                uuid        primary key default gen_random_uuid(),
  mensaje           text        not null,
  whatsapp_jid      text,
  nombre_remitente  text,
  atendido          boolean     not null default false,
  created_at        timestamptz not null default now()
);

create index if not exists idx_otros_asuntos_created_at
  on public.otros_asuntos (created_at desc);

create index if not exists idx_otros_asuntos_atendido
  on public.otros_asuntos (atendido);

-- ------------------------------------------------------------
-- (OPCIONAL) ROW LEVEL SECURITY
-- ------------------------------------------------------------
-- Si usas la SERVICE ROLE KEY en el bot (recomendado), RLS no te bloquea.
-- Si en cambio usas la ANON KEY, deberas activar policies adecuadas.
--
-- Ejemplo para mantenerlas privadas:
--   alter table public.solicitudes_misa enable row level security;
--   alter table public.solicitudes_documentos enable row level security;
--   alter table public.otros_asuntos enable row level security;
