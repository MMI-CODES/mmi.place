FROM node:20-alpine AS builder
WORKDIR /workspace
COPY . .
WORKDIR /workspace/mmi-place
RUN npm ci
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NITRO_PORT=3000

COPY --from=builder /workspace/mmi-place/.output ./.output
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
