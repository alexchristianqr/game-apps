# ADR-008 — Three.js para los juegos 3D, solo dentro del chunk del juego

| Campo        | Valor                                                                             |
| ------------ | --------------------------------------------------------------------------------- |
| **Estado**   | aceptada                                                                          |
| **Fecha**    | 2026-11-07                                                                        |
| **Afecta a** | `src/app/games/bomberman/`, `package.json`, `.specs/02-architecture.md`, SPEC-008 |

## Contexto

Bomberman debe ser «muy gráfico y llamativo»: explosiones en cruz con luz y partículas, sombras, brillo y sacudidas de cámara. Con casillas DOM y animaciones CSS (como Tetris) las explosiones y las
partículas quedan pobres, y un canvas 2D a mano obliga a reescribir iluminación, brillo y partículas. El sitio sigue siendo estático en GitHub Pages (P1): todo debe compilar a ficheros.

## Decisión

Se usa **Three.js** (`three`, con `@types/three` en desarrollo) para dibujar el juego con WebGL, con el post-proceso de `three/addons` (`EffectComposer`, `UnrealBloomPass`, `OutputPass`) para el
brillo. Las reglas del juego **no** dependen de Three.js: viven en un motor puro (`bomberman.engine.ts`) y el renderer (`bomberman.renderer.ts`) solo pinta el estado y los eventos que recibe.

Three.js se importa únicamente desde el renderer, que solo importa el componente del juego, cargado de forma perezosa (P3): queda en el chunk del juego y no entra en el paquete inicial. El renderer
libera geometrías, materiales, el compositor y el contexto WebGL en `dispose()` (P9).

## Alternativas consideradas

| Alternativa              | Ventajas                            | Por qué se descartó                                                  |
| ------------------------ | ----------------------------------- | -------------------------------------------------------------------- |
| Rejilla DOM + Tailwind   | Accesible y sin dependencias        | Explosiones, luz y partículas muy pobres; no cumple «llamativo».     |
| Canvas 2D propio         | Sin dependencias, chunk más pequeño | Hay que escribir a mano brillo, sombras y partículas; menos vistoso. |
| Motor de juegos completo | Física, escenas, herramientas       | Peso y API desproporcionados para un juego de rejilla.               |

## Consecuencias

**A favor:** aspecto de primera con poco código propio; el motor sigue siendo puro y testeable sin WebGL; ningún coste para quien no abre Bomberman.

**En contra:** el chunk del juego pesa del orden de medio megabyte; hace falta WebGL (si falta, el juego avisa en lugar de quedar en blanco); jsdom no tiene WebGL, así que el dibujo se verifica a mano
y los tests cubren el motor y el componente.

**Compromisos que impone:** el renderer nunca decide reglas; Three.js no se importa fuera de `games/<id>/`; todo lo que se crea se libera al destruir el componente; con `prefers-reduced-motion` se
reducen sacudidas, partículas y brillo.

## Revisión

Si otro juego necesita 3D, extraer lo común (compositor, ciclo de vida) a `core/`. Si el chunk crece mucho, valorar importar solo los módulos usados de Three.js.
