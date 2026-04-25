# mmi-place

Frontend statique Nuxt de `MMI Place`, genere en HTML/CSS/JS et connecte a Supabase via `@mmiplace/mmi-core`.

## Prerequis

- Node.js 20+
- npm
- Un projet Supabase avec son `project URL` et sa cle publique `anon`

## Configuration

1. Copier l'exemple d'environnement :

```bash
cp .env.example .env
```

2. Renseigner les variables publiques :

```env
NUXT_PUBLIC_SITE_NAME=MMI Place
NUXT_PUBLIC_SITE_DESCRIPTION=La plateforme communautaire pour les etudiants MMI.
NUXT_PUBLIC_SITE_URL=https://mmi.place
NUXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NUXT_PUBLIC_SUPABASE_ANON_KEY=your_public_anon_key
```

### A quoi servent ces variables

- `NUXT_PUBLIC_SITE_NAME` : nom affiche dans l'application et dans le manifest PWA.
- `NUXT_PUBLIC_SITE_DESCRIPTION` : description HTML/PWA.
- `NUXT_PUBLIC_SITE_URL` : URL finale du site. Sert a generer la canonical, l'URL Open Graph et le chemin de base.
- `NUXT_PUBLIC_SUPABASE_URL` : URL de ton projet Supabase.
- `NUXT_PUBLIC_SUPABASE_ANON_KEY` : cle publique `anon` de Supabase.

Les anciennes variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` restent acceptees pour compatibilite, mais la config recommandee est `NUXT_PUBLIC_*`.

## Developpement

```bash
npm install
npm run dev
```

## Generation statique

```bash
npm run build
```

Le site genere est disponible dans `.output/public`.

Pour le previsualiser localement :

```bash
npm run preview
```

## Deploiement

Comme le projet est un site statique, il n'y a pas besoin de Docker.

Tu peux deployer le contenu de `.output/public` sur n'importe quel hebergeur statique :

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
- un serveur Nginx/Apache classique

## CI

Le workflow GitHub Actions lance simplement :

```bash
npm ci
npm run build
```

Cela permet de verifier que la generation statique reste fonctionnelle sur `main`.
