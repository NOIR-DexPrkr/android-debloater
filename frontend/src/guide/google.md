# Guía específica para Google Pixel

## Particularidades de Google Pixel

Los dispositivos Google Pixel ejecutan una versión muy limpia de Android, pero incluyen numerosos servicios propietarios de inteligencia ambiental, telemetría y utilidades opcionales de Google que pueden deshabilitarse para ahorrar batería y memoria RAM.

---

## Servicios prescindibles recomendados en Pixel

1. **Inteligencia ambiental y sugerencias:**
   - `com.google.android.as` (Private Compute Services / Android System Intelligence): alimenta funciones como "Está sonando" (*Now Playing*), subtítulos automáticos y respuestas predictivas. Si no utilizas estas funciones, puedes desactivarlo de forma segura.
   - `com.google.android.apps.tips` (Consejos Pixel): guía tutorial que ya no se necesita tras configurar el teléfono.
2. **Realidad Aumentada y Realidad Virtual:**
   - `com.google.ar.core` (Servicios de Google Play para RA).
   - `com.google.ar.lens` (Google Lens).
3. **Apps opcionales de Google:**
   - `com.google.android.apps.wellbeing` (Bienestar Digital / Control Parental).
   - `com.google.android.apps.safetyhub` (Seguridad Personal y Emergencias SOS).
   - `com.google.android.apps.podcasts` (Google Podcasts, descontinuado).
   - `com.google.android.apps.books` (Google Play Libros).
   - `com.google.android.apps.subscriptions.red` (Google One).

---

## Paquetes críticos que NO debes eliminar en Pixel

| Paquete | Motivo |
|---|---|
| `com.google.android.gms` | Google Play Services. Fundamental para notificaciones push, servicios de ubicación y cuentas. |
| `com.google.android.gsf` | Google Services Framework. Su remoción corrompe el acceso a los servicios de red de Google. |
| `com.google.android.apps.nexuslauncher` | Pixel Launcher. Manténlo a menos que tengas otro launcher instalado y configurado como predeterminado. |
| `com.google.android.packageinstaller` | Instalador de paquetes del sistema. |
| `com.google.android.dialer` | Teléfono / Marcador de Google predeterminado en Pixel. |
