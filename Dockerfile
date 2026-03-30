# syntax=docker/dockerfile:1
ARG NODE_VERSION=24.12.0
FROM node:${NODE_VERSION}-alpine

ENV NODE_ENV=production
WORKDIR /usr/src/app

# Copier les fichiers essentiels pour npm ci et postinstall
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY nuxt.config.ts ./

# Installer les dépendances (postinstall pourra générer Prisma)
RUN npm ci --omit=dev

# Copier le reste du code
COPY . .

# Expose port
EXPOSE 3000

# User non-root
USER node

# Build Nuxt (génère .output)
RUN npm run build

# Run server
CMD ["node", ".output/server/index.mjs"]
