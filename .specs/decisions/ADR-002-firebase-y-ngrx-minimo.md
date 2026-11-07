# ADR-002 — Firebase en el cliente y NgRx mínimo

| Campo        | Valor                                              |
| ------------ | -------------------------------------------------- |
| **Estado**   | aceptada                                           |
| **Fecha**    | 2026-11-06                                         |
| **Afecta a** | SPEC-001, `auth/`, `app.config.ts`, `core/guards/` |

## Contexto

Se necesitan cuentas de usuario sin mantener un servidor, y la aplicación se publica como sitio estático.

## Decisión

Autenticación y perfil con Firebase (`@angular/fire`: Auth y Firestore) usados directamente desde el navegador. NgRx se conserva con un único feature `auth` (`isLoggedIn`). Hay **una sola**
suscripción a `authState`, compartida con `shareReplay`, de la que derivan el store, la señal `isAuthenticated` y el guard.

## Alternativas consideradas

| Alternativa                        | Ventajas               | Por qué se descartó                                             |
| ---------------------------------- | ---------------------- | --------------------------------------------------------------- |
| Backend propio con sesión          | Control total          | Contradice P1 (sin backend) y añade operación y coste.          |
| Quitar NgRx y usar solo señales    | Menos dependencias     | Pendiente de decidir: hoy el store es mínimo pero está montado. |
| Varias suscripciones a `authState` | Más simple de escribir | Estados desincronizados y expulsiones en la recarga.            |

## Consecuencias

**A favor:** sin servidor; sesión persistida por Firebase; el guard no expulsa a quien recarga.

**En contra:** reglas de seguridad de Firestore y dominios autorizados se configuran fuera del repositorio; la configuración web de Firebase es pública una vez compilada.

**Compromisos que impone:** ningún estado nuevo entra en NgRx salvo que dos partes no relacionadas lo compartan (P6); la configuración nunca se versiona (P7).

## Revisión

Si NgRx sigue sin usarse más allá de `isLoggedIn`, valorar retirarlo en un ADR nuevo.
