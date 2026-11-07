# Producto

**Game Apps** es un portal abierto de juegos clásicos jugables en el navegador, gratis y sin registrarse. La cuenta es opcional. Publicada en <https://alexchristianqr.github.io/game-apps/>.

**Para quién:** quien quiera jugar un rato; y como proyecto de portafolio de [Alex Christian](https://github.com/alexchristianqr).

## Contenido

| Capacidad              | Ruta                             | Especificación                                 |
| ---------------------- | -------------------------------- | ---------------------------------------------- |
| Autenticación          | `/login`, `/register`, `/forgot` | [SPEC-001](features/SPEC-001-autenticacion.md) |
| Marco de la aplicación | cabecera, pie y fondo            | [SPEC-002](features/SPEC-002-marco-app.md)     |
| Catálogo de juegos     | `/home`                          | [SPEC-003](features/SPEC-003-catalogo.md)      |
| Tres en línea          | `/games/tic-tac-toe`             | [SPEC-004](features/SPEC-004-tres-en-linea.md) |
| Audio de los juegos    | —                                | [SPEC-005](features/SPEC-005-audio.md)         |
| Tetris                 | `/games/tetris`                  | [SPEC-006](features/SPEC-006-tetris.md)        |

## Juegos previstos

`smart-toy` y `basketball` figuran en el registro con `enabled: false`: aparecen deshabilitados en Inicio y no tienen ruta. Al implementar uno se crea su `SPEC-NNN` y se activa en el registro.

## Fuera de alcance

- Multijugador en línea, marcadores globales y persistencia de partidas.
- Backend propio.
- Aplicación móvil nativa.

## Deuda conocida

Aceptada hoy; cada punto indica qué la resolvería.

| Deuda                                                                                                                           | Se resuelve cuando                                          |
| ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `any` en `storage.service.ts` y `tic-tac-toe.component.ts`; `@ts-ignore` en la importación de `tic-tac-toe-minimax` (sin tipos) | Se tipan o se sustituye la librería (16 avisos de ESLint).  |
| `StorageService` duplica estado de sesión que ya vive en Firebase y NgRx (`users` en `localStorage`)                            | Se confirma que nada lo lee y se retira.                    |
| `AuthService.sendVerificationMail` navega a `verify-email-address`, ruta que no existe                                          | Se crea la pantalla o se retira el método.                  |
| `authLogin` muestra los errores con `window.alert`; `googleAuth()` no tiene botón en ninguna pantalla                           | Se unifica con `ToastService` como en `forgot`.             |
| Credenciales de invitado como valor por defecto del formulario de login                                                         | Se decide si es una demo pública deliberada (ver SPEC-001). |
| `firebase.json` en la raíz contiene una configuración web de Firebase, no la de Firebase Hosting                                | Se comprueba que nada lo usa y se retira o renombra.        |
| `UserService`, `AuthEffects` y `CustomType` están vacíos                                                                        | Se usan o se eliminan.                                      |
| Sin marca de compilación visible (versión/commit publicado)                                                                     | Se añade, como en `portfolio`.                              |
