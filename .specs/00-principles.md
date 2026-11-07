# Principios

Lo innegociable. Si un cambio los viola, se discute antes de escribir código.

- **P1 — Aplicación estática.** Sin backend propio ni SSR. Lo único remoto es Firebase (Auth y Firestore), que se usa directo desde el navegador.
- **P2 — Un solo registro de juegos.** `games/games.registry.ts` es la única fuente de qué juegos existen. La ruta y la tarjeta de Inicio se derivan de él; ninguna se escribe a mano.
- **P3 — Un juego, un chunk.** Cada juego es un componente standalone cargado de forma perezosa (`loadComponent`) y su ruta está protegida por `authGuard`.
- **P4 — Capas con dirección única.** `core/services → user → auth → core/guards → games / pages → app`. Una capa nunca importa de otra que esté a su derecha. Un juego no conoce `auth/`, `user/` ni
  `pages/`.
- **P5 — TypeScript estricto.** Sin `any` ni `@ts-ignore` nuevos (la deuda existente está listada en `01-product.md`). Plantillas con `strictTemplates`.
- **P6 — Estado global mínimo.** NgRx solo guarda lo que dos partes no relacionadas comparten (hoy, si hay sesión). El resto es estado local del componente (señales o propiedades).
- **P7 — Los secretos y la configuración viven fuera del repositorio.** La configuración de Firebase entra por `.env` o por variables de CI; `environment.production.ts` y `environment.development.ts`
  no se versionan.
- **P8 — Accesible por defecto.** Todo elemento interactivo es alcanzable y operable con teclado y tiene nombre accesible. El lint de plantillas lo comprueba.
- **P9 — Nada se queda colgado.** Todo audio, temporizador o suscripción se libera al destruir el componente.
- **P10 — Un fallo de configuración no se publica.** `generate-env-prod.js` aborta si falta una variable obligatoria; el despliegue solo corre si lint, formato, tipos, tests y build pasan.
