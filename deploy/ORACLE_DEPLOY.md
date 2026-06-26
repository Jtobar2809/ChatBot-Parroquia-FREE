# Despliegue en Oracle Cloud (Always Free)

Guía paso a paso para correr el chatbot **24/7 gratis** en una máquina virtual de Oracle Cloud.

> **Resumen:** vas a crear una VM Linux gratuita en Oracle, conectarte por SSH, instalar Node, subir el código, escanear el QR una vez y dejar el bot corriendo como servicio del sistema. Tiempo estimado: **30 a 45 minutos**.

---

## Lo que necesitas antes de empezar

- 📧 Un correo electrónico
- 💳 Una **tarjeta de crédito o débito internacional** (Oracle la usa para verificar que eres humano, **no te van a cobrar**, no la pongas en pánico). Si no tienes, una tarjeta virtual gratis tipo Nequi/RappiCard o similar funciona.
- 📱 Tu celular para recibir un SMS de verificación
- 💻 Una computadora con terminal (Windows: PowerShell o WSL; Mac/Linux: terminal)

---

## FASE 1 — Crear cuenta en Oracle Cloud

1. Entra a **https://www.oracle.com/cloud/free/**
2. Clic en **Start for free**.
3. Llena el formulario:
   - **Country:** Colombia
   - **Name / email:** los tuyos
   - **Verify your email:** revisa la bandeja y confirma.
4. Completa:
   - **Account type:** Individual
   - **Cloud Account Name:** un nombre cualquiera, ej. `parroquia-jtobar` (es único global, si está tomado prueba otro).
   - **Home Region:** elige una cercana. Recomiendo **`Sao Paulo`** o **`US East (Ashburn)`**.
     > ⚠️ Esta decisión NO se puede cambiar. Elige bien.
5. **Verificación por SMS:** te llegará un código al celular.
6. **Tarjeta:** la metes para validación. Oracle hace una retención de ~$1 USD que **te devuelve** en pocos días. No se cobra nada más.
7. Acepta los términos y dale a **Start my free trial**.

Oracle te enviará un correo cuando tu cuenta esté activa (1 a 10 minutos).

---

## FASE 2 — Crear la máquina virtual (VM)

Una vez dentro del panel de Oracle Cloud:

1. Menú hamburguesa (☰ arriba a la izquierda) → **Compute** → **Instances**.
2. Clic en **Create Instance**.
3. Configura:

   | Campo | Valor |
   |---|---|
   | **Name** | `parroquia-bot` |
   | **Compartment** | el que viene por defecto |
   | **Image** | Clic en **Edit** → selecciona **Canonical Ubuntu 22.04** |
   | **Shape** | Clic en **Edit** → selecciona **Ampere** → `VM.Standard.A1.Flex` → ajusta a **1 OCPU y 6 GB RAM** (es gratis dentro del Always Free) |

   > Si te aparece **"Out of capacity"** en Ampere (suele pasar), usa la **AMD VM.Standard.E2.1.Micro** (también free, pero más lenta — 1 GB RAM). Sirve igual para este bot.

4. **Networking:** deja todo por defecto. Asegúrate que esté **"Assign a public IPv4 address"** activado.
5. **Add SSH keys:**
   - Marca **Generate a key pair for me**.
   - Clic en **Save private key** → se descarga un archivo `ssh-key-XXXX.key`. **GUÁRDALO BIEN**, sin esa llave no entras a la VM nunca más.
   - También guarda la **Public key**.
6. **Boot volume:** deja por defecto (47 GB gratis).
7. Clic en **Create**.

Espera 1-2 minutos hasta que la VM aparezca como **Running** (verde). Anota la **Public IP address** que se muestra.

---

## FASE 3 — Abrir el puerto en la red virtual

Oracle bloquea casi todos los puertos por defecto. Necesitamos abrir el **3000** (Express) y dejar el **22** (SSH) que ya está abierto.

1. Desde el panel de la VM clic en **Subnet** (nombre azul, al lado de "Virtual cloud network").
2. Dentro de la subnet, clic en **Default Security List** (o "Security Lists" → la que aparezca).
3. En **Ingress Rules** clic en **Add Ingress Rules**:
   - **Source CIDR:** `0.0.0.0/0`
   - **IP Protocol:** TCP
   - **Destination Port Range:** `3000`
   - **Description:** `Express del bot`
   - Clic en **Add Ingress Rules**.

> Esto solo abre el firewall en la red de Oracle. El firewall de la VM lo abrimos en la Fase 5 con el script `setup-server.sh`.

---

## FASE 4 — Conectarte por SSH

Desde tu computadora abre una terminal y muévete a donde guardaste la llave privada:

```bash
# Windows PowerShell:
cd $HOME\Downloads
icacls ssh-key-XXXX.key /inheritance:r
icacls ssh-key-XXXX.key /grant:r "${env:USERNAME}:R"

# Linux/Mac:
chmod 400 ssh-key-XXXX.key
```

Ahora conéctate (reemplaza `IP_PUBLICA` por la que anotaste):

```bash
ssh -i ssh-key-XXXX.key ubuntu@IP_PUBLICA
```

La primera vez te preguntará si confías en el host → escribe `yes`. Si todo va bien verás algo como:

```
ubuntu@parroquia-bot:~$
```

🎉 Ya estás dentro de tu servidor gratis 24/7.

---

## FASE 5 — Instalar dependencias en el servidor

Dentro de la VM ejecuta:

```bash
# Subir Node.js + git + firewall en un solo paso:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git build-essential ufw screen
sudo ufw allow OpenSSH && sudo ufw allow 3000/tcp && sudo ufw --force enable

# Oracle Ubuntu trae iptables muy estricto, abrimos el 3000 ahí también:
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT
sudo netfilter-persistent save || true

node -v   # debe mostrar v20.x
```

> Alternativa: si subes el repo primero (Fase 6), puedes correr `bash deploy/setup-server.sh` que hace lo mismo.

---

## FASE 6 — Subir el código al servidor

Tienes dos formas. Elige la más cómoda.

### A) Vía Git (recomendado)

1. En tu PC, sube el proyecto a un repo en GitHub (privado si quieres).
2. Dentro de la VM:

```bash
cd ~
git clone https://github.com/TU-USUARIO/chatbot_Virgilio.git
cd chatbot_Virgilio
npm install
```

### B) Vía SCP (sin GitHub)

Desde tu PC local (NO dentro de la VM):

```bash
# Comprime el proyecto sin node_modules y sin auth_session:
# Windows PowerShell:
Compress-Archive -Path .\chatbot_Virgilio\* -DestinationPath bot.zip

# Subir:
scp -i ssh-key-XXXX.key bot.zip ubuntu@IP_PUBLICA:~/

# Dentro de la VM:
ssh -i ssh-key-XXXX.key ubuntu@IP_PUBLICA
sudo apt-get install -y unzip
unzip bot.zip -d chatbot_Virgilio
cd chatbot_Virgilio
npm install
```

---

## FASE 7 — Configurar `.env`

Dentro de la VM:

```bash
cd ~/chatbot_Virgilio
cp .env.example .env
nano .env
```

Pega los valores reales de tu Supabase:

```
PORT=3000
NODE_ENV=production
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGc... (la service_role)
SESSION_FOLDER=auth_session
BOT_NAME=Parroquia Bot
```

Guarda con **Ctrl+O → Enter → Ctrl+X**.

---

## FASE 8 — Primera ejecución y escaneo del QR

Aquí está el truco: si arrancas el bot y cierras el SSH, se mata el proceso. Usamos `screen` para mantenerlo vivo.

```bash
# Crear una sesión screen llamada "bot":
screen -S bot

# Dentro de la sesión, arrancar el bot:
npm start
```

Verás el QR en ASCII. **Escanéalo con el WhatsApp de la parroquia**:
- Abre WhatsApp en el celular → **Menú (3 puntos)** → **Dispositivos vinculados** → **Vincular un dispositivo** → apunta al QR de la terminal.

Cuando veas `[OK] Conectado a WhatsApp como "Parroquia Bot"`:

**Sal del screen sin matar el proceso:** presiona **`Ctrl + A`** y luego **`D`** (detach).

El bot sigue corriendo. Puedes cerrar el SSH tranquilo.

> Para volver a ver la consola: `screen -r bot`. Para listar sesiones: `screen -ls`.

**Pruébalo:** desde otro WhatsApp escríbele al número del bot. Debería responderte el menú 🙏

---

## FASE 9 — Convertirlo en servicio (arranque automático)

`screen` está bien para pruebas, pero queremos que el bot **arranque solo cuando se reinicie la VM** y se **reinicie automáticamente si se cae**. Para eso usamos **systemd**.

Primero detén el proceso de `screen`:

```bash
screen -r bot
# Dentro: Ctrl+C para detener el bot
exit  # cierra el screen
```

Ahora instala el servicio:

```bash
cd ~/chatbot_Virgilio
chmod +x deploy/install-systemd.sh
sudo bash deploy/install-systemd.sh
```

El script copia `parroquia-bot.service` a `/etc/systemd/system/`, lo habilita y lo arranca.

**Verifica que esté corriendo:**

```bash
sudo systemctl status parroquia-bot
```

Debe decir **active (running)** en verde.

**Para ver los logs en tiempo real** (como si fuera `npm start`):

```bash
sudo journalctl -u parroquia-bot -f
```

(Ctrl+C para salir del log, el bot sigue corriendo.)

---

## Comandos útiles del día a día

```bash
# Ver si está vivo:
sudo systemctl status parroquia-bot

# Ver logs en vivo:
sudo journalctl -u parroquia-bot -f

# Ver últimas 100 líneas de log:
sudo journalctl -u parroquia-bot -n 100

# Reiniciar el bot:
sudo systemctl restart parroquia-bot

# Detener el bot:
sudo systemctl stop parroquia-bot

# Probar el endpoint de salud desde la VM:
curl http://localhost:3000/status

# Probarlo desde tu PC:
curl http://IP_PUBLICA:3000/status
```

## Actualizar el código

```bash
cd ~/chatbot_Virgilio
git pull                        # o sube nuevo zip con scp
npm install                     # si cambiaron dependencias
sudo systemctl restart parroquia-bot
```

La carpeta `auth_session/` se conserva, así que **no tienes que volver a escanear el QR**.

## Si la sesión de WhatsApp se cierra

Si ves en los logs `Sesion cerrada por el usuario`:

```bash
cd ~/chatbot_Virgilio
sudo systemctl stop parroquia-bot
rm -rf auth_session
screen -S bot
npm start
# Escanea el QR de nuevo, Ctrl+A D para detach
exit  # del SSH; luego desde tu PC:
ssh -i ssh-key-XXXX.key ubuntu@IP_PUBLICA
sudo systemctl start parroquia-bot
```

---

## Resumen de costos

- ✅ VM **Always Free** de Oracle: **0 USD para siempre**.
- ✅ Tarjeta solo para verificar, retención de ~$1 USD que devuelven.
- ✅ Supabase free: **0 USD**.
- ✅ Ancho de banda: **10 TB/mes gratis** (vas a usar megas).
- ✅ Almacenamiento: **47 GB gratis**.

**Total mensual: $0.**

---

## ⚠️ Importante: no te "borren" la VM

Oracle elimina las cuentas Always Free **inactivas por más de 7 días seguidos sin login**. Para evitarlo:

- Entra al panel de Oracle **al menos cada 6 días** (con que abras la consola y mires, sirve).
- Si vas a dejar el bot mucho tiempo, configura un recordatorio en el celular cada semana.

Eso es todo. Tu bot ya vive gratis 24/7 🙏
