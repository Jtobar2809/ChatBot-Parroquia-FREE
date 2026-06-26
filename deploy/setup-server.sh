#!/usr/bin/env bash
# ============================================================
#  setup-server.sh
#  Script de preparacion del servidor Ubuntu en Oracle Cloud.
#  Lo ejecutas UNA SOLA VEZ tras conectarte por SSH.
# ============================================================
set -euo pipefail

echo ">>> Actualizando paquetes del sistema..."
sudo apt-get update -y
sudo apt-get upgrade -y

echo ">>> Instalando dependencias base..."
sudo apt-get install -y curl git build-essential ufw screen

echo ">>> Instalando Node.js 20 LTS (via NodeSource)..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

echo ">>> Verificando versiones..."
node -v
npm -v

echo ">>> Configurando firewall basico..."
sudo ufw allow OpenSSH
sudo ufw allow 3000/tcp
sudo ufw --force enable

echo ">>> ABRIENDO PUERTO EN IPTABLES (Oracle usa iptables ademas de ufw)..."
# Oracle Ubuntu trae iptables muy restrictivo por defecto.
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT || true
sudo netfilter-persistent save || sudo iptables-save | sudo tee /etc/iptables/rules.v4 >/dev/null || true

echo ""
echo "============================================================"
echo "  Servidor listo. Siguiente paso:"
echo "    1) git clone <tu-repo>  (o sube el codigo con scp)"
echo "    2) cd chatbot_Virgilio && npm install"
echo "    3) cp .env.example .env  &&  nano .env"
echo "    4) Primera ejecucion para escanear QR:"
echo "         screen -S bot"
echo "         npm start"
echo "         (escanea el QR, luego Ctrl+A D para 'detach')"
echo "    5) Luego instala el servicio systemd:"
echo "         sudo bash deploy/install-systemd.sh"
echo "============================================================"
