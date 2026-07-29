# --- Etapa 1: Build ---
FROM node:20-alpine AS build

WORKDIR /app

# Copiar manifiestos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Argumento de construcción para la URL de la API
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Compilar assets de Vite para producción
RUN npm run build

# --- Etapa 2: Servidor Web Producción ---
FROM nginx:1.25-alpine

# Copiar archivos compilados
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuración de Nginx para soportar React Router (HTML5 History Mode)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto estándar HTTP
EXPOSE 80

# Iniciar servidor Nginx
CMD ["nginx", "-g", "daemon off;"]
