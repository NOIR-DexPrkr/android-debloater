# Guía universal de debloat para Android

## Antes de empezar

- **Activa las opciones de desarrollador:**
  Ve a *Ajustes > Acerca del teléfono / Información del software* y toca repetidamente sobre el **Número de compilación** (o versión de tu capa de personalización) entre 7 y 10 veces continuas, hasta que el sistema indique que ya eres desarrollador.
- **Activa la depuración por USB:**
  Ve a *Ajustes > Ajustes del sistema / Opciones de desarrollador* y activa **Depuración por USB**. Si tu fabricante añade controles de seguridad adicionales (por ejemplo en Xiaomi, realme o vivo), habilita también *Depuración por USB (Ajustes de seguridad)*. Al conectar el teléfono a la PC por primera vez mediante cable USB, acepta el aviso con la huella digital RSA marcando *"Permitir siempre desde este ordenador"*.
- **Haz una copia de seguridad antes de comenzar:**
  Realiza un respaldo de tus datos importantes (fotos, documentos, chats de WhatsApp). Aunque desinstalar aplicaciones para el usuario 0 no borra la partición del sistema, deshabilitar un componente crítico puede ocasionar un bucle de arranque (*bootloop*), cuya única salida en ocasiones es un restablecimiento de fábrica (*factory reset*).
- **Desinstalar frente a deshabilitar:**
  - `pm uninstall -k --user 0 <paquete>`: Remueve la aplicación únicamente para el usuario actual (usuario 0). El archivo APK original se conserva intacto en la partición `/system` o `/product`, y el parámetro `-k` mantiene la configuración y datos para poder restaurarla.
  - `pm disable-user --user 0 <paquete>`: Congela el paquete impidiendo que se ejecute en segundo plano o aparezca en el cajón de aplicaciones. En versiones modernas de Android (14 y superiores) varios fabricantes restringen la congelación directa, por lo que la desinstalación para el usuario 0 es el método más compatible y seguro.
- **Cómo deshacer una eliminación:**
  Para restaurar cualquier paquete previamente eliminado, ejecuta:
  `cmd package install-existing <paquete>` o `pm install-existing --user 0 <paquete>`.
  En esta aplicación puedes hacerlo directamente desde la sección **Restaurar → Eliminadas**, seleccionando el paquete y pulsando **Restaurar**.
- **Procede por lotes pequeños:**
  Elimina o desinstala primero las aplicaciones prescindibles (redes sociales precargadas, juegos, stubs de operadoras). Reinicia tu dispositivo después de cada lote para verificar que la estabilidad del sistema se mantenga óptima.

---

## Orden recomendado de limpieza

1. **Primero telemetría publicitaria y rastreo:**
   Comienza por los servicios de recopilación analítica del fabricante y los módulos de publicidad precargados.
2. **Segundo las precargas comerciales de terceros:**
   Juegos patrocinados, apps de compras (Amazon, Booking, AliExpress), redes sociales y aplicaciones de operadoras móviles (Claro, Movistar, Vodafone, Orange, etc.). Son 100% seguras de retirar.
3. **Tercero aplicaciones de usuario opcionales:**
   Navegadores propietarios, clientes de correo alternativos, reproductores multimedia del fabricante o asistentes de voz duplicados, asegurándote previamente de contar con una alternativa instalada.
4. **Apps del sistema marcadas con Precaución:**
   Revisa detalladamente la descripción antes de tocar componentes de la nube del fabricante, tiendas secundarias o servicios de sincronización. Si no utilizas la cuenta del fabricante, puedes removerlas con cautela.

---

## Principios clave: ¿Qué nunca debes eliminar?

- **Framework central y servicios base:** Paquetes como `android`, `com.android.systemui`, `com.android.settings`, y los instaladores de paquetes (`com.android.packageinstaller`).
- **Servicios de telefonía y emergencia:** `com.android.phone`, `com.android.providers.telephony`, `com.android.cellbroadcastreceiver`.
- **Servicios de Google esenciales:** Si tu sistema depende de Google Play Services (`com.google.android.gms`, `com.google.android.gsf`), nunca los elimines o perderás la sincronización, notificaciones push (FCM) y la tienda Play Store.
- **Launcher predeterminado sin alternativa:** Si desinstalas el lanzador principal del sistema sin haber instalado y configurado previamente un launcher alternativo (como Nova Launcher), tu teléfono quedará sin pantalla de inicio ni gestos de navegación.

---

## Guías específicas por marca disponibles

NoirADB cuenta con guías detalladas adaptadas a las particularidades, capas y ajustes de seguridad de cada fabricante:

- **Xiaomi / Redmi / POCO**: Optimizaciones para HyperOS y MIUI, autorización de depuración con cuenta Mi y restricciones de seguridad.
- **Samsung**: One UI, Knox, Bixby, servicios de cuentas Samsung y optimizaciones de batería.
- **Google Pixel**: AOSP puro, servicios de telemetría de Google, Pixel Launcher y funciones de bienestar digital.
- **OnePlus**: OxygenOS / ColorOS, servicios HeyTap, Shelf y optimizadores de juegos.
- **OPPO**: ColorOS, HeyTap Cloud, App Market y permisos de depuración USB avanzados.
- **realme**: realme UI, servicios de cuenta HeyTap y bloatware regional.
- **vivo / iQOO**: Funtouch OS y OriginOS, V-Appstore, servicios Jovi y confirmaciones USB.
- **Motorola**: Hello UX / MyUX, Moto App, Moto Actions y servicios Ready For.
- **Huawei / Honor**: EMUI y MagicOS, Huawei Mobile Services (HMS), AppGallery y precargas.
- **Otras marcas**: Asus (ROG/ZenUI), Sony (Xperia), Lenovo, ZTE, TCL, Nubia, Meizu y Nothing.

> Al conectar tu teléfono por cable USB con la depuración activada, el selector de guías mostrará automáticamente la guía específica de tu marca junto a la guía general.

