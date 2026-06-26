# Chatbot WhatsApp - Parroquia

Chatbot conversacional de WhatsApp para una parroquia, **100% gratis**, construido con:

- **Node.js** + **JavaScript moderno** (sin TypeScript)
- **[Baileys](https://github.com/WhiskeySockets/Baileys)** para conectarse a WhatsApp (sin Twilio ni APIs pagas)
- **Express** para exponer un endpoint HTTP (necesario en Render/Railway)
- **Supabase** como base de datos
- Arquitectura limpia, modular y facil de mantener

Cuatro flujos conversacionales:

1. ⛪ **Agendar Eucaristía**
2. 📜 **Solicitar documento** (partidas, constancias, etc.)
3. ℹ️ **Ver información de la parroquia** (datos de contacto)
4. ✉️ **Otro asunto** (mensaje libre)

---

## Tabla de contenidos

1. [Estructura del proyecto](#estructura-del-proyecto)
2. [Requisitos previos](#requisitos-previos)
3. [Instalacion local](#instalacion-local)
4. [Configurar Supabase](#configurar-supabase)
5. [Variables de entorno (.env)](#variables-de-entorno-env)
6. [Como ejecutar](#como-ejecutar)
7. [Como escanear el QR](#como-escanear-el-qr)
8. [Como probar el bot](#como-probar-el-bot)
9. [Despliegue gratis en Oracle Cloud (RECOMENDADO)](#despliegue-gratis-en-oracle-cloud-recomendado)
10. [Despliegue en Render](#despliegue-en-render)
11. [Despliegue en Railway](#despliegue-en-railway)
11. [Cosas que debes hacer manualmente](#cosas-que-debes-hacer-manualmente)
12. [FAQ y solucion de problemas](#faq-y-solucion-de-problemas)

---

## Estructura del proyecto

```
chatbot_Virgilio/
├── index.js                          # Punto de entrada
├── package.json
├── .env.example                      # Plantilla de variables de entorno
├── .gitignore
├── sql/
│   └── schema.sql                    # Script SQL para Supabase
└── src/
    ├── config/
    │   ├── env.js                    # Carga y valida el .env
    │   └── supabase.js               # Cliente unico de Supabase
    ├── flows/                        # Flujos conversacionales
    │   ├── menu.flow.js
    │   ├── misa.flow.js
    │   ├── documentos.flow.js
    │   └── otros.flow.js
    ├── handlers/
    │   ├── messageHandler.js         # Orquesta los flujos
    │   └── sessionManager.js         # Estado por usuario (en memoria)
    ├── services/
    │   ├── whatsapp.service.js       # Conexion Baileys
    │   ├── solicitudesMisa.service.js
    │   ├── solicitudesDocumentos.service.js
    │   └── otrosAsuntos.service.js
    ├── utils/
    │   ├── logger.js                 # Logs bonitos con colores
    │   └── validators.js             # Validaciones de inputs
    └── server.js                     # Servidor Express minimo
```

---

## Requisitos previos

- **Node.js 18 o superior** ([descargar](https://nodejs.org/))
- Una cuenta gratuita de **[Supabase](https://supabase.com/)**
- Un telefono con **WhatsApp** instalado (para escanear el QR)
- Opcionalmente, cuenta en **[Render](https://render.com/)** o **[Railway](https://railway.app/)** para desplegar.

---

## Instalacion local

```bash
# 1. Clonar o descargar el proyecto
cd chatbot_Virgilio

# 2. Instalar dependencias
npm install

# 3. Copiar la plantilla de variables de entorno
cp .env.example .env
# (en Windows PowerShell: Copy-Item .env.example .env)
```

---

## Configurar Supabase

1. Entra a [https://supabase.com](https://supabase.com) y crea un proyecto nuevo (es gratis).
2. En el menu lateral abre **SQL Editor → New query**.
3. Copia y pega el contenido de [`sql/schema.sql`](./sql/schema.sql) y dale a **RUN**.
   Esto crea las tres tablas: `solicitudes_misa`, `solicitudes_documentos` y `otros_asuntos`.
4. Ve a **Project Settings → API** y copia:
   - `Project URL` → sera tu `SUPABASE_URL`
   - `service_role` key (la secreta, no la `anon`) → sera tu `SUPABASE_KEY`

> ⚠️ La `service_role` key es secreta. NUNCA la subas a git ni la pongas en el frontend.

---

## Variables de entorno (.env)

Edita el archivo `.env` que creaste y completa los valores:

| Variable          | Descripcion                                                                 |
|-------------------|------------------------------------------------------------------------------|
| `PORT`            | Puerto del servidor HTTP. Render/Railway lo inyectan automaticamente.       |
| `NODE_ENV`        | `development` en local, `production` en el servidor.                        |
| `SUPABASE_URL`    | URL del proyecto Supabase (paso anterior).                                  |
| `SUPABASE_KEY`    | `service_role` key de Supabase.                                             |
| `SESSION_FOLDER`  | Carpeta donde Baileys guarda la sesion. Por defecto `auth_session`.         |
| `BOT_NAME`        | Nombre que aparecera como "dispositivo vinculado" en WhatsApp.              |

---

## Como ejecutar

```bash
# Modo produccion
npm start

# Modo desarrollo (con autoreload usando nodemon)
npm run dev
```

Cuando arranque veras algo asi en la consola:

```
============================================================
  CHATBOT PARROQUIA - INICIANDO
============================================================

[INFO] Servidor HTTP escuchando en puerto 3000
[INFO] Usando Baileys version: 6.7.8

============================================================
  ESCANEA EL QR CON TU WHATSAPP
============================================================

[QR CODE AQUI EN ASCII]

[OK]   Conectado a WhatsApp como "Parroquia Bot".
```

---

## Como escanear el QR

La **primera vez** que arrancas el bot, Baileys mostrara un codigo QR ASCII en la terminal:

1. Abre **WhatsApp** en el telefono que sera el bot.
2. Toca el menu de los **3 puntos → Dispositivos vinculados**.
3. Toca **Vincular un dispositivo**.
4. Apunta la camara al QR que aparece en la consola.
5. Una vez conectado veras: `[OK] Conectado a WhatsApp como "Parroquia Bot"`.

A partir de aqui, la sesion queda guardada en la carpeta `auth_session/`. **Mientras no borres esa carpeta no tendras que escanear el QR de nuevo.**

> 💡 Tip: usa un numero exclusivo para la parroquia (un chip nuevo o un numero virtual). El telefono debe quedarse encendido y con internet.

---

## Como probar el bot

Desde otro WhatsApp escribe al numero del bot. Veras:

```
✝️ Bienvenido al despacho de la Parroquia Cristo Resucitado
Arquidiócesis de Popayán

1️⃣  ⛪ Agendar Eucaristía
2️⃣  📜 Solicitar documento
3️⃣  ℹ️ Ver información de la parroquia
4️⃣  ✉️ Otro asunto
```

Responde con `1`, `2`, `3` o `4` y completa los pasos. En cualquier momento puedes escribir `menu`, `cancelar` o `salir` para reiniciar.

Para revisar que los datos esten llegando:

- Entra a tu proyecto en Supabase → **Table Editor** → selecciona la tabla.
- O ve a `http://localhost:3000/status` para ver si el bot esta conectado.

---

## Despliegue gratis en Oracle Cloud (RECOMENDADO)

La forma **100% gratis y 24/7** de correr este bot. Te dan una VM Linux gratis para siempre.

👉 Guía completa paso a paso: **[deploy/ORACLE_DEPLOY.md](./deploy/ORACLE_DEPLOY.md)**

Resumen rápido:

1. Crear cuenta en https://www.oracle.com/cloud/free/ (necesitas tarjeta para verificar, **no te cobran**).
2. Crear una VM Ubuntu 22.04 (Ampere A1.Flex con 6 GB RAM, free tier).
3. Abrir el puerto 3000 en la Security List de la VCN.
4. Conectarte por SSH con la llave que te dieron.
5. Instalar Node y dependencias (`bash deploy/setup-server.sh`).
6. Clonar el repo, `npm install`, configurar `.env`.
7. Primer arranque con `screen -S bot && npm start` → escanear QR → `Ctrl+A D`.
8. Instalar como servicio: `sudo bash deploy/install-systemd.sh`.

Costo total: **0 USD/mes**. Detalles, troubleshooting y comandos útiles en la guía.

---

## Despliegue en Render

> ⚠️ **Importante:** Render reinicia el contenedor cada cierto tiempo en su plan gratuito. Como Baileys guarda la sesion en disco (`auth_session/`), si el disco no es persistente **tendras que volver a escanear el QR cada vez que reinicie**.
>
> Soluciones:
> - Usar el **Persistent Disk** de Render (de pago, ~$1/mes).
> - O usar **Railway**, que mantiene el filesystem entre reinicios.
> - O ejecutar el bot en una **Raspberry Pi**, VPS o tu propio servidor.

### Pasos en Render

1. Sube tu proyecto a un repositorio en **GitHub**.
2. Entra a [https://render.com](https://render.com) y crea una cuenta.
3. Clic en **New + → Web Service**.
4. Conecta tu cuenta de GitHub y selecciona el repo.
5. Configura asi:
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (o el que prefieras)
6. En la seccion **Environment Variables** agrega:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `NODE_ENV=production`
   - `BOT_NAME=Parroquia Bot`
   - (Render inyecta `PORT` automaticamente, no lo agregues a mano)
7. Si activaste un **Persistent Disk**, montalo en `/opt/render/project/src/auth_session`
   y agrega `SESSION_FOLDER=/opt/render/project/src/auth_session`.
8. Despliega. La **primera vez** abre los **Logs** de Render para ver el QR y escanearlo.

---

## Despliegue en Railway

Railway suele ser mas comodo porque mantiene el filesystem entre reinicios.

1. Sube tu proyecto a GitHub.
2. Entra a [https://railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**.
3. Selecciona el repo. Railway detecta Node automaticamente.
4. En **Variables** agrega:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `NODE_ENV=production`
   - `BOT_NAME=Parroquia Bot`
5. Despliega. En **Deploy Logs** veras el QR la primera vez. Escanealo.

---

## Cosas que debes hacer manualmente

Estos pasos NO los puede hacer el codigo por ti:

1. ✅ **Instalar Node.js 18+** en tu maquina o servidor.
2. ✅ **Crear el proyecto en Supabase** y obtener `SUPABASE_URL` y `SUPABASE_KEY`.
3. ✅ **Ejecutar el SQL** de `sql/schema.sql` en el editor SQL de Supabase.
4. ✅ **Completar el archivo `.env`** con tus credenciales.
5. ✅ **Tener un numero de WhatsApp** dedicado para el bot.
6. ✅ **Escanear el QR** la primera vez desde tu telefono (Dispositivos vinculados).
7. ✅ **Mantener el proceso corriendo** (PM2, systemd, Render, Railway, etc.).
8. ✅ **Cuidar la carpeta `auth_session/`**: si la borras tienes que escanear el QR otra vez.
9. ✅ **Hacer backups** de Supabase si los datos son importantes.
10. ✅ **Cumplir politicas de WhatsApp**: este bot usa WhatsApp Web no oficial. WhatsApp puede banear numeros que envien spam. Usalo solo para contestar a quien te escribe.

---

## FAQ y solucion de problemas

### El QR no aparece o caduca muy rapido

Cierra el proceso, borra la carpeta `auth_session/` y vuelve a ejecutar `npm start`. Si tarda, asegurate de tener buena conexion.

### "Sesion cerrada por el usuario"

Significa que desvinculaste el dispositivo desde WhatsApp del telefono. Elimina `auth_session/` y vuelve a escanear el QR.

```bash
npm run clean
npm start
```

### "Falta la variable de entorno requerida"

Revisa que tu `.env` tenga `SUPABASE_URL` y `SUPABASE_KEY` correctamente escritos.

### Los datos no se guardan en Supabase

- Verifica que ejecutaste `sql/schema.sql`.
- Verifica que estas usando la **service_role** key, no la `anon`.
- Mira los logs: si hay error de RLS, desactiva Row Level Security o crea policies.

### Me llegan mensajes de grupos

El bot **ignora grupos a proposito** (en `whatsapp.service.js`). Esto evita responder en chats grupales no deseados. Si quieres responder a grupos, edita esa logica.

### Quiero reiniciar el menu desde el cliente

Cualquier usuario puede escribir `menu`, `inicio`, `cancelar` o `salir` para volver al menu principal en cualquier momento.

---

## Licencia

MIT. Usalo, modificalo y compartelo libremente. 🙏
