FROM node:18-alpine

WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache libc6-compat

# Copiar archivos de dependencias primero para mejor caching
COPY package*.json ./

# Instalar todas las dependencias
RUN npm ci --legacy-peer-deps

# Copiar el resto de los archivos
COPY . .

# Exponer el puerto
EXPOSE 3000

# Variables de entorno para Next.js
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# Aumentar límites de memoria de Node.js
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Comando por defecto con mejor manejo de señales y reinicio automático
CMD ["sh", "-c", "trap 'exit 0' SIGTERM SIGINT; npm run dev & wait"]
