# Guía específica para Huawei / Honor (EMUI / MagicOS / HarmonyOS)

## Particularidades de Huawei y Honor

Tras las restricciones comerciales impuestas a Huawei, los dispositivos más recientes prescinden de los Servicios de Google (GMS) y funcionan sobre Huawei Mobile Services (HMS Core) y la tienda AppGallery. Los teléfonos Honor independientes ejecutan MagicOS y en mercados internacionales vuelven a contar con GMS.

---

## Servicios prescindibles recomendados en Huawei / Honor

1. **Servicios de contenido y entretenimiento propios:**
   - `com.huawei.browser` (Navegador Petal / Huawei Browser).
   - `com.huawei.appmarket` (AppGallery, si instalas tiendas alternativas como Aurora Store o F-Droid).
   - `com.huawei.video` / `com.huawei.music` (Reproductores de multimedia con servicios de streaming de pago).
   - `com.huawei.search` (Petal Search / Motor de búsqueda).
2. **Asistente virtual Celia e IA:**
   - `com.huawei.vassistant` (Asistente de voz Celia / HiVoice).
   - `com.huawei.intelligent` (Huawei Assistant / Pantalla TODAY con noticias y widgets).
3. **Servicios en la nube y sincronización:**
   - `com.huawei.hidisk` (Huawei Cloud / Almacenamiento en la nube).
   - `com.huawei.wallet` (Huawei Pay / Cartera digital).

---

## Paquetes críticos que NO debes eliminar en Huawei / Honor

| Paquete | Motivo |
|---|---|
| `com.huawei.android.launcher` / `com.hihonor.android.launcher` | Lanzador del sistema EMUI / MagicOS. |
| `com.huawei.systemmanager` | Administrador de batería, permisos y optimización. |
| `com.huawei.hwid` | ID de Huawei. Esencial si usas servicios o dispositivos vinculados de la marca. |
