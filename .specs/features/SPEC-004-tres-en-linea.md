# SPEC-004 — Tres en línea

| Campo           | Valor                                                |
| --------------- | ---------------------------------------------------- |
| **Estado**      | implementada                                         |
| **Componentes** | `TicTacToeComponent` (`src/app/games/tic-tac-toe/`)  |
| **Ruta**        | `/games/tic-tac-toe`                                 |
| **Librería**    | `tic-tac-toe-minimax` (`GameStep`)                   |
| **Depende de**  | SPEC-003, SPEC-005                                   |
| **Lógica**      | `tic-tac-toe.logic.ts` (`winningLine`, `emptyBoard`) |

## Propósito

Jugar al tres en línea contra un robot o con otra persona en el mismo dispositivo, con marcador, fichas y sonido configurables.

## Actores

En «Contra el robot», la persona juega con la primera ficha (**X**) y el robot con la segunda (**O**). En «2 jugadores», Jugador 1 usa X y Jugador 2 usa O; quién empieza se alterna en cada partida.

## Requisitos funcionales

- **RF-01** — Antes de empezar se ve el botón «¡Empezar!». Mientras se juega se ven «Reiniciar» y «Terminar».
- **RF-02** — Tablero de 9 casillas. Pulsar una casilla libre pone **X** y, tras 250 ms, el robot responde con **O**. Una casilla ocupada, una pulsación sin partida en curso o durante el turno del
  robot no hacen nada.
- **RF-03** — Cada casilla es un `<button>` nativo (teclado gratis) con nombre accesible («Casilla N, vacía|X|O»); está deshabilitado sin partida o en turno del robot.
- **RF-04** — Ajustes en un panel plegable (botón con `aria-expanded`): **fichas** (Clásico X/O, Mascotas 🐱/🐶, Antojos 🍕/🍩, Espacio 🚀/🪐), y en modo robot **quién empieza** (por defecto, el
  robot) y **dificultad** (Fácil, Normal por defecto, Difícil); además **sonido al terminar** y **sonido durante el juego**, cada uno con interruptor y volumen 0–100. Todos los ajustes y el modo se
  recuerdan entre visitas (`PreferencesService`).
- **RF-10** — Un control segmentado elige el **modo**: «Contra el robot» o «2 jugadores». Se bloquea mientras hay partida. En 2 jugadores no interviene la IA y se alternan los turnos.
- **RF-11** — Un **marcador** por modo se guarda entre visitas: ganadas, perdidas y empates, **racha** de victorias (se rompe con derrota o empate) y mejor racha. En 2 jugadores las columnas son J1,
  J2 y empates. «Borrar marcador» pide una segunda pulsación para confirmar.
- **RF-12** — Teclado: las teclas **1–9** juegan la casilla con la disposición del teclado numérico (7 8 9 arriba) en cualquier momento, salvo al escribir en un campo; las **flechas** mueven el foco
  por el tablero (sin dar la vuelta) y Enter/Espacio juega.
- **RF-13** — Efectos de colocación mediante `SfxService` (SPEC-005), controlados por «sonido durante el juego».
- **RF-05** — Al terminar la partida se muestra el resultado: «¡Ganaste tú 🧑!», «¡Ganó el robot 🤖!» o «¡Es un empate!», y no se aceptan más jugadas. Las tres casillas de la línea ganadora se
  resaltan. La línea ganadora se traza con una línea SVG animada. Si gana la persona (o cualquiera en 2 jugadores), se lanza confeti (`CelebrationService`; omitido con `prefers-reduced-motion`). En 2
  jugadores el mensaje es «¡Ganó el Jugador N 🎉!». El botón pasa a «Jugar otra vez».
- **RF-06** — «Reiniciar» limpia el tablero y empieza otra partida con los ajustes actuales. «Terminar» limpia el tablero, vuelve a «Empezar» y detiene todo sonido.
- **RF-07** — Con «sonido durante el juego» activo, suena la música en bucle desde que empieza la partida; al terminar, se corta y suena el efecto final si «sonido al terminar» está activo (SPEC-005).
- **RF-08** — Al salir de la pantalla se detiene todo sonido y se cancela la jugada pendiente del robot (P9).
- **RF-09** — Un botón de flecha vuelve a `/home`.

## Reglas de contenido

Textos en español. Rutas de audio: `assets/sounds/theme_game.mp3` y `assets/sounds/end_game.mp3`.

## Comportamiento visual

Panel de vidrio centrado (máx. 28 rem). Dos tarjetas de jugador (ficha, nombre y «¡Tu turno!» / «Pensando…» con puntos animados) que pulsan con el color del turno (cian / rosa). Tablero 3×3 fluido:
casillas con relieve, ficha fantasma al pasar el cursor o enfocar, fichas que entran con rebote, línea ganadora trazada, empate con meneo. Tarjeta de resultado con emoji grande. Marcador con tiles de
estadística bajo el tablero.

## Criterios de aceptación

- **CA-01** — Dado «El robot empieza primero» activo, cuando pulso «Empezar», entonces ya hay una **O** en el tablero.
- **CA-02** — Dado una partida en curso, cuando completo una línea, entonces veo «¡Ganaste tú 🧑!» y no puedo seguir jugando.
- **CA-03** — Dado una casilla con **X**, cuando la pulso otra vez, entonces no cambia nada.
- **CA-04** — Dado que enfoco una casilla con Tab, cuando pulso Enter, entonces juego esa casilla.
- **CA-06** — Dado que gano, entonces veo confeti y la línea ganadora resaltada.
- **CA-07** — Dado que no he iniciado sesión, cuando abro `/games/tic-tac-toe`, entonces puedo jugar.
- **CA-08** — Dado el modo «2 jugadores», cuando pulso casillas seguidas, entonces se alternan X y O sin respuesta del robot.
- **CA-09** — Dado que gano una partida, cuando recargo la página, entonces el marcador conserva la victoria y la racha.
- **CA-10** — Dado una partida en curso, cuando pulso la tecla 7, entonces juego la casilla superior izquierda.
- **CA-05** — Dado música de fondo sonando, cuando pulso «Terminar», entonces el sonido se detiene.

## Fuera de alcance

Tablero de otro tamaño, juego en línea entre dos dispositivos, marcador global entre personas.

## Deuda conocida

- `@ts-ignore` en la importación de `tic-tac-toe-minimax` (sin tipos); se resuelve con un `d.ts` propio o sustituyendo la librería.
- La IA (`GameStep`) sigue dentro del componente; solo `winningLine` está separada y probada.
