# ADR-007 — Acceso abierto: jugar sin iniciar sesión

| Campo        | Valor                                                                |
| ------------ | -------------------------------------------------------------------- |
| **Estado**   | aceptada                                                             |
| **Fecha**    | 2026-11-06                                                           |
| **Afecta a** | `app.routes.ts`, `AuthService.signOut`, SPEC-001, SPEC-002, SPEC-003 |

## Contexto

El catálogo y cada juego exigían sesión de Firebase (`authGuard`). Para un portal de juegos en línea abierto, obligar a registrarse antes de ver qué hay es una barrera sin beneficio: los juegos no
guardan datos de la persona.

## Decisión

Ninguna ruta exige sesión. Se elimina `authGuard`; la raíz y el comodín llevan a `/home`; «Salir» vuelve a `/home`. La cuenta (login, registro, recuperación) sigue existiendo y es opcional; el marco
muestra «Entrar» o «Salir» según `isAuthenticated`.

## Alternativas consideradas

| Alternativa                | Ventajas           | Por qué se descartó                         |
| -------------------------- | ------------------ | ------------------------------------------- |
| Mantener login obligatorio | Control de acceso  | Fricción alta; no protege nada sensible.    |
| Solo el catálogo público   | Cuenta como gancho | Misma fricción al jugar; sin ganancia real. |

## Consecuencias

**A favor:** se entra y se juega a la primera; menos código (sin guard).

**En contra:** si en el futuro hay marcadores o progreso por persona, habrá que reintroducir protección solo para esas rutas.

**Compromisos que impone:** ningún juego puede asumir que hay un usuario; un juego no conoce `auth/` (P4).

## Revisión

Al añadir persistencia de partidas o marcadores globales.
