# SPEC-006 — Tetris

| Campo           | Valor                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------- |
| **Estado**      | implementada                                                                                |
| **Componentes** | `TetrisComponent` (`src/app/games/tetris/`)                                                 |
| **Ruta**        | `/games/tetris`                                                                             |
| **Depende de**  | SPEC-003, SPEC-005                                                                          |
| **Lógica**      | `tetris.pieces.ts` (piezas, kicks), `tetris.logic.ts` (tablero, puntos), `tetris.engine.ts` |

## Propósito

Jugar al Tetris en el navegador, con teclado, pantalla táctil, botones en pantalla o mando, y un aspecto colorido y amable.

## Actores

Una persona jugando sola; compite contra su propio récord.

## Requisitos funcionales

- **RF-01** — Tablero de 10×20 visibles (más 2 filas ocultas donde aparecen las piezas), 7 piezas (I O T S Z J L) sacadas de una **bolsa de 7** barajada.
- **RF-02** — Rotación con las tablas de **wall kick** del Super Rotation System: girar junto a una pared o sobre la pila desplaza la pieza si hace falta. La pieza O no usa kicks.
- **RF-03** — **Pieza fantasma** (activable en ajustes) que muestra dónde caería.
- **RF-04** — **Guardar** una pieza (una vez por pieza); si ya había una guardada, se intercambian.
- **RF-05** — Se ven las **3 siguientes** piezas y la guardada.
- **RF-06** — Puntos: sencilla 100, doble 300, triple 500, Tetris 800 (× nivel); un Tetris seguido de otro puntúa ×1.5; combo de líneas seguidas 50 × combo × nivel; +1 por fila de caída suave y +2 por
  fila de caída rápida.
- **RF-07** — El nivel sube cada 10 líneas a partir del **nivel inicial** (1–10, ajustable fuera de partida); la gravedad sigue la curva de la guía oficial con mínimo de 16 ms por fila.
- **RF-08** — Una pieza apoyada se fija a los 500 ms; mover o girar la pieza apoyada reinicia ese tiempo hasta 15 veces.
- **RF-09** — La partida termina si una pieza nueva no cabe o se fija entera en las filas ocultas. Se muestra «¡Fin del juego!» con puntos y líneas; el **récord** se guarda entre visitas y, si se
  supera, se avisa («¡Nuevo récord!») con confeti.
- **RF-10** — **Teclado**: ← → / A D mover (mantener repite: espera 150 ms, luego cada 45 ms), ↓ / S bajar despacio, Espacio caída rápida, ↑ / X girar a la derecha, Z a la izquierda, C / Shift
  guardar, P / Esc pausa. Solo se interceptan estas teclas, y solo durante la partida y fuera de campos de texto.
- **RF-11** — **Táctil** sobre el tablero: toque gira; deslizar ← → mueve una columna por cada ancho de casilla; deslizar ↓ baja despacio; gesto rápido hacia abajo es caída rápida; gesto rápido hacia
  arriba guarda.
- **RF-12** — **Botones en pantalla** (izquierda, girar, derecha, bajar, caída rápida, guardar), cada uno un `<button>` con nombre accesible. Visibles de entrada en dispositivos de puntero táctil; se
  activan o desactivan en ajustes. Mover y bajar se repiten mientras se mantienen pulsados; con teclado (Enter/Espacio) actúan una vez.
- **RF-13** — **Mando** (Gamepad API): cruceta o stick izquierdo mover, A girar, B girar a la izquierda, X o ↑ caída rápida, LB/RB guardar, Start pausa.
- **RF-14** — **Pausa** con botón, P / Esc o Start; también automática al ocultar la pestaña o perder el foco. En pausa la música se detiene, el reloj no avanza y no se aceptan jugadas.
- **RF-15** — Ajustes recordados entre visitas: nivel inicial, fantasma, botones en pantalla, música y su volumen, efectos y su volumen. Los de música se aplican al empezar la siguiente partida.
- **RF-16** — Música en bucle (`theme_game.mp3`, `AudioService`) durante la partida si está activada; efectos con `SfxService`. Al salir de la pantalla se cancela el bucle de animación, se liberan los
  temporizadores y se detiene todo sonido (P9).
- **RF-17** — Accesibilidad: el tablero es `role="img"` con una etiqueta que resume puntos, nivel y líneas; una región `aria-live="polite"` anuncia líneas, subidas de nivel, pausa y fin; un panel
  plegable «¿Cómo se juega?» lista los controles.
- **RF-18** — Un botón de flecha vuelve a `/home`.

## Reglas de contenido

Textos en español. Colores caramelo por pieza: I celeste, O amarilla, T uva, S verde, Z roja, J azul, L naranja. El motor (`step(state, action, rng)`) es puro y recibe el generador aleatorio: con la
misma semilla, la misma secuencia.

## Comportamiento visual

Panel de vidrio (máx. 42 rem). En pantallas estrechas el tablero queda entre dos columnas pequeñas (guardada y siguientes) y las estadísticas arriba; en anchas, columnas laterales mayores. Las
miniaturas de guardada y siguientes van centradas en su recuadro y las cifras de las estadísticas usan la fuente de texto (Orbitron dibuja el cero tachado). Bloques con relieve y brillo
(`candy-block`). Efectos: destello de las filas limpiadas, texto flotante («¡TETRIS! +800», «Combo ×2», «Nivel 3 🚀»), sacudida al caer rápido, confeti al limpiar 2 o más líneas, pantallas de inicio
(piezas flotando), pausa y fin con rebote. Con `prefers-reduced-motion` las animaciones se reducen al mínimo.

## Criterios de aceptación

- **CA-01** — Dado que no he iniciado sesión, cuando abro `/games/tetris` y pulso «¡Jugar!», entonces cae una pieza y puedo moverla.
- **CA-02** — Dado una fila casi completa, cuando la completo, entonces desaparece, suma puntos y veo el destello.
- **CA-03** — Dado una partida en curso, cuando cambio de pestaña, entonces el juego queda en pausa.
- **CA-04** — Dado que supero mi récord, cuando pierdo, entonces veo «¡Nuevo récord!» y al recargar el récord se conserva.
- **CA-05** — Dado un móvil, cuando deslizo el dedo sobre el tablero, entonces la pieza se mueve y un toque la gira.
- **CA-06** — Dado música sonando, cuando pulso «Terminar» o salgo de la pantalla, entonces todo sonido se detiene.

## Fuera de alcance

Modos extra (Maratón, Sprint, Zen), T-spins, multijugador, tabla de récords global, persistir partidas a medias, remapear teclas.
