# 🗄️ Guía de Clonado y Despliegue de Base de Datos — SIRESA NAYARIT

Esta guía explica paso a paso cómo montar el proyecto SIRESA y regenerar su base de datos PostgreSQL desde cero en cualquier computadora.

---

## 📁 Archivos de Base de Datos Incluidos en el Repositorio

- `backend/prisma/schema.prisma`: Esquema oficial de Prisma ORM (fuente de verdad).
- `backend/prisma/seed.js`: Script de siembra para crear el usuario administrador inicial y presupuestos sectoriales.
- `backend/base_de_datos_esquema/schema.sql`: Script SQL DDL nativo para PostgreSQL (tablas, llaves primarias/foráneas, índices).

---

## 🚀 Guía de Instalación en una Nueva Computadora

### Paso 1: Clonar el Repositorio e Instalar Dependencias

```bash
# 1. Clonar el repositorio
git clone https://github.com/GaddiiHdez/SIRESA.git
cd SIRESA

# 2. Instalar dependencias del backend
cd backend
npm install

# 3. Instalar dependencias del frontend
cd ../frontend
npm install
```

---

### Paso 2: Configurar Variables de Entorno (`.env`)

#### Backend (`backend/.env`):
Crea el archivo `.env` dentro de la carpeta `backend/`:
```env
DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/siresa_nayarit?schema=public"
PORT=5000
JWT_SECRET="clave_secreta_siresa_nayarit_2026"
CORS_ORIGINS="http://localhost:5173"
```

#### Frontend (`frontend/.env`):
Crea el archivo `.env` dentro de la carpeta `frontend/`:
```env
VITE_API_URL="http://localhost:5000/api"
```

---

### Paso 3: Regenerar la Base de Datos (Elegir Método A o B)

#### ⚡ Método A: Usando Prisma ORM (Recomendado)

1. Abre la terminal en la carpeta `backend/`.
2. Sincroniza las tablas e índices en PostgreSQL:
   ```bash
   npx prisma db push
   ```
3. Siembras los datos iniciales (Usuario Admin + Presupuestos Sectoriales):
   ```bash
   npm run prisma:seed
   ```

#### 🐘 Método B: Usando Script SQL Nativo (`psql` o `pgAdmin`)

1. Crea la base de datos en PostgreSQL:
   ```sql
   CREATE DATABASE siresa_nayarit;
   ```
2. Ejecuta el archivo `schema.sql`:
   - **Desde la terminal con psql:**
     ```bash
     psql -U postgres -d siresa_nayarit -f base_de_datos_esquema/schema.sql
     ```
   - **Desde pgAdmin 4:**
     Abre `Query Tool` en la base de datos `siresa_nayarit`, pega el contenido de `backend/base_de_datos_esquema/schema.sql` y presiona **F5**.
3. Siembras los datos iniciales ejecutando `npm run prisma:seed` en la carpeta `backend`.

---

## 🔐 Credenciales Iniciales de Acceso

Una vez ejecutada la siembra (`prisma:seed`), la cuenta raíz estará lista:

- **Usuario**: `admin`
- **Contraseña**: `admin_nayarit_2026`
- **Rol**: `SUPERADMIN`

---

## 📊 Tablas Creadas en el Sistema (13 Tablas)

1. `User` - Servidores públicos y administradores con control RBAC.
2. `Solicitud` - Expedientes institucionales con folio único `SDR-NY-2026-XXXX`.
3. `Productor` - Padrón de beneficiarios (Personas Físicas, Morales y Colectivos).
4. `ApoyoControl` - Dictaminación, montos y aportaciones estatales/federales.
5. `DatosGanaderia` - Datos específicos del sector pecuario (UPP, predio).
6. `DatosAgriculturaFrijol` - Datos específicos del sector agrícola (actas, semillas).
7. `DatosPescaAcuacultura` - Registro de concesiones, embarcaciones y granjas.
8. `DatosInfraestructura` - Distritos de riego y obras comunitarias.
9. `DatosMaquinaria` - Inventario y préstamos de maquinaria pesada/agrícola.
10. `DatosMedios` - Informes y reportes de cobertura institucional.
11. `DatosTemasImportantes` - Fichas ejecutivas de atención a prioridades rurales.
12. `HistorialEstatus` - Bitácora de trazabilidad de cambios de estado.
13. `PresupuestoSector` - Techos presupuestales por sector.
