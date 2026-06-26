#!/usr/bin/env bash
# ============================================================
#  install-systemd.sh
#  Instala el servicio systemd para que el bot arranque solo
#  con el servidor y se reinicie si se cae.
#
#  Ejecuta este script DESPUES de:
#    - clonar el proyecto en /home/ubuntu/chatbot_Virgilio
#    - npm install
#    - configurar .env
#    - haber escaneado el QR una vez con `screen` + `npm start`
# ============================================================
set -euo pipefail

SERVICE_FILE="/etc/systemd/system/parroquia-bot.service"
SOURCE_FILE="$(dirname "$0")/parroquia-bot.service"

if [ ! -f "$SOURCE_FILE" ]; then
  echo "ERROR: no encontre $SOURCE_FILE"
  exit 1
fi

echo ">>> Copiando unidad systemd a $SERVICE_FILE..."
sudo cp "$SOURCE_FILE" "$SERVICE_FILE"

echo ">>> Recargando systemd..."
sudo systemctl daemon-reload

echo ">>> Habilitando el servicio para que arranque con el sistema..."
sudo systemctl enable parroquia-bot

echo ">>> Iniciando el servicio..."
sudo systemctl restart parroquia-bot

sleep 2

echo ""
echo "============================================================"
echo "  Servicio instalado. Comandos utiles:"
echo ""
echo "    Ver estado:    sudo systemctl status parroquia-bot"
echo "    Ver logs:      sudo journalctl -u parroquia-bot -f"
echo "    Reiniciar:     sudo systemctl restart parroquia-bot"
echo "    Detener:       sudo systemctl stop parroquia-bot"
echo "    Deshabilitar:  sudo systemctl disable parroquia-bot"
echo "============================================================"

sudo systemctl status parroquia-bot --no-pager || true
