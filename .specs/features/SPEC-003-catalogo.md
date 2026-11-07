# SPEC-003 — Catálogo de juegos y registro

| Campo           | Valor                                       |
| --------------- | ------------------------------------------- |
| **Estado**      | implementada                                |
| **Componentes** | `HomeComponent`                             |
| **Datos**       | `src/app/games/games.registry.ts` (`GAMES`) |
| **Rutas**       | `/home`, `/games/<id>`, `/game` (redirige)  |
| **Depende de**  | SPEC-001                                    |

## Propósito

Que quien entra vea qué juegos hay y llegue a cada uno, y que añadir un juego no obligue a tocar rutas ni pantallas.

## Requisitos funcionales

- **RF-01** — El registro `GAMES` es la única fuente de qué juegos existen. Cada entrada tiene `id` único, `title`, `description`, `icon` (Lucide), `accent` (color de la tarjeta), `enabled` y, si se
  puede jugar, `loadComponent`.
- **RF-02** — Por cada juego con `enabled: true` **y** `loadComponent` se crea la ruta `games/<id>`, pública, con carga perezosa y `title` de página.
- **RF-03** — Inicio muestra una cabecera de bienvenida con un botón «Jugar ahora» (a la primera partida jugable) y una tarjeta por cada entrada del registro, en su orden, con icono, título y
  descripción. Las entradas con `enabled: false` aparecen atenuadas con la insignia «Próximamente», con `aria-disabled` y sin enlace.
- **RF-04** — La ruta antigua `/game` redirige a `/games/tic-tac-toe`.
- **RF-05** — Los `id` son únicos y todo juego habilitado se puede cargar (lo comprueba `games.registry.spec.ts`).

## Reglas de contenido

Para añadir un juego: `games/<id>/<id>.component.ts` (standalone) + una entrada en el registro + su `SPEC-NNN`. Un `id` publicado no se renombra: es parte de la URL.

## Comportamiento visual

Rejilla responsive de 1, 2, 3 y 4 columnas. Cada tarjeta lleva un icono sobre degradado del color del juego; al pasar el cursor se eleva y brilla. Entrada escalonada.

## Criterios de aceptación

- **CA-01** — Dado el registro actual, cuando abro Inicio, entonces veo 4 juegos y solo «Tres en línea» y «Tetris» son enlaces.
- **CA-02** — Dado un juego nuevo habilitado, cuando lo registro, entonces aparece en Inicio y `/games/<id>` funciona sin tocar `app.routes.ts` ni `home`.
- **CA-03** — Dado `enabled: false`, cuando escribo `/games/<id>` a mano, entonces el comodín de rutas me lleva a `/home` (no existe ruta para un juego deshabilitado), nunca a una pantalla rota.

## Fuera de alcance

Búsqueda, categorías, favoritos, imágenes por juego, rutas protegidas.
