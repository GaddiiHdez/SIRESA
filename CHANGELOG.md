# Bitácora de Cambios y Control de Versiones — SIRESA
**Sistema de Registro de Información de la Secretaría de Desarrollo Rural de Nayarit**

Todas las modificaciones, actualizaciones, correcciones y nuevas funcionalidades del sistema quedan registradas en este documento bajo la especificación [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y siguiendo [Semantic Versioning](https://semver.org/).

---

## Estrategia de Versionado (SemVer)
* **MAJOR (X.0.0):** Cambios incompatibles en la API, reestructuración mayor de arquitectura o lanzamiento de nuevos módulos principales.
* **MINOR (0.X.0):** Nuevas funcionalidades o módulos compatibles hacia atrás.
* **PATCH (0.0.X):** Correcciones de errores (bugs), parches de seguridad o pequeñas mejoras de UI/UX.

---

## [Unreleased] — Trabajo en Proceso
### Planificado para Septiembre - Diciembre 2026
- **Módulo de Reportes Avanzados:** Exportación masiva en Excel/PDF de expedientes y dictámenes.
- **Notificaciones Automáticas:** Alertas vía correo/SMS de estatus de solicitudes a productores.
- **Firma Digital de Expedientes:** Integración de firma electrónica para analistas y supervisores.
- **Auditoría Avanzada:** Log de traza de acciones por usuario en tiempo real.

---

## [1.2.1] — 2026-08-28 (Versión Actual en Producción)
### Seguridad & Hardening
- **CORS Estricto:** Eliminada la excepción wildcard de `*.vercel.app` en `server.js`. Las peticiones ahora se restringen estrictamente a los orígenes declarados en `CORS_ORIGINS`.
- **Inspección de Esquema y Sanitización:** Eliminado campo no declarado `indigo` en `solicitudService.js`.

### Rendimiento & Base de Datos
- **Índice en RFC:** Añadido `@@index([rfc])` en el modelo `Productor` (`schema.prisma`) para agilizar consultas cruzadas y validaciones de duplicidad.
- **Deduplicación Paginada por Lotes:** `autoDeduplicateProductores()` refactorizado para procesar en lotes de 500 registros (`take/skip`), eliminando picos de consumo de RAM al arranque del servidor.
- **Buscador Navbar Lazy con Debounce:** `BuscadorNavbar.jsx` optimizado para consultar al backend tras un debounce de 300ms solo al escribir $\ge 3$ caracteres, eliminando la carga masiva en `focus`.

### Gestión Presupuestal & Analítica Financiera
- **Panel de Configuración de Presupuestos:** Modal interactiva `AjustarPresupuestoModal.jsx` con cálculo de suma estatal en tiempo real, carga de montos sugeridos y guardado atómico en lote.
- **Estado 'Sin Configurar' y Banner Guía:** Banner informativo en `SectoresPresupuesto.jsx` que alerta y orienta a los administradores cuando los 5 sectores no cuentan con techos asignados.
- **Habilitación de Permisos RBAC:** Corrección del control de permisos para permitir a `SUPERADMIN` y `ADMINISTRADOR` configurar presupuestos desde el header, tarjetas individuales y navbar.
- **Controlador Robusto con Upsert y Limpieza de Caché:** `presupuestoController.js` mejorado con `prisma.presupuestoSector.upsert` e invalidación inmediata de caché de estadísticas.

### Gestión Documental & Expedientes
- **Auto-guardado Inmediato de Documentos:** `ExpedienteDetalleModal.jsx` y `apiActualizarDocumentos` corregidos para sincronizar y persistir automáticamente cualquier documento digitalizado en la base de datos de PostgreSQL al momento de subirlo.
- **Normalización de Payload en Backend:** `solicitudService.js`, `solicitudController.js` y `solicitudSchemas.js` adaptados para soportar payloads directos o anidados en `PATCH /api/solicitudes/:id/documentos` con invalidación de caché.
- **Feedback & Trazabilidad UX:** Toasts de confirmación descriptivos al cargar cada archivo (`✓ [Documento] cargado y guardado en el expediente`) y mensaje de cierre de expediente, con sincronización de tablas en tiempo real vía eventos globales.
- **Resolución de Carga Infinita en Drawer:** Corrección de la prop `sectorKey` vs `sector` en `DrawerLateralSector.jsx` y manejo seguro de estados de carga y relaciones en `DrawerLateralProductores.jsx`.
- **Centro de Alertas & Notificaciones Inteligente:** `CentroNotificacionesMenu.jsx` rediseñado con soporte de pestañas (*Todas*, *Por Dictaminar*, *Docs Faltantes*), resolución correcta de nombres de productores físicos y morales, insignias por sector con color institucional, indicador de documentos faltantes y botón de enlace directo a la consulta de expedientes.
- **Herramienta de Ruta de Campo SEDER (Geodirectorio):** Añadido generador de itinerarios de visita de campo (`GeodirectorioPage.jsx`) para exportar contactos, domicilios, teléfonos, predios/UPPs y enlaces de navegación GPS directos a Google Maps (en formato Excel/CSV con BOM UTF-8) por municipio o nivel estatal.
- **Navegación GPS In-Situ & Corrección de Capas:** Botón de navegación directa a Google Maps en `FichaContactoDrawer.jsx` y ajuste de jerarquía de capas z-index (`z-[9999]` en menú de notificaciones vs `z-20` en visor de mapa) para eliminar superposición visual.
- **Selector y Validador Cartográfico de Coordenadas (`SelectorUbicacionMapa.jsx`):** Componente interactivo para formularios de solicitudes con mini-mapa satelital Esri, conversión automática de grados sexagesimales (DMS) a decimales, validación estricta de Bounding Box de Nayarit y botón de captura de posición GPS del sensor del dispositivo móvil/tablet.
- **Interconexión Cartográfica Bidireccional:** Enlace directo desde el mapa de calor de Estadísticas (`MapaNayaritReal.jsx`) para explorar puntos micro en Geodirectorio por municipio, y botón de retorno a analítica municipal desde Geodirectorio.

### Calidad de Código & Trazabilidad
- **Logging Estructurado con Winston:** Migradas todas las llamadas directas de `console.error` y `console.log` a `logger.error` / `logger.info` con metadatos JSON estructurados en `authController.js`, `userController.js` y `solicitudService.js`.
- **Insignia de Versión en Login:** Visualización dinámica de la versión actual del sistema en la pantalla de inicio de sesión (`LoginPage.jsx`).

---

## [1.2.0] — 2026-08-25
### Añadido
- **Módulo de Geodirectorio Rural:** Buscador dinámico de productores con fichas de contacto y geolocalización en mapa interactivo de Nayarit (`053eed4`).
- **Mesa de Control Financiera:** Consolidación de estadísticas presupuestales por sector productivo y semaforización de inversión (`9ec6b0a`).
- **Control Estricto de Unicidad:** Desduplicación automática de productores validada por CURP y RFC a nivel base de datos y backend (`ea0c3cd`).

### Modificado
- **Responsividad y UX del Navbar:** Ajuste de truncamiento de texto, alineación de elementos y comportamiento en pantallas móviles (`9d287d7`).
- **Diseño del Hero:** Eliminación de barra de búsqueda redundante y mejora sustancial de contraste e imágenes de fondo (`72c2853`, `e2d7a6a`).

### Infraestructura & Deploy
- Estrategia de `prisma push` y autodeduplicación integrada en el pipeline de despliegue en Railway (`5a99837`).

---

## [1.1.0] — 2026-08-15
### Añadido
- **Seguridad y Expiración de Sesión:** Modal interactivo de advertencia de expiración de token JWT con opción de renovación en tiempo real (`8cba566`).
- **Auditoría de Seguridad Backend:** Validaciones de entrada adicionales con Zod y sanitización de payloads HTTP (`1bcdd9d`).

### Documentación
- Creación de documentación detallada del esquema SQL PostgreSQL (`schema.sql`) y guía paso a paso de clonado/despliegue local (`64ec668`).
- Reorganización de comentarios técnicos y limpieza de módulos (`d5454e9`).

---

## [1.0.0] — 2026-07-29 (Lanzamiento de Versión Base)
### Añadido
- **Carga Consolidada de Código Base (Initial Commit):** Carga inicial de 117 archivos del proyecto (`fee029f`).
- **Módulo de Autenticación y RBAC:** Sistema de Login JWT con 4 roles de acceso: `SUPERADMIN`, `ADMINISTRADOR`, `FUNCIONARIO`, `ANALISTA`.
- **Módulo Principal de Solicitudes (CRUD):** Stepper horizontal dinámico para captura de solicitudes en 5 sectores productivos:
  1. Agricultura Frijol
  2. Ganadería
  3. Pesca y Acuacultura
  4. Infraestructura Rural
  5. Maquinaria Agrícola
- **Gestor de Documentos Digitales:** Carga de expedientes en formato PDF e imágenes con validación de tipo de archivo y almacenamiento en `uploads/`.
- **Dashboard Estadístico y Mapas:** Panel con tarjetas KPI, gráficos de dona (Recharts) y mapa interactivo regional de Nayarit con Leaflet/SVG.
- **Módulo de Administración de Usuarios:** CRUD completo para gestión de cuentas y roles dentro del sistema.

### Base de Datos
- **Migración Inicial Prisma (`20260707163744_init`):** Definición de tablas relacionales en PostgreSQL para usuarios, padrón de beneficiarios, expedientes, sectores y presupuestos.
- **Script de Siembra (`seed.js`):** Creación automática del usuario administrador inicial y asignación de presupuestos sectoriales base.

---

## [0.1.0] — 2026-07-07 a 2026-07-28 (Fase de Requerimientos y Prototipado)
### Planificación y Arquitectura Base
- **Análisis de Requerimientos:** Levantamiento técnico a partir del documento oficial rector (`SISTEMA DE REGISTRO DE INFORMACIÓN.pdf`).
- **Definición de Arquitectura:** Selección del stack tecnológico: Frontend (React 19, Vite, Tailwind CSS), Backend (Node.js, Express, Prisma 7 ORM) y Base de Datos (PostgreSQL en Railway/Neon).
- **Prototipado de Base de Datos:** Creación de la migración inicial de la base de datos `20260707163744_init` el 7 de Julio de 2026.
