# Despliegue continuo (dev → main → Oracle)

Flujo de ramas:

- **`dev`**: rama de trabajo. Aquí desarrollas y pruebas. Empujar a `dev` NO despliega nada.
- **`main`**: rama de producción. Cada push/merge a `main` dispara la GitHub Action
  `.github/workflows/deploy.yml`, que entra por SSH a la VM de Oracle, hace
  `git reset --hard origin/main`, reinstala dependencias y reinicia el servicio.

> `git reset --hard` solo toca archivos versionados. Tu `.env` y tu carpeta
> `auth_session/` viven en la VM, están en `.gitignore` y **no se borran** en cada
> despliegue: no tienes que volver a escanear el QR.

## Día a día

```bash
git checkout dev
# ...trabajas, haces commits...
git push origin dev

# cuando esté listo para producción:
git checkout main
git merge dev
git push origin main   # <-- esto despliega solo
```

---

## Configuración (una sola vez, cuando la VM ya exista)

### 1. Dar acceso a la VM al repo privado (deploy key)

Dentro de la VM (por SSH):

```bash
ssh-keygen -t ed25519 -C "deploy-oracle" -f ~/.ssh/github_deploy -N ""
cat ~/.ssh/github_deploy.pub
```

Copia esa clave pública y en GitHub ve a:
**Repo → Settings → Deploy keys → Add deploy key** → pégala, título `oracle-vm`,
deja "Allow write access" **desmarcado** (solo lectura). Guarda.

Configura git en la VM para usar esa llave y clona:

```bash
cat >> ~/.ssh/config <<'EOF'
Host github.com
  IdentityFile ~/.ssh/github_deploy
  IdentitiesOnly yes
EOF

cd ~
git clone git@github.com:TU-USUARIO/chatbot_Virgilio.git
```

### 2. Secretos de la GitHub Action

En GitHub: **Repo → Settings → Secrets and variables → Actions → New repository secret**.
Crea estos tres:

| Secreto    | Valor |
|------------|-------|
| `SSH_HOST` | La IP pública de la VM de Oracle |
| `SSH_USER` | `ubuntu` |
| `SSH_KEY`  | El **contenido completo** de tu llave privada de Oracle (`ssh-key-XXXX.key`), incluyendo las líneas `-----BEGIN...` y `-----END...` |

> `SSH_KEY` es la misma llave privada con la que tú entras por SSH a la VM
> (la que descargaste al crear la instancia), NO la deploy key del paso 1.

### 3. Probar

- Manual: pestaña **Actions → Deploy a Oracle Cloud → Run workflow**.
- Automático: haz cualquier push a `main` y míralo correr en la pestaña Actions.
