# ADR-001 — Componentes standalone y registro único de juegos

| Campo        | Valor                                                        |
| ------------ | ------------------------------------------------------------ |
| **Estado**   | aceptada                                                     |
| **Fecha**    | 2026-11-06                                                   |
| **Afecta a** | SPEC-003, `games/games.registry.ts`, `app.routes.ts`, `home` |

## Contexto

Cada juego nuevo obligaba a tocar a la vez las rutas, la pantalla de Inicio y la carga del componente, y era fácil olvidar uno de los tres.

## Decisión

Todo es standalone (sin NgModules) y los juegos se declaran en un único registro, `GAMES`. Las rutas y las tarjetas de Inicio se derivan de él; cada juego se carga de forma perezosa y su ruta lleva
`authGuard`.

## Alternativas consideradas

| Alternativa                            | Ventajas            | Por qué se descartó                                               |
| -------------------------------------- | ------------------- | ----------------------------------------------------------------- |
| Rutas y tarjetas escritas a mano       | Explícito           | Tres sitios que mantener sincronizados por cada juego.            |
| Un `NgModule` por juego                | Aislamiento clásico | Obsoleto en Angular 21; más ceremonia sin beneficio.              |
| Registro con descubrimiento automático | Cero configuración  | Magia de build; el orden y el estado `enabled` quedan implícitos. |

## Consecuencias

**A favor:** añadir un juego son dos pasos (componente + entrada); un chunk por juego; el test del registro detecta `id` repetidos.

**En contra:** el registro importa el componente de forma dinámica, así que un error de ruta de import solo salta al cargarlo (lo cubre el test «every enabled game can be lazy loaded»).

**Compromisos que impone:** ninguna ruta de juego se escribe fuera del registro; un `id` publicado no se renombra.

## Revisión

Si un juego necesita rutas anidadas, parámetros propios o un guard distinto del común.
