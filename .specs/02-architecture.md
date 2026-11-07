# Arquitectura

## Stack

| Capa      | Tecnología                                           | Notas                                                         |
| --------- | ---------------------------------------------------- | ------------------------------------------------------------- |
| Framework | Angular 21 (standalone, sin NgModules)               | `zone.js`, `provideZoneChangeDetection({ eventCoalescing })`. |
| Router    | `provideRouter(routes, withHashLocation())`          | URLs con `#/…`: GitHub Pages no reescribe rutas. ADR-003.     |
| Estado    | NgRx Store + Effects + Devtools                      | Un feature (`auth`) con `createFeature`. ADR-002.             |
| Backend   | Firebase 12 vía `@angular/fire` (Auth, Firestore)    | Solo cliente. Sin backend propio.                             |
| UI        | Angular Material + Bootstrap (utilidades de rejilla) | Tema `indigo-pink`. SCSS por componente.                      |
| Juegos    | `tic-tac-toe-minimax`                                | IA del tres en línea.                                         |
| Build     | `@angular/build:application` (esbuild)               | `baseHref: /game-apps/`, salida en `dist/`. ADR-004.          |
| Tests     | Vitest + jsdom (`@angular/build:unit-test`)          | Specs standalone junto al código (`*.spec.ts`).               |
| Calidad   | ESLint (flat, angular-eslint) + Prettier + Husky     | ADR-005.                                                      |
| Runtime   | Node ≥ 22                                            | `.nvmrc`.                                                     |

## Estructura

```
src/
├── main.ts                    Arranque: bootstrapApplication(AppComponent, appConfig)
├── styles.scss                Estilos globales
├── environments/              environment.ts (contrato); .development/.production (no se versionan)
└── app/
    ├── app.config.ts          Providers: router, Firebase, NgRx, animaciones
    ├── app.routes.ts          Rutas; las de juegos se derivan del registro
    ├── app.component.*        Marco: barra superior, salida del router
    ├── core/
    │   ├── services/          Servicios sin dependencia de features: audio, storage
    │   └── guards/            authGuard
    ├── user/                  Modelo User y UserService
    ├── auth/                  AuthService, pantallas login/register/forgot, store/ (NgRx)
    ├── pages/home/            Catálogo de juegos
    └── games/
        ├── games.registry.ts  Única fuente de los juegos (P2)
        └── <id>/              Un directorio por juego (componente standalone + spec)
```

## Capas y reglas de dependencia

```
core/services ─► user ─► auth ─► core/guards ─► games / pages ─► app
```

- Una capa solo importa de las que están a su izquierda. `games/` solo usa `core/services` (p. ej. `AudioService`) y Angular Material: no conoce `auth/`, `user/` ni `pages/`.
- `core/services/` no importa nada de `auth/`, `user/`, `games/` ni `pages/`.
- `app.routes.ts` y `home` leen el registro; ninguno enumera juegos por su cuenta.

## Flujo de sesión

1. `AuthService.user$` envuelve `authState(auth)` con `shareReplay`: **una sola suscripción** a Firebase para toda la app.
2. Cada emisión actualiza `localStorage` (`users`) y despacha `setUserLoggedIn` al store.
3. `isAuthenticated` es una señal derivada (`toSignal`) que usa el marco para mostrar «Inicio» y «Salir».
4. `authGuard` espera la **primera** emisión de `user$` antes de decidir, para no expulsar a quien tiene sesión persistida.
5. Al iniciar sesión o registrarse, `setUserData` hace `setDoc(users/{uid}, …, { merge: true })`.

## Registro de juegos

`GameDefinition { id, title, icon, enabled, loadComponent? }`. Un juego con `enabled: true` y `loadComponent` genera su ruta `games/<id>` (con `authGuard` y `title`) y una tarjeta activa en Inicio. Se
documenta en [SPEC-003](features/SPEC-003-catalogo.md).

## Decisiones

- [ADR-001 — Componentes standalone y registro único de juegos](decisions/ADR-001-standalone-y-registro-de-juegos.md)
- [ADR-002 — Firebase en el cliente y NgRx mínimo](decisions/ADR-002-firebase-y-ngrx-minimo.md)
- [ADR-003 — Enrutado por hash y despliegue en GitHub Pages](decisions/ADR-003-hash-routing-y-gh-pages.md)
- [ADR-004 — Builder esbuild y Vitest](decisions/ADR-004-esbuild-y-vitest.md)
- [ADR-005 — Mismo flujo de calidad y despliegue que portfolio](decisions/ADR-005-flujo-como-portfolio.md)
