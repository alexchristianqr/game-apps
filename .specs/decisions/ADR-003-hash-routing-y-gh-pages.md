# ADR-003 — Enrutado por hash y despliegue en GitHub Pages

| Campo        | Valor                                            |
| ------------ | ------------------------------------------------ |
| **Estado**   | aceptada                                         |
| **Fecha**    | 2026-11-06                                       |
| **Afecta a** | `app.config.ts`, `angular.json` (`baseHref`), CI |

## Contexto

GitHub Pages sirve archivos estáticos y no reescribe rutas: una URL como `/game-apps/home` devolvería 404 al recargar. Además el sitio vive bajo el subdirectorio `/game-apps/`.

## Decisión

`withHashLocation()` en el router (URLs `…/game-apps/#/home`) y `baseHref: /game-apps/`. El despliegue publica `dist/` en la rama `gh-pages`.

## Alternativas consideradas

| Alternativa                             | Ventajas         | Por qué se descartó                            |
| --------------------------------------- | ---------------- | ---------------------------------------------- |
| Rutas limpias con `404.html` de reserva | URLs bonitas     | Truco frágil y mala respuesta HTTP en recarga. |
| Firebase Hosting                        | Rewrites nativos | Otro destino que operar; Pages ya es gratis.   |

## Consecuencias

**A favor:** funciona en Pages sin configuración extra; cualquier ruta sobrevive a la recarga.

**En contra:** URLs con `#`; el enlace de recuperación de contraseña debe apuntar a `…/game-apps/#/login`.

**Compromisos que impone:** cambiar de alojamiento exige revisar `baseHref`, el hash y esa URL.

## Revisión

Si el sitio se mueve a un alojamiento con rewrites.
