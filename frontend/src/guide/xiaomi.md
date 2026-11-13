# Guía específica para Xiaomi / HyperOS

## Ajustes específicos de Xiaomi / HyperOS

- **Depuración con ajustes de seguridad:**
  En *Ajustes adicionales > Opciones de desarrollador*, activa *Depuración por USB (Ajustes de seguridad)*. Requiere haber iniciado sesión en tu cuenta Mi y tener una SIM insertada durante la activación.
- **Evitar bucles por congelación:**
  En HyperOS y MIUI reciente (Android 14+), Xiaomi bloquea la congelación de apps del sistema con una excepción `SecurityException`. Utiliza la opción de desinstalación para el usuario 0 que la aplicación gestiona por defecto.

---

## Ajustes de privacidad que no necesitan ADB

- **DNS privado:** Ajustes > Conexión y compartir > DNS privado > `dns.adguard-dns.com` para bloquear publicidad a nivel de red.
- **Revocar autorizaciones del sistema:** Ajustes > Huellas, datos faciales y bloqueo > Autorización y revocación. Desactiva *msa*, *MIUI Daemon*, *Feedback* y *Actualizador de aplicaciones del sistema*.
- **Servicios de anuncios:** Ajustes > Privacidad > Servicios de anuncios. Desactiva *Recomendaciones de anuncios personalizados*.
- **Carrusel de fondos de pantalla:** Desactiva *Glance for Mi* en Ajustes > Pantalla siempre activa y pantalla de bloqueo.
- **Restricción de datos en apps del sistema:** Abre la aplicación *Seguridad* > *Uso de datos* > *Restringir uso de datos* para revocar acceso a internet a utilidades locales que no lo requieren.

---

## Optimización de MIUI / HyperOS

Configuraciones que rara vez hacen falta en el uso diario y que la comunidad suele recomendar desactivar. Son ajustes del propio sistema (no necesitan ADB) y todos son reversibles desde las mismas pantallas. Las rutas varían un poco entre MIUI 13/14 y HyperOS 1/2, pero los nombres son parecidos.

- **Extensión de memoria (RAM virtual):**
  *Ajustes > Ajustes adicionales > Extensión de memoria*. Usa el almacenamiento como memoria extra: con 8 GB de RAM o más aporta muy poco, puede causar micro-tirones al cambiar de apps y desgasta el almacenamiento con escrituras constantes. Desactívala y reinicia el teléfono.
- **Funciones IA:**
  En HyperOS, *Ajustes > Ajustes adicionales > Xiaomi HyperAI* (en algunas versiones aparece como entrada propia de *Ajustes*) agrupa subtítulos, traducción, redacción y demás asistentes; desactiva todo lo que no uses, junto con las sugerencias inteligentes del Asistente. En MIUI no existe HyperAI: el equivalente son las recomendaciones del Asistente y de las apps del sistema. Si no te interesa ninguna función de IA, el motor `com.xiaomi.aicr` puede desinstalarse para el usuario 0 desde la sección **Eliminar** (riesgo *precaución*: puede afectar la configuración de fondos de pantalla).
- **Inicio automático (autostart):**
  *Seguridad > Permisos > Inicio automático* (también en *Ajustes > Aplicaciones > Permisos*). Cada app con inicio automático se lanza sola al arrancar y permanece en memoria. Deja activo solo lo imprescindible (mensajería, banca o el launcher que uses).
- **Gestión de batería y segundo plano:**
  MIUI y HyperOS suspenden las apps en segundo plano de forma agresiva, el motivo habitual de las notificaciones retrasadas. En *Seguridad > Batería > Ahorro de batería de apps* (en HyperOS también desde *Ajustes > Aplicaciones > [app] > Batería*), pon *Sin restricciones* en las apps de mensajería que necesites al instante y *Restringir apps en segundo plano* en el resto.
- **Recomendaciones en apps del sistema:**
  *Seguridad*, *Descargas*, *Gestor de archivos*, *Temas* y el propio lanzador muestran sugerencias y apps promocionadas. Busca la opción *Configuración de recomendaciones* o *Ajustes de anuncios* dentro de cada app y desactívala.
- **Escaneo Wi-Fi y Bluetooth:**
  *Ajustes > Ubicación > Escaneo de Wi-Fi y Bluetooth*. Mantiene las radios escaneando para refinar la ubicación; si no usas navegación precisa, desactívala.

---

## Paquetes críticos de Xiaomi que NO debes eliminar

| Paquete | Motivo |
|---|---|
| `com.miui.securitycenter`, `com.miui.securitycore` | Núcleo de seguridad de Xiaomi. Su remoción causa bucle de arranque en la mayoría de versiones. |
| `com.android.updater` | Actualizador del sistema OTA; necesario para actualizaciones automáticas. |
| `com.miui.home` | Launcher de MIUI / HyperOS. Su ausencia rompe gestos de navegación y vista de recientes. |
| `com.miui.rom`, `com.miui.system`, `com.miui.core` | Framework básico del sistema MIUI / HyperOS. |
| `com.miui.packageinstaller`, `com.android.packageinstaller` | Instalador de paquetes del sistema. |
| `com.xiaomi.finddevice`, `com.xiaomi.account` | Cierra sesión en Mi Account antes de tocarlos, o podrías bloquear el dispositivo. |
| `com.android.overlay.circletosearch` | Rompe el arranque en HyperOS 2. |
| `com.miui.miwallpaper` | Deja la pantalla de bloqueo en negro. |

---

## Consideraciones sobre HyperOS

- **Interconexión e IA:** HyperOS incluye `com.xiaomi.hypercomm` y `com.xiaomi.aicr`. Si no posees otros dispositivos del ecosistema Xiaomi (tablets, PC, domótica), puedes remover `com.xiaomi.hypercomm` con cautela.
- **Joyose (`com.xiaomi.joyose`):** Servicio de gestión térmica y perfiles de rendimiento en juegos. Algunos usuarios lo desinstalan para evitar bajadas de frames en juegos pesados, pero puede generar mayor calentamiento del terminal.
- **Actualizaciones OTA:** La desinstalación de aplicaciones para el usuario 0 no bloquea las actualizaciones del sistema, pero si desinstalas servicios de sincronización críticos (`com.xiaomi.xmsf`), restáuralos antes de aplicar una gran actualización del sistema.
