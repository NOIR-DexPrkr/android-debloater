# Guía específica para Samsung (One UI)

## Particularidades de Samsung One UI

- **Activación de opciones de desarrollador:**
  Ve a *Ajustes > Acerca del teléfono > Información de software* y pulsa 7 veces en **Número de compilación**. Luego en *Ajustes > Opciones de desarrollador*, activa **Depuración de USB**.
- **Seguridad Knox y Find My Mobile:**
  Samsung integra su marco de seguridad Knox en hardware y software. Si tienes configurada una cuenta Samsung activa y *Buscar mi móvil (Find My Mobile)* activado, desactívalo temporalmente en *Ajustes > Seguridad y privacidad > Buscar mi móvil* antes de tocar servicios de `com.samsung.android.fmm` para evitar bloqueos de seguridad.

---

## Servicios prescindibles recomendados en Samsung

1. **Ecosistema Bixby:**
   Si utilizas el Asistente de Google o no usas Bixby, puedes remover con total seguridad los servicios de voz y activación:
   - `com.samsung.android.bixby.agent` (Bixby Voice)
   - `com.samsung.android.bixby.service` (Servicio del sistema Bixby)
   - `com.samsung.android.bixbyvision.framework` (Bixby Vision)
   - `com.samsung.android.app.spage` (Bixby Home / Samsung Free)
2. **Zona AR y Realidad Aumentada:**
   - `com.samsung.android.arzone` (Zona AR)
   - `com.samsung.android.aremoji` (AR Emoji)
   - `com.samsung.android.aremojieditor` (Editor AR Emoji)
3. **Servicios de publicidad y telemetría de Samsung:**
   - `com.samsung.android.rubin.app` (Servicio de personalización y telemetría Rubin)
   - `com.samsung.android.ipsgeofence` (Geovallas y telemetría de ubicación)
   - `com.sec.android.diagmonagent` (Agente de diagnóstico y monitoreo de errores)
4. **Apps duplicadas si prefieres las de Google:**
   - `com.sec.android.app.sbrowser` (Samsung Internet, si usas Chrome/Firefox)
   - `com.samsung.android.calendar` (Calendario de Samsung)
   - `com.samsung.android.messaging` (Mensajes de Samsung, si usas Google Mensajes)
   - `com.sec.android.app.voicenote` (Grabadora de voz)

---

## Paquetes críticos que NO debes eliminar en One UI

| Paquete | Motivo |
|---|---|
| `com.sec.android.app.launcher` | One UI Home launcher. Eliminarlo rompe la interfaz de usuario y los gestos multitarea. |
| `com.samsung.android.knox.containercore` | Núcleo de seguridad Knox. Su manipulación forzada puede generar reinicios constantes. |
| `com.sec.android.soagent`, `com.wssyncmldm` | Actualizador de firmware y gestión de dispositivo. |
| `com.samsung.android.biometrics.service` | Desbloqueo biométrico por huella o rostro. |
| `com.sec.android.provider.badge` | Notificaciones con globo numérico en iconos. |
