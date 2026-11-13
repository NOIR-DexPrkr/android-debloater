# Changelog

Todos los cambios notables de **NoirADB** se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es/1.1.0/) y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Los encabezados de sección en `[Unreleased]` deciden el incremento de versión del siguiente release: `### Ruptura` → mayor, `### Añadido` → menor, cualquier otro → parche.

## [Unreleased]

Nada aún.

## [0.1.0] — 2026-11-13

### Añadido
- **Lanzamiento inicial en Beta de NoirADB (Noir Android Debloater)**: aplicación de escritorio universal, gratuita y de código abierto para desinstalar bloatware, aplicaciones innecesarias, publicidad y servicios de telemetría en teléfonos Android sin necesidad de root ni desbloquear el bootloader.
- **Soporte multi-marca universal**: detección automática por ADB del fabricante y capa del sistema (Xiaomi/HyperOS/MIUI, Samsung/One UI, Google Pixel/AOSP, OnePlus/OxygenOS, OPPO/ColorOS, realme/realme UI, vivo/Funtouch/OriginOS, Motorola/Hello UX, Huawei/Honor/EMUI/MagicOS, Asus, Sony, Nokia, Lenovo, ZTE, TCL, nubia y Meizu), con opción de selector manual de fabricante.
- **Base de datos modular en la nube**: estructura dividida en una lista `general.json` (bloatware compartido: Facebook, Netflix, TikTok, Booking, stubs de operadoras) más listas dedicadas por fabricante (`brands/<marca>.json`), actualizables en vivo desde el repositorio sin requerir reinstalación de la app.
- **Filtro de origen**: navegación instantánea entre paquetes de origen *Todas*, *General* o la marca detectada (*Xiaomi*, *Samsung*, etc.).
- **Gestión reversible y segura**: remoción mediante `pm uninstall -k --user 0` preservando el APK base en el sistema para permitir su restauración en cualquier momento.
- **Organización en secciones Eliminar y Restaurar**:
  - **Eliminar**: gestión de apps activas dividida en pestañas **Deshabilitar** (congelar) y **Desinstalar** (remover para el usuario actual).
  - **Restaurar**: recuperación ordenada en pestañas **Deshabilitadas** y **Eliminadas**.
- **Acciones individuales y por lote**: selección múltiple de paquetes con diálogo contextual de confirmación y advertencias de seguridad.
- **Clasificación y niveles de riesgo**: paquetes clasificados con descripciones detalladas en español y niveles de riesgo (*Seguro*, *Precaución*, *Peligro*). Modo avanzado para visualizar y gestionar aplicaciones críticas.
- **Guía interactiva integrada**: recomendaciones paso a paso para Android en general y apartados específicos de optimización por fabricante.
- **Consola y auditoría en tiempo real**: panel de registro en vivo que muestra cada comando ADB enviado y la respuesta del dispositivo.
- **Identidad visual Flat Noir (DexNR)**: interfaz moderna con acentos cyan, tipografías Inter / Montserrat / JetBrains Mono y soporte completo en español (LatAm).
- **Compatibilidad multiplataforma**: compilaciones nativas para Windows (x64 y ARM64), macOS (binario universal) y Linux (paquetes `.tar.gz`, `.deb` y `.rpm`).
