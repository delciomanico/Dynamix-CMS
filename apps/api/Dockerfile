FROM node:26.12.1-bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

FROM node:26.12.1-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
ARG APP_VERSION=dev
ENV NODE_ENV=production APP_VERSION=$APP_VERSION
WORKDIR /app
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
# Ficheiros dos seeds de sites (carregados para a Media Library no 1.º deploy)
COPY --from=build /app/seed-assets ./seed-assets
USER node
EXPOSE 3001
# As migrações/seed correm no serviço one-shot `migrate` (node dist/predeploy.js) antes de a API arrancar
CMD ["node", "dist/main"]
