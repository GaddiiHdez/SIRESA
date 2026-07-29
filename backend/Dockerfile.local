FROM node:20-alpine

WORKDIR /app

# Instalar dependencias esenciales si es necesario
RUN apk add --no-cache openssl

# Copiar manifiestos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm install

# Copiar el esquema de base de datos para la generación del cliente
COPY prisma ./prisma/

# Generar el cliente de Prisma
RUN npx prisma generate

# Copiar el resto del código fuente del backend
COPY . .

# Exponer el puerto
EXPOSE 5000

# Comando para actualizar esquema de base de datos, sembrar datos básicos e iniciar
CMD ["sh", "-c", "npx prisma db push && node prisma/seed.js && npm start"]
