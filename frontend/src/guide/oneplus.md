# Guía específica para OnePlus (OxygenOS / ColorOS)

## Particularidades de OnePlus

Desde la fusión de la base de código entre OxygenOS y ColorOS (Android 12 en adelante), los teléfonos OnePlus comparten componentes de la plataforma de software HeyTap/OPPO junto con utilidades heredadas de OnePlus.

---

## Servicios prescindibles recomendados en OnePlus

1. **Servicios de la comunidad y tiendas de OnePlus:**
   - `com.oneplus.membership` (OnePlus Community / Club de miembros).
   - `com.oneplus.mall` (OnePlus Store).
   - `com.oneplus.account` (Cuenta OnePlus y servicios en la nube).
2. **Modo Juego y herramientas de software:**
   - `com.oneplus.gamespace` (Espacio de juegos / Game Space).
   - `com.oneplus.zenmode` (Modo Zen / Modo Concentración).
   - `com.oneplus.brickmode` (Variante del modo concentración).
3. **Módulos analíticos y diagnósticos:**
   - `net.oneplus.odm` (OnePlus Device Manager / Telemetría).
   - `net.oneplus.push` (Servicio de notificaciones push de OnePlus).
   - `com.oneplus.factorymode` (Modo de prueba de fábrica).

---

## Paquetes críticos que NO debes eliminar en OnePlus

| Paquete | Motivo |
|---|---|
| `net.oneplus.launcher` / `com.oppo.launcher` | Lanzador del sistema. Esencial para navegación gestual y multitarea. |
| `com.oneplus.camera` | App de cámara optimizada con algoritmos Hasselblad. |
| `com.oneplus.security` | Centro de seguridad y administrador de permisos. |
