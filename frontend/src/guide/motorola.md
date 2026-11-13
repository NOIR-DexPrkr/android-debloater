# Guía específica para Motorola (Hello UX / My UX)

## Particularidades de Motorola

Motorola mantiene una experiencia muy cercana a Android puro (*stock*), pero incorpora su conjunto de aplicaciones complementarias *Moto* (gestos de cámara y linterna, pantalla inteligente Moto Display y Ready For).

---

## Servicios prescindibles recomendados en Motorola

1. **Sugerencias y notificaciones publicitarias:**
   - `com.motorola.ccc.notification` (Notificaciones promocionales de Motorola).
   - `com.motorola.genie` (Sugerencias interactivas y tutoriales Moto).
   - `com.motorola.help` (Ayuda del dispositivo y manuales).
2. **Plataformas de conectividad y productividad opcionales:**
   - `com.motorola.gamemode` (Modo Gametime / optimización de juegos).
   - `com.motorola.fmplayer` (Radio FM, prescindible si no se usa con auriculares por cable).
   - `com.motorola.visualvoicemail` (Buzón de voz visual dependiente de operadora).
3. **Telemetría y retroalimentación:**
   - `com.motorola.moto` (si prefieres no usar gestos de linterna o captura de pantalla con tres dedos).
   - `com.motorola.ccc.ota` (gestor de encuestas y diagnóstico).

---

## Paquetes críticos que NO debes eliminar en Motorola

| Paquete | Motivo |
|---|---|
| `com.motorola.launcher3` | Lanzador del sistema Moto. |
| `com.motorola.motocit` | Menú de hardware y sensores. |
| `com.motorola.camera2` | App de cámara con calibración de sensores Motorola. |
