# Guía específica para vivo / iQOO (Funtouch OS / OriginOS)

## Particularidades de vivo / iQOO

Los dispositivos vivo y su submarca enfocada en rendimiento iQOO utilizan Funtouch OS en mercados internacionales y OriginOS en dispositivos de origen asiático.

---

## Servicios prescindibles recomendados en vivo / iQOO

1. **Asistente Jovi y servicios inteligentes:**
   - `com.vivo.easyshare` (Compartir archivos con otros dispositivos vivo).
   - `com.vivo.browser` (Navegador propietario de vivo).
   - `com.vivo.appstore` (V-Appstore / tienda de apps de vivo).
   - `com.vivo.magazine` (Pantalla de bloqueo con noticias y publicidad).
   - `com.vivo.globalsearch` (Búsqueda global con sugerencias en línea).
2. **Servicios en la nube y cuenta:**
   - `com.bbk.cloud` (vivo Cloud).
   - `com.bbk.account` (Cuenta de vivo).
3. **Telemetría y análisis:**
   - `com.vivo.daemon` (Demonio analítico de sistema vivo).
   - `com.iqoo.engineermode` (Telemetría y modo de prueba de iQOO).

---

## Paquetes críticos que NO debes eliminar en vivo / iQOO

| Paquete | Motivo |
|---|---|
| `com.bbk.launcher2` | Lanzador del sistema Funtouch / OriginOS. |
| `com.iqoo.secure` / `com.vivo.imanager` | iManager / Centro de seguridad del sistema. |
| `com.vivo.permissionmanager` | Administrador de permisos del sistema. |
