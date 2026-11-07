# SPEC-008 — Bomberman

| Campo           | Valor                                                                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Estado**      | implementada                                                                                                                                                                   |
| **Componentes** | `BombermanComponent` (`src/app/games/bomberman/`)                                                                                                                              |
| **Ruta**        | `/games/bomberman`                                                                                                                                                             |
| **Depende de**  | SPEC-003, SPEC-005, ADR-008                                                                                                                                                    |
| **Lógica**      | `bomberman.levels.ts` (arena y niveles), `bomberman.logic.ts` (cruz de la explosión, movimiento), `bomberman.ai.ts` (enemigos), `bomberman.engine.ts`, `bomberman.renderer.ts` |

## Propósito

Jugar un Bomberman en el navegador, muy vistoso: un bombardero pone bombas que revientan en **cruz, sobre los ejes X e Y**, y limpia de bloques y enemigos una arena en 3D.

## Actores

Una persona jugando sola contra enemigos con IA; compite contra su propio récord.

## Requisitos funcionales

- **RF-01** — Arena de 15×13 casillas: borde y pilares fijos (casillas con ambas coordenadas pares) y bloques rompibles al azar. La zona de salida del jugador (esquina superior izquierda) está siempre
  libre.
- **RF-02** — El jugador se mueve con libertad por la arena (no salta de casilla en casilla) y **se desliza por las esquinas** hacia el centro del pasillo. Velocidad base de 5 casillas por segundo y
  caja de colisión de 0,72 casillas, que cabe holgada por los pasillos.
- **RF-03** — Pone una bomba en su casilla. Por defecto una a la vez; la mecha dura 2 s. Puede salir de la bomba que acaba de poner, pero no volver a cruzarla.
- **RF-04** — **Explosión en cruz**: la llama sale del centro hacia arriba, abajo, izquierda y derecha, hasta el alcance (2 casillas por defecto). Un **muro fijo** corta el brazo. Un **bloque
  rompible** arde y se destruye (+10), pero frena el brazo: la llama no lo atraviesa. La llama dura 0,5 s.
- **RF-05** — **Reacción en cadena**: una llama que alcanza otra bomba la hace estallar al instante.
- **RF-06** — Tres enemigos: **Globo** (deambula, sigue recto y gira en cruces), **Fantasma** (atraviesa bloques, más lento) y **Cazador** (persigue al jugador por el camino más corto y evita las
  casillas que arden o van a arder). Ninguno cruza bombas. Los enemigos mueren en la llama. Velocidades: Globo 2,6, Fantasma 1,9 y Cazador 3,8 casillas/s: siempre se puede huir de ellos.
- **RF-07** — Puntos por enemigo: Globo 100, Fantasma 200, Cazador 400. Cada muerte seguida en la misma explosión duplica el valor de la siguiente (×2, ×4, ×8 como máximo).
- **RF-08** — Tocar a un enemigo o estar en una llama quita una vida; el jugador reaparece en la salida con 2,5 s de invulnerabilidad (parpadea). Empieza con 3 vidas; sin vidas termina la partida.
- **RF-09** — **Mejoras** escondidas bajo bloques: +1 bomba (máx. 6), +1 alcance (máx. 8) y velocidad (+0,6 casillas/s cada una, máx. 7,4), +50 puntos cada una. Se conservan al cambiar de nivel.
- **RF-10** — La **salida** (portal) está escondida bajo un bloque lejano. Se abre cuando mueren todos los enemigos; entrar con la salida abierta supera el nivel (+ 10 por segundo que sobre + 500 ×
  nivel).
- **RF-11** — Cada nivel dura 180 s. Si el reloj llega a cero se pierde una vida y se concede una prórroga de 60 s. Los niveles siguientes traen más enemigos y más duros, y más bloques.
- **RF-12** — **Teclado**: ← ↑ ↓ → / WASD mover (manda la última tecla pulsada), Espacio / X bomba, P / Esc pausa. Solo se interceptan estas teclas, y solo durante la partida y fuera de campos de
  texto.
- **RF-13** — **Botones en pantalla** (cruceta y bomba), cada uno un `<button>` con nombre accesible; visibles de entrada en dispositivos de puntero táctil y activables en ajustes. Mover se mantiene
  mientras se pulsa; con teclado (Enter/Espacio) la bomba actúa una vez.
- **RF-14** — **Mando** (Gamepad API): cruceta o stick izquierdo mover, A / X bomba, Start pausa.
- **RF-15** — **Pausa** con botón, P / Esc o Start; también automática al ocultar la pestaña o perder el foco. En pausa la música se detiene y el juego no avanza.
- **RF-16** — Al terminar se muestra «¡Fin del juego!» con puntos y nivel; el **récord** se guarda entre visitas (`bomberman-best`) y, si se supera, se avisa («¡Nuevo récord!») con confeti.
- **RF-17** — Ajustes recordados entre visitas: música y su volumen, efectos y su volumen, botones en pantalla. Música en bucle (`theme_game.mp3`, `AudioService`); efectos sintetizados con
  `SfxService` (explosión, bomba puesta, mejora, golpe). Una cadena de bombas suena como una sola explosión. Al salir de la pantalla se cancela el bucle de dibujo, se liberan los temporizadores, el
  renderer y todo sonido (P9).
- **RF-18** — Accesibilidad: el lienzo es `role="img"` con una etiqueta que resume nivel, vidas, enemigos y puntos; una región `aria-live="polite"` anuncia bajas, mejoras, golpes, nivel superado y
  fin; un panel plegable «¿Cómo se juega?» lista controles y enemigos.
- **RF-19** — Si el navegador no tiene WebGL se muestra un aviso («No se pudo dibujar el juego») y no queda un lienzo en blanco.
- **RF-20** — Un botón de flecha vuelve a `/home`.

## Reglas de contenido

Textos en español. El motor (`step(state, action, rng)`) es puro y recibe el generador aleatorio: con la misma semilla y las mismas acciones, el mismo resultado. El renderer solo pinta; no decide
reglas.

## Comportamiento visual

Arena 3D con cámara muy cenital (67°, 72° en vertical) que encuadra todo el tablero sin recortar muros y sin deformar la fila cercana (se adapta a pantallas verticales y anchas), suelo en damero,
muros con borde de neón, bloques caramelo que entran con rebote, bombas que laten más rápido al acabarse la mecha, bombardero low-poly con casco y antena luminosa, y enemigos con el color de su tipo.
Las explosiones brotan del centro y recorren cada brazo de la cruz con luz puntual, onda de choque en el suelo, chispas y sacudida de cámara; los bloques saltan en pedazos. Brillo (bloom), sombras de
2048 px, polvo flotante de ambiente y **antialiasing MSAA ×4** a la densidad de píxeles de la pantalla (sin bordes dentados). Bloques y muros de aristas redondeadas, personajes grandes con contorno
oscuro y anillo luminoso en el suelo (cian el jugador, rojo los enemigos) para distinguirlos al instante. Pantallas de inicio, pausa, nivel superado y fin con rebote. Con `prefers-reduced-motion` se
eliminan las sacudidas y se reducen partículas y brillo.

## Criterios de aceptación

- **CA-01** — Dado que no he iniciado sesión, cuando abro `/games/bomberman` y pulso «¡Jugar!», entonces veo la arena y puedo moverme y poner una bomba.
- **CA-02** — Dado un pilar junto a la bomba, cuando explota, entonces la llama no pasa del pilar; dado un bloque, entonces lo destruye y no avanza más allá.
- **CA-03** — Dado un enemigo en la misma fila o columna que la bomba y dentro del alcance, cuando explota, entonces muere y suma puntos; fuera de la cruz, no.
- **CA-04** — Dadas dos bombas en la misma línea, cuando explota una, entonces explota también la otra.
- **CA-05** — Dado que muero con la última vida y supero mi récord, entonces veo «¡Nuevo récord!» y al recargar el récord se conserva.
- **CA-06** — Dada una partida en curso, cuando cambio de pestaña, entonces el juego queda en pausa.
- **CA-07** — Dada música sonando, cuando pulso «Terminar» o salgo de la pantalla, entonces todo sonido se detiene.
- **CA-08** — Dado que mueren todos los enemigos, cuando entro en el portal, entonces supero el nivel y puedo seguir con el siguiente conservando vidas y mejoras.

## Fuera de alcance

Multijugador (local o en línea), tabla de récords global, persistir partidas a medias, remapear teclas, bombas que se empujan o se detonan a distancia, jefes.
