# Arquitectura

## Stack

| Capa      | Tecnología                                                   | Notas                                                         |
| --------- | ------------------------------------------------------------ | ------------------------------------------------------------- |
| Framework | Angular 21 (standalone, sin NgModules)                       | `zone.js`, `provideZoneChangeDetection({ eventCoalescing })`. |
| Router    | `provideRouter(routes, withHashLocation())`                  | URLs con `#/…`: GitHub Pages no reescribe rutas. ADR-003.     |
| Estado    | NgRx Store + Effects + Devtools                              | Un feature (`auth`) con `createFeature`. ADR-002.             |
| Backend   | Firebase 12 vía `@angular/fire` (Auth, Firestore)            | Solo cliente. Sin backend propio.                             |
| UI        | Tailwind CSS v4 + primitivas propias (`core/ui`)             | Tema neón en `styles.css`. Iconos `lucide-angular`. ADR-006.  |
| Efectos   | `canvas-confetti`, fuentes Fontsource, CSS                   | Confeti cargado al vuelo; Orbitron + Inter autoalojadas.      |
| Juegos    | `tic-tac-toe-minimax`; motores propios de Tetris y Smart toy | IA del tres en línea; Tetris y el adivino sin dependencias.   |
| Build     | `@angular/build:application` (esbuild)                       | `baseHref: /game-apps/`, salida en `dist/`. ADR-004.          |
| Tests     | Vitest + jsdom (`@angular/build:unit-test`)                  | Specs standalone junto al código (`*.spec.ts`).               |
| Calidad   | ESLint (flat, angular-eslint) + Prettier + Husky             | ADR-005.                                                      |
| Runtime   | Node ≥ 22                                                    | `.nvmrc`.                                                     |

## Estructura

```
src/
├── main.ts                    Arranque: bootstrapApplication(AppComponent, appConfig)
├── styles.css                 Tailwind: tema, utilidades y estilos base
├── environments/              environment.ts (contrato); .development/.production (no se versionan)
└── app/
    ├── app.config.ts          Providers: router (hash + View Transitions), Firebase, NgRx
    ├── app.routes.ts          Rutas; las de juegos se derivan del registro
    ├── app.component.*        Marco: cabecera, fondo animado, salida del router, pie
    ├── core/
    │   ├── services/          Servicios sin dependencia de features: audio, sfx (efectos sintetizados), preferences (localStorage tipado), storage, celebration (confeti)
    │   └── ui/                Primitivas visuales: botón, panel, interruptor, control segmentado, estadística, campo, avisos (toast)
    ├── user/                  Modelo User y UserService
    ├── auth/                  AuthService, pantallas login/register/forgot, store/ (NgRx)
    ├── pages/home/            Catálogo de juegos
    └── games/
        ├── games.registry.ts  Única fuente de los juegos (P2)
        └── <id>/              Un directorio por juego (componente standalone + spec)
```

## Capas y reglas de dependencia

```
core/services · core/ui ─► user ─► auth ─► games / pages ─► app
```

- Una capa solo importa de las que están a su izquierda. `games/` solo usa `core/services` (p. ej. `AudioService`) y `core/ui`: no conoce `auth/`, `user/` ni `pages/`.
- `core/services/` y `core/ui/` no importan nada de `auth/`, `user/`, `games/` ni `pages/`.
- `app.routes.ts` y `home` leen el registro; ninguno enumera juegos por su cuenta.

## Flujo de sesión

1. `AuthService.user$` envuelve `authState(auth)` con `shareReplay`: **una sola suscripción** a Firebase para toda la app.
2. Cada emisión actualiza `localStorage` (`users`) y despacha `setUserLoggedIn` al store.
3. `isAuthenticated` es una señal derivada (`toSignal`) que usa el marco para mostrar «Entrar» o «Salir».
4. No hay guard: ninguna ruta exige sesión (ADR-007). La sesión solo cambia lo que muestra el marco.
5. Al iniciar sesión o registrarse, `setUserData` hace `setDoc(users/{uid}, …, { merge: true })`.

## Registro de juegos

`GameDefinition { id, title, description, icon (Lucide), accent, enabled, loadComponent? }`. Un juego con `enabled: true` y `loadComponent` genera su ruta pública `games/<id>` (con `title`) y una
tarjeta activa en Inicio. Se documenta en [SPEC-003](features/SPEC-003-catalogo.md).

## Decisiones

- [ADR-001 — Componentes standalone y registro único de juegos](decisions/ADR-001-standalone-y-registro-de-juegos.md)
- [ADR-002 — Firebase en el cliente y NgRx mínimo](decisions/ADR-002-firebase-y-ngrx-minimo.md)
- [ADR-003 — Enrutado por hash y despliegue en GitHub Pages](decisions/ADR-003-hash-routing-y-gh-pages.md)
- [ADR-004 — Builder esbuild y Vitest](decisions/ADR-004-esbuild-y-vitest.md)
- [ADR-005 — Mismo flujo de calidad y despliegue que portfolio](decisions/ADR-005-flujo-como-portfolio.md)
- [ADR-006 — Tailwind con primitivas propias, sin Material ni Bootstrap](decisions/ADR-006-tailwind-sin-material.md)
- [ADR-007 — Acceso abierto: jugar sin iniciar sesión](decisions/ADR-007-acceso-abierto.md)
