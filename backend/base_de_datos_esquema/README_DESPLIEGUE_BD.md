# 🗄️ Guía de Generación y Despliegue de Base de Datos - SIRESA NAYARIT

Esta carpeta contiene el **Esquema Estructurado Completo** de la Base de Datos del **Sistema de Registro de Solicitudes de Apoyo (SIRESA)** de la Secretaría de Desarrollo Rural del Estado de Nayarit.

Puedes utilizar cualquiera de las **dos opciones** a continuación para desplegar o regenerar la base de datos completa en cualquier otra computadora o servidor PostgreSQL.

---

## 📁 Archivos Incluidos en esta Carpeta

* `schema.prisma`: Esquema oficial de Prisma ORM (versión 7+).
* `schema.sql`: Script SQL nativo completo en PostgreSQL (con tablas, llaves foráneas, índices de búsqueda e inserciones iniciales).
* `seed.js`: Script de siembra para Node.js/Prisma.
* `README_DESPLIEGUE_BD.md`: Esta guía técnica de despliegue paso a paso.

---

## 🚀 OPCIÓN 1: Generación Directa mediante Prisma ORM (Recomendado)

Ideal si vas a instalar el proyecto Node.js/Backend en la otra computadora.

### Pasos:
1. Copia el archivo `schema.prisma` a la carpeta `prisma/` de tu proyecto backend en la nueva PC.
2. Asegúrate de configurar la variable de entorno `DATABASE_URL` en tu archivo `.env`:
   ```env
   DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/nombre_bd?schema=public"
   ```
3. Ejecuta en la terminal dentro de la carpeta `backend`:
   ```bash
   # Genera la estructura de tablas e índices automáticamente
   npx prisma db push

   # (Opcional) Si deseas ejecutar la siembra de usuarios iniciales y presupuestos
   npx prisma db seed
   ```

---

## 🐘 OPCIÓN 2: Generación Directa vía Script SQL Nativo (pgAdmin / psql)

Ideal si deseas crear la base de datos directamente en PostgreSQL sin necesidad de ejecutar Node.js o Prisma.

### Método A (Desde la terminal con psql):
```bash
# 1. Crear la base de datos
createdb -U postgres siresa_nayarit

# 2. Ejecutar el script SQL completo
psql -U postgres -d siresa_nayarit -f schema.sql
```

### Método B (Desde pgAdmin 4):
1. Abre **pgAdmin** en la nueva PC y conéctate a tu servidor PostgreSQL.
2. Crea una nueva base de datos llamada `siresa_nayarit`.
3. Haz clic derecho sobre la nueva base de datos y selecciona **Query Tool** (Herramienta de Consultas).
4. Abre el archivo `schema.sql`, copia su contenido y pégalo en el editor.
5. Haz clic en **Ejecutar (F5)**.

---

## 🔐 Credenciales Iniciales Creadas por Defecto

Tanto el script SQL como la siembra creará el usuario administrador oficial:

* **Usuario**: `admin`
* **Contraseña por defecto**: `admin_nayarit_2026` (o `admin123` según entorno)
* **Rol**: `ADMINISTRADOR`

---

## 📊 Módulos y Tablas Creadas (13 Tablas)

1. `User` - Servidores públicos y administradores.
2. `Solicitud` - Expedientes institucionales con folio único `SDR-NY-2026-XXXX`.
3. `Productor` - Padrón de beneficiarios (Personas Físicas, Morales y Colectivos).
4. `ApoyoControl` - Dictaminación, montos y aportaciones estatales/federales.
5. `DatosGanaderia` - Datos específicos del sector pecuario (UPP, predio).
6. `DatosAgriculturaFrijol` - Datos específicos del sector agrícola (actas, variedades).
7. `DatosPescaAcuacultura` - Registro de concesiones, embarcaciones y granjas acuícolas.
8. `DatosInfraestructura` - Distritos de riego y obras comunitarias.
9. `DatosMaquinaria` - Inventario y préstamos de maquinaria pesada/agrícola.
10. `DatosMedios` - Informes y reportes de cobertura institucional.
11. `DatosTemasImportantes` - Fichas ejecutivas de atención a prioridades rurales.
12. `HistorialEstatus` - Bitácora de trazabilidad de cambios de estado.
13. `PresupuestoSector` - Techos presupuestales por sector.
