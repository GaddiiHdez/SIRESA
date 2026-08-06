# SIRESA — Sistema de Registro de Información de la Secretaría de Desarrollo Rural de Nayarit

Sistema web de digitalización y gestión de expedientes de solicitudes de apoyo rural.

---

## Estructura del Proyecto

```
Dev/
├── backend/                   ← API REST (Node.js + Express + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma      ← Modelos de base de datos
│   │   └── seed.js            ← Datos iniciales (usuario admin y presupuestos)
│   ├── src/
│   │   ├── server.js          ← Punto de entrada del servidor
│   │   ├── modules/           ← Módulos de negocio (Feature-Based Architecture)
│   │   │   ├── auth/          ← Login y autenticación JWT
│   │   │   ├── catalogos/     ← Municipios y catálogos del sistema
│   │   │   ├── presupuestos/  ← Presupuestos sectoriales
│   │   │   ├── solicitudes/   ← CRUD de expedientes (módulo principal)
│   │   │   ├── upload/        ← Subida de archivos PDF/imágenes
│   │   │   └── users/         ← Gestión de usuarios del sistema
│   │   └── shared/
│   │       ├── config/        ← Configuración (base de datos, catálogos)
│   │       ├── middleware/     ← Auth JWT, RBAC, validación, errores
│   │       └── utils/         ← Logger y utilidades compartidas
│   └── base_de_datos_esquema/ ← Documentación de la BD (SQL, README)
│
└── frontend/                  ← SPA React (Vite + React Router)
    └── src/
        ├── App.jsx            ← Enrutamiento principal y guardias de ruta
        ├── main.jsx           ← Punto de entrada de React
        ├── modules/           ← Páginas y componentes por dominio
        │   ├── admin/         ← Gestión de usuarios (SUPERADMIN/ADMIN)
        │   ├── agricultura/   ← Formulario de Agricultura Frijol
        │   ├── auth/          ← Página de Login
        │   ├── contingencias/ ← Formulario de Temas Importantes
        │   ├── dashboard/     ← Dashboard y Estadísticas
        │   ├── ganaderia/     ← Formulario de Ganadería
        │   ├── infraestructura/ ← Formulario de Infraestructura
        │   ├── maquinaria/    ← Formulario de Maquinaria
        │   ├── medios/        ← Formulario de Medios de Comunicación
        │   ├── pesca/         ← Formulario de Pesca y Acuacultura
        │   ├── productores/   ← Padrón de productores con mapa
        │   └── solicitudes/   ← Consulta y registro de expedientes
        └── shared/
            ├── components/    ← Componentes reutilizables (Toast, Modal, etc.)
            ├── config/        ← Catálogos y metadata de sectores
            ├── hooks/         ← Custom React Hooks
            ├── layouts/       ← SidebarLayout (estructura principal de la app)
            ├── services/      ← api.js (todas las llamadas al backend)
            ├── styles/        ← CSS global
            └── utils/         ← Funciones utilitarias del frontend
```

---

## Stack Tecnológico

| Capa | Tecnología | Función |
|:---|:---|:---|
| Frontend | React 19 + Vite | Interfaz de usuario SPA |
| Estilos | CSS + Tailwind | Diseño y animaciones |
| Mapas | Leaflet + React-Leaflet | Mapa interactivo de Nayarit |
| Gráficas | Recharts | Dashboard estadístico |
| Backend | Node.js + Express | API REST |
| ORM | Prisma 7 | Acceso a base de datos |
| Base de Datos | PostgreSQL | Almacenamiento de datos |
| Autenticación | JWT + bcrypt | Seguridad de sesiones |
| Validación | Zod | Validación de datos de entrada |
| Archivos | Multer | Subida de documentos PDF/imágenes |

---

## Arquitectura

```
Frontend React (SPA) ──HTTP/REST──▶ Backend Express (API) ──Prisma──▶ PostgreSQL
     Vercel / Railway               Railway                            Neon / Railway
```

**Patrón de arquitectura:** Three-Tier + Feature-Based Modules + RBAC

---

## Roles del Sistema

| Rol | Permisos |
|:---|:---|
| `SUPERADMIN` | Acceso total. Gestión de todos los usuarios incluidos otros SUPERADMINs |
| `ADMINISTRADOR` | Gestión operativa completa. No puede gestionar SUPERADMINs |
| `FUNCIONARIO` | Registro y seguimiento de expedientes |
| `ANALISTA` | Solo lectura y consulta. Sin acceso a escritura |

---

## Instalación y Desarrollo Local

### Prerrequisitos
- Node.js 18+
- PostgreSQL (o Docker con docker-compose)

### Backend
```bash
cd backend
cp .env.example .env     # Configurar variables de entorno
npm install
npm run prisma:push      # Crear tablas en la BD
npm run prisma:seed      # Crear usuario admin y presupuestos
npm run dev              # Iniciar servidor en http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
# Crear .env con VITE_API_URL=http://localhost:5000/api
npm run dev              # Iniciar app en http://localhost:5173
```

### Con Docker
```bash
docker-compose up -d     # Levanta backend + PostgreSQL
```

---

## Credenciales de Acceso (Desarrollo)

```
Usuario: admin
Contraseña: admin_nayarit_2026
```

> ⚠️ **IMPORTANTE:** Cambiar la contraseña en producción inmediatamente después del deploy.

---

## Variables de Entorno

### Backend (`.env`)
| Variable | Descripción | Ejemplo |
|:---|:---|:---|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT | Cadena aleatoria segura |
| `CORS_ORIGINS` | Orígenes permitidos para CORS | `https://mi-frontend.vercel.app` |
| `PORT` | Puerto del servidor (Railway lo asigna automáticamente) | `5000` |
| `NODE_ENV` | Entorno de ejecución | `production` o `development` |

### Frontend (`.env`)
| Variable | Descripción | Ejemplo |
|:---|:---|:---|
| `VITE_API_URL` | URL base del backend | `https://mi-backend.railway.app/api` |
