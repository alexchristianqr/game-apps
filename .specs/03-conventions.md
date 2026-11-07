# Convenciones

ESLint, Prettier y `tsc` son la autoridad sobre el formato. Aquí, lo que no pueden verificar.

## Nomenclatura

| Elemento             | Convención                                               | Ejemplo                           |
| -------------------- | -------------------------------------------------------- | --------------------------------- |
| Componente           | `<nombre>.component.{ts,html}`, selector `app-*`         | `login.component.ts`, `app-login` |
| Servicio             | `<nombre>.service.ts`, `providedIn: 'root'`              | `audio.service.ts`                |
| Guard / interceptor  | `<nombre>.guard.ts` (función `…Guard`)                   | `authenticate.guard.ts`           |
| Acciones/estado NgRx | `<feature>.{actions,reducer,selectors,state,effects}.ts` | `auth.reducer.ts`                 |
| Juego                | Carpeta `games/<id>/` con `id` en kebab-case             | `games/tic-tac-toe/`              |
| Spec de test         | `<archivo>.spec.ts` junto al archivo                     | `games.registry.spec.ts`          |

El `id` de un juego es parte de la URL (`/games/<id>`): no se renombra sin una redirección.

## Componentes

- Siempre standalone con `imports` explícitos; sin NgModules.
- Dependencias con `inject()`, no por parámetros del constructor (lo exige ESLint).
- Plantillas con control flow (`@if`, `@for`) y `track` con un identificador estable, no el índice si hay identificador.
- Todo elemento con `(click)` que no sea un `<button>` o `<a>` lleva `role`, `tabindex` y manejo de teclado (P8).
- Todo audio, temporizador o suscripción se libera en `ngOnDestroy` o con `takeUntilDestroyed` (P9).
- Estado de pantalla: propiedades o señales locales. NgRx solo para lo compartido (P6).

## Juegos

- Un juego nuevo: `games/<id>/<id>.component.ts` + registro en `games.registry.ts` + `SPEC-NNN` (README de la raíz, «Agregar un juego»).
- Los sonidos se reproducen con `AudioService`, nunca con `new Audio()` en el componente.
- La lógica pura del juego (reglas, IA, comprobación de ganador) se separa del componente para poder probarla sin DOM.

## Firebase y secretos

- Nada de claves ni IDs de Firebase en el código ni en el repositorio (P7). Entran por `.env` / variables de CI → `generate-env-prod.js`.
- El código solo importa `environment` desde `src/environments/environment`; el builder lo sustituye por la variante de cada configuración.

## TypeScript

- Sin `any` ni `@ts-ignore` nuevos; importaciones de solo tipos con `import type`.
- Toda función pública declara su tipo de retorno cuando no es evidente.
- Temporizadores portables: `ReturnType<typeof setTimeout>`.

## Tests

- Vitest, specs standalone (`TestBed` con `imports`). Un cambio de comportamiento trae su test.
- Las reglas del registro (`games.registry.spec.ts`) y el guard se prueban siempre.

## Comentarios

En español, explican **por qué**, no qué hace la línea.

## Commits y ramas

- `dev` es la rama de trabajo y `main` la principal: los cambios se integran con un PR de `dev` a `main`. `gh-pages` la genera el despliegue y nunca se edita a mano.
- Mensajes en inglés con prefijo convencional (`feat:`, `fix:`, `chore:`, `ci:`, `docs:`, `test:`), una línea de resumen.
- El hook `pre-commit` ejecuta lint-staged (ESLint + Prettier). No se usa `--no-verify`.
- Un commit no mezcla cambio de comportamiento con reformateo masivo.

## Estilos

- Tailwind v4: clases completas en la plantilla (nunca interpoladas con `{{ }}` parciales como `bg-{{ color }}-500`); colores y animaciones del tema en `@theme` de `styles.css`.
- Sin SCSS por componente: si un patrón se repite, se promueve a primitiva de `core/ui/` o a `@utility`/`@layer components` en `styles.css`.
- Toda animación respeta `prefers-reduced-motion` (ya cubierto globalmente en `styles.css`).
