# SPEC-004 — Tres en línea

| Campo           | Valor                                               |
| --------------- | --------------------------------------------------- |
| **Estado**      | implementada                                        |
| **Componentes** | `TicTacToeComponent` (`src/app/games/tic-tac-toe/`) |
| **Ruta**        | `/games/tic-tac-toe`                                |
| **Librería**    | `tic-tac-toe-minimax` (`GameStep`)                  |
| **Depende de**  | SPEC-003, SPEC-005                                  |

## Propósito

Jugar al tres en línea contra un robot, con dificultad y sonido configurables.

## Actores

La persona juega con **X**; el robot, con **O**.

## Requisitos funcionales

- **RF-01** — Antes de empezar se ve el botón «Empezar». Mientras se juega se ven «Reiniciar» y «Terminar».
- **RF-02** — Tablero de 9 casillas. Pulsar una casilla libre pone **X** y, tras 250 ms, el robot responde con **O**. Una casilla ocupada o una pulsación sin partida en curso no hacen nada.
- **RF-03** — Cada casilla se puede operar con teclado (Enter o Espacio) y tiene nombre accesible («Casilla N»).
- **RF-04** — Ajustes en un panel desplegable: **quién empieza** (por defecto, el robot), **dificultad** (Fácil, Normal por defecto, Difícil), **sonido al terminar** y **sonido durante el juego**,
  cada uno con interruptor y volumen 0–100.
- **RF-05** — Al terminar la partida se muestra el resultado: «¡Ganaste tú 🧑!», «¡Ganó el robot 🤖!» o «¡Es un empate!», y no se aceptan más jugadas.
- **RF-06** — «Reiniciar» limpia el tablero y empieza otra partida con los ajustes actuales. «Terminar» limpia el tablero, vuelve a «Empezar» y detiene todo sonido.
- **RF-07** — Con «sonido durante el juego» activo, suena la música en bucle desde que empieza la partida; al terminar, se corta y suena el efecto final si «sonido al terminar» está activo (SPEC-005).
- **RF-08** — Al salir de la pantalla se detiene todo sonido (P9).
- **RF-09** — Un botón de flecha vuelve a `/home`.

## Reglas de contenido

Textos en español. Rutas de audio: `assets/sounds/theme_game.mp3` y `assets/sounds/end_game.mp3`.

## Comportamiento visual

El tablero está dentro de una rejilla de Material; con ventanas muy estrechas (≤ 319 px) cambia el número de columnas.

## Criterios de aceptación

- **CA-01** — Dado «El robot empieza primero» activo, cuando pulso «Empezar», entonces ya hay una **O** en el tablero.
- **CA-02** — Dado una partida en curso, cuando completo una línea, entonces veo «¡Ganaste tú 🧑!» y no puedo seguir jugando.
- **CA-03** — Dado una casilla con **X**, cuando la pulso otra vez, entonces no cambia nada.
- **CA-04** — Dado que enfoco una casilla con Tab, cuando pulso Enter, entonces juego esa casilla.
- **CA-05** — Dado música de fondo sonando, cuando pulso «Terminar», entonces el sonido se detiene.

## Fuera de alcance

Tablero de otro tamaño, dos jugadores humanos, marcador acumulado, persistir ajustes entre visitas.

## Deuda conocida

- El tablero se reconstruye con literales repetidos en el componente.
- Tipos `any` en `gameState` y el mapeo de ganadores; `@ts-ignore` en la importación de la librería.
- La lógica de la partida no está separada del componente, así que solo se prueba que el componente se crea.
