# Guía para otras marcas

Esta guía contiene consideraciones para marcas con listas iniciales integradas en Universal Debloater:

---

## Asus (ZenUI / ROG UI)
- **Armoury Crate y Game Genie:** Si tienes un Asus ROG Phone, los paquetes de gestión de ventilador, iluminación RGB y macros de gatillos ultrasónicos son controlados por `com.asus.armoury`. Desinstálalos únicamente si no utilizas los accesorios o el panel de juego.
- **Servicios prescindibles:** `com.asus.webstorage` (almacenamiento en la nube de Asus), `com.asus.livedemo` (modo demostración en tiendas) y las herramientas de diagnóstico `com.asus.atd.devicecheck`.

---

## Sony (Xperia)
- **Apps multimedia profesionales:** Los Xperia incluyen apps especializadas de cámara (`Cinema Pro`, `Photo Pro`, `Video Pro`). No las elimines si aprovechas las funciones manuales del sensor de la cámara.
- **Servicios prescindibles:** `com.sonymobile.advancedwidget.entrance` (Xperia Lounge / noticias), `com.sony.soundenhancement` (si no usas Dolby / DSEE Ultimate) y la app de soporte `com.sonymobile.support`.

---

## Nokia / HMD Global
- **Servicios de fondo de Evenwell:** En modelos Nokia con Android One anteriores a Android 12, el fabricante de ensamblaje (FIH Mobile / Foxconn) preinstalaba una serie de apps del paquete `com.evenwell.*` agresivas para la gestión de batería que a menudo cerraban apps en segundo plano e interrumpían notificaciones. Se pueden desinstalar de forma segura.
- **Apps prescindibles:** `com.hmdglobal.support` (soporte My Phone de HMD).

---

## Lenovo & ZTE / nubia
- **ZUI y MyOS:** Ambas capas añaden centros de juegos (`com.lenovo.zui.gamecenter`, `cn.nubia.gamelauncher`), tiendas de temas secundarias y servicios de sincronización en la nube (`com.zte.heartyservice`).
- Mantén siempre intactos los lanzadores y el gestor de huellas dactilares.

---

## TCL & Meizu
- **TCL UI:** Retira los servicios de recomendaciones de contenido y la app `TCL Live`.
- **Flyme (Meizu):** Los paquetes de `com.meizu.media.*` y la tienda de apps de Flyme pueden eliminarse si dispones de Google Play Store instalada.
