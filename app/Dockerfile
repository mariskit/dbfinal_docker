# 1. Builder
FROM node:18 AS builder

WORKDIR /app

# Solo copiamos package.json y lock para usar cache
COPY package*.json ./

# Esto se cachea y es MUCHO más rápido
RUN npm ci --omit=dev

# Ahora copiar todo el proyecto
COPY . .

# Build productivo
RUN npm run build

# 2. Runtime final
FROM node:18-slim AS runner

WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

CMD ["npm", "start"]
