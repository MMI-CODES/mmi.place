# 🏠 mmi.place

Portail étudiant pour le département **MMI** de l'IUT de Vélizy-Rambouillet (UVSQ, Université Paris-Saclay).

Centralise les outils, le planning, les annonces et les ressources utiles aux étudiants — le tout dans une **PWA installable** avec authentification centralisée et préférences synchronisées dans le cloud.

## ⚡ Stack technique

| Couche | Technologie |
|---|---|
| Framework | [Nuxt 4](https://nuxt.com) (Vue 3, Nitro) |
| Base de données | [PostgreSQL 17](https://postgresql.org) via [Prisma ORM 7](https://prisma.io) |
| Authentification | OIDC ([Authentik](https://goauthentik.io)) — Authorization Code + Silent Auth |
| Planning | [Celcat](https://www.celcat.com) via le package [`celcat`](https://www.npmjs.com/package/celcat) |
| Contenu | [@nuxt/content](https://content.nuxt.com) (blog, pages légales) |
| Styling | [TailwindCSS 4](https://tailwindcss.com) |
| PWA | [@vite-pwa/nuxt](https://vite-pwa-org.netlify.app/frameworks/nuxt) |
| Animations | [motion-v](https://motion.vueuse.org) |

## ✨ Fonctionnalités

- 🔧 **Catalogue d'outils** — Organisés par catégories (officiels, étudiants, ressources) avec épingles personnalisées et recherche intégrée dans la barre de navigation
- 📅 **Widget Vencat** — Affiche le prochain cours depuis Celcat, configurable par groupe MMI
- 📢 **Publications** — Système de messages multi-canaux avec rotation automatique, marquage lu et expiration programmable
- 🔐 **Authentification OIDC** — Login via Authentik avec rôles (`STUDENT`, `CONTRIBUTOR`, `MANAGER`, `ADMIN`) synchronisés depuis les groupes OIDC et Silent Auth automatique
- 🛠️ **Panel d'administration** — Gestion des outils, canaux et publications (réservé ADMIN/MANAGER)
- ☁️ **Préférences cloud** — Stockage hybride : LocalStorage (UI rapide) + Cookie partagé (groupes cross-domaine) + Base de données (sync entre appareils)
- 🏷️ **Versioning de config** — Migration automatique des préférences utilisateur (`v1.2`) sans perte de données
- 📲 **PWA installable** — Service Worker, cache offline, bouton d'installation natif dans la barre de navigation
- ♿ **Accessibilité** — Thème clair/sombre, contraste élevé, police Open Dyslexic, taille de texte configurable

## 📋 Prérequis

- **Node.js** 22+ (LTS)
- **PostgreSQL** 15+
- **Authentik** — instance OIDC configurée avec une application OAuth2/OIDC

## 🚀 Installation rapide

```bash
# 1. Cloner le dépôt
git clone https://github.com/mmi-place/mmi.place
cd mmi.place

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
# → Éditer .env avec vos valeurs (voir section Configuration)

# 4. Initialiser la base (génère le client Prisma, crée les tables, seed)
npm run setup

# 5. Lancer le serveur de développement
npm run dev
```

L'application est disponible sur **http://localhost:3000**

## ⚙️ Configuration

Copier `.env.example` → `.env` et renseigner les valeurs :

| Variable | Description | Obligatoire |
|---|---|---|
| `DATABASE_URL` | URL de connexion PostgreSQL | ✅ |
| `DATABASE_DIRECT_URL` | URL directe (bypass pooler) | ❌ |
| `AUTHENTIK_ISSUER` | URL de base Authentik (sans `/`) | ✅ |
| `AUTHENTIK_CLIENT_ID` | Client ID OIDC | ✅ |
| `AUTHENTIK_CLIENT_SECRET` | Client Secret OIDC | ✅ |
| `AUTHENTIK_REDIRECT_URI` | URL de callback (`/api/auth/callback`) | ✅ |
| `AUTHENTIK_SESSION_SECRET` | Secret cookies de session (min 32 chars) | ✅ |
| `CELCAT_URL` | URL du backend Celcat | ✅ |

> **Générer un secret de session :**
> ```bash
> openssl rand -hex 32
> ```

## 🛠️ Développement local

### Option A : PostgreSQL via Docker (recommandé)

```bash
docker run -d --name mmiplace-db \
  -e POSTGRES_USER=mmiplace \
  -e POSTGRES_PASSWORD=mmiplace \
  -e POSTGRES_DB=mmiplace \
  -p 5432:5432 \
  postgres:17-alpine
```

> **PowerShell** : remplacer les `\` par des backticks `` ` ``.

Puis dans votre `.env` :
```env
DATABASE_URL="postgresql://mmiplace:mmiplace@localhost:5432/mmiplace"
```

### Option B : Docker Compose (app + DB)

```bash
# Lance l'app Nuxt + PostgreSQL
docker compose up --build

# Initialiser la base (première fois uniquement)
docker compose --profile setup run setup
```

### Commandes utiles

```bash
npm run dev          # Serveur de développement (http://localhost:3000)
npm run setup        # Génère Prisma + crée les tables + seed
npm run seed         # Re-peuple la base de données
npm run build        # Build de production
npm run preview      # Prévisualiser le build de production
```

## 🐳 Docker

### Dockerfile

Build multi-stage optimisé :
1. **Stage `builder`** — `npm ci`, `prisma generate`, `nuxt build`
2. **Stage `runner`** — Image minimale Node Alpine avec uniquement le dossier `.output` et les fichiers Prisma pour les migrations runtime

```bash
docker build -t mmi-place .
docker run -p 3000:3000 --env-file .env mmi-place
```

### Docker Compose

Le `compose.yaml` inclut :
- **`app`** — L'application Nuxt (port 3000)
- **`db`** — PostgreSQL 17 Alpine (port 5432, volume nommé `pgdata`)
- **`setup`** (profil `setup`) — Service one-shot pour initialiser la DB

```bash
# Démarrer l'app + la DB
docker compose up -d

# Initialiser la base de données (première fois)
docker compose --profile setup run setup

# Voir les logs
docker compose logs -f app
```

## 🚢 Déploiement (CI/CD)

Le workflow GitHub Actions (`.github/workflows/deploy.yml`) :
1. Build l'image Docker multi-arch (`linux/amd64` + `linux/arm64`)
2. Push sur **GitHub Container Registry** (`ghcr.io`)
3. Tags automatiques : `latest` (branche main), `sha-<commit>`, nom de branche

```bash
docker pull ghcr.io/mmi-place/mmi.place:latest
```

## 📁 Structure du projet

```
├── app/                    # Code client (Nuxt)
│   ├── assets/             # CSS, fonts
│   ├── components/         # Composants Vue
│   │   ├── cards/          # Widgets Header (Vencat, Messages, PlanUP)
│   │   └── layout/         # Navbar, Header, Footer, ToolRow
│   ├── composables/        # useSession, useTools, useSettings, useMessages…
│   ├── middleware/          # silent-auth.global.ts (OIDC auto-login)
│   ├── pages/              # Pages (routing automatique)
│   └── utils/              # Utilitaires client
├── content/                # Contenu Markdown (@nuxt/content)
│   ├── blog/               # Articles de blog
│   └── legal/              # Pages légales
├── prisma/                 # Prisma ORM
│   ├── schema.prisma       # Schéma de la base de données
│   ├── seed.ts             # Script de seed
│   └── data/               # Données initiales (modules…)
├── public/                 # Assets statiques (favicon, logos, icons PWA)
├── server/                 # Code serveur (Nitro)
│   ├── api/
│   │   ├── auth/           # Login, callback, session, logout OIDC
│   │   ├── channels/       # CRUD canaux de messagerie
│   │   ├── me/             # Préférences utilisateur (GET/POST settings)
│   │   ├── messages/       # CRUD messages (création, édition, suppression)
│   │   ├── services/       # Planning Celcat, modules
│   │   └── tools/          # CRUD outils
│   ├── routes/             # Routes serveur (redirections /go/*)
│   └── utils/              # DB connection, OIDC session handler
├── shared/                 # Code partagé client/serveur
│   ├── sample.ts           # Paramètres par défaut (version 1.2)
│   └── types/              # Types TypeScript partagés (Settings…)
├── .env.example            # Template des variables d'environnement
├── compose.yaml            # Docker Compose (app + DB + setup)
├── Dockerfile              # Multi-stage Docker build
├── nuxt.config.ts          # Configuration Nuxt + PWA
├── prisma.config.ts        # Configuration Prisma
└── package.json            # Dépendances et scripts
```

## 📜 Scripts npm

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run preview` | Prévisualiser le build |
| `npm run setup` | Prisma generate + db push + seed |
| `npm run seed` | Peupler la base de données |
| `npm run postinstall` | Générer types Nuxt + client Prisma |

## 🔐 Rôles & Permissions

| Rôle | Accès |
|---|---|
| `STUDENT` | Consulter les outils, le planning, les messages |
| `CONTRIBUTOR` | + Ajouter des outils |
| `MANAGER` | + Gérer les outils et publier des messages |
| `ADMIN` | Accès total (automatique via groupe OIDC `admins`) |

Les rôles sont synchronisés automatiquement depuis les **groupes Authentik** lors de chaque connexion.

## 📄 Licence

Projet développé par les étudiants MMI de l'IUT de Vélizy-Rambouillet.
