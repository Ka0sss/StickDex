# syntax=docker/dockerfile:1

########## Etapa 1: dependencias y compilación ##########
FROM node:22-slim AS build

WORKDIR /app

# Prisma necesita OpenSSL en la imagen base de Debian.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

########## Etapa 2: ejecución ##########
FROM node:22-slim AS runtime

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY --from=build /app/dist ./dist

RUN mkdir -p uploads

ENV PORT=3000
EXPOSE 3000

# Aplica las migraciones pendientes y arranca el servidor.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
