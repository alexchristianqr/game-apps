# SPEC-005 — Audio de los juegos

| Campo          | Valor                                           |
| -------------- | ----------------------------------------------- |
| **Estado**     | implementada                                    |
| **Servicio**   | `AudioService` (`src/app/core/services/audio/`) |
| **Depende de** | —                                               |

## Propósito

Un único sitio para reproducir sonidos, que garantiza que nunca queda uno sonando al salir de un juego.

## Requisitos funcionales

- **RF-01** — Hay dos canales independientes: **bucle** (música de fondo) y **efecto** (sonido corto).
- **RF-02** — `playLoop(src, volume)` detiene el bucle anterior y reproduce en bucle. `volume` va de 0 a 100.
- **RF-03** — `playEffect(src, volume, maxMs = 2000)` detiene el efecto anterior, lo reproduce y lo corta solo a los `maxMs`.
- **RF-04** — `stopLoop`, `stopEffect` y `stopAll` detienen y liberan el audio correspondiente; `stopEffect` cancela también el temporizador.
- **RF-05** — Al destruirse el servicio se detiene todo.
- **RF-07** — `SfxService` (`core/services/sfx/`) sintetiza efectos cortos con Web Audio (mover, girar, colocar, caída, guardar, limpiar líneas, subir de nivel, ganar, perder), sin archivos. Tiene
  `volume` (0–100) y `muted`; el `AudioContext` se crea en el primer sonido (tras un gesto) y se cierra al destruir el servicio. Si el navegador no lo soporta, no suena nada y el juego continúa.
- **RF-06** — Si el navegador rechaza reproducir (política de autoplay), el error se registra en consola y la partida continúa.

## Reglas de contenido

Los componentes de juego usan este servicio; ninguno crea `Audio` por su cuenta (ver convenciones).

## Criterios de aceptación

- **CA-01** — Dado un efecto en curso, cuando llamo a `playEffect` de nuevo, entonces solo suena el nuevo.
- **CA-02** — Dado un efecto de 2 s por defecto, cuando pasan 2 s, entonces se detiene solo.

## Fuera de alcance

Mezclador global, silenciar toda la aplicación, precarga de audios.

## Deuda conocida

`AudioService` y `SfxService` no tienen tests propios.
