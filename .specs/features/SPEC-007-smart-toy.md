# SPEC-007 — Smart toy

| Campo           | Valor                                                             |
| --------------- | ----------------------------------------------------------------- |
| **Estado**      | implementada                                                      |
| **Componentes** | `SmartToyComponent` (`src/app/games/smart-toy/`)                  |
| **Ruta**        | `/games/smart-toy`                                                |
| **Depende de**  | SPEC-003                                                          |
| **Lógica**      | `smart-toy.logic.ts` (árbol de decisión, aprendizaje, validación) |

## Propósito

Un juguete que adivina el animal en el que piensas con preguntas de sí/no y, cuando falla, aprende de ti: cada partida perdida lo hace más listo.

## Actores

Una persona jugando sola.

## Requisitos funcionales

- **RF-01** — El conocimiento es un árbol binario: nodo pregunta (`¿…?` con ramas sí/no) u hoja animal. Hay un árbol inicial de 8 animales.
- **RF-02** — Tras «¡Listo!» el juguete pregunta recorriendo el árbol según las respuestas (Sí/No o teclas S/N) hasta llegar a una hoja, y entonces propone «¿Estás pensando en: X?».
- **RF-03** — Si la persona confirma, el juguete gana: suma «Adivinó», suena el efecto y hay confeti.
- **RF-04** — Si no, pide el animal, una pregunta que lo distinga del propuesto y la respuesta a ella para el animal nuevo. Al enseñar, la hoja se sustituye por esa pregunta con ambos animales; suma
  «Aprendió».
- **RF-05** — Validación: el animal y la pregunta son obligatorios; un animal ya conocido (sin distinguir mayúsculas ni tildes) se rechaza. El animal se guarda con inicial mayúscula y la pregunta
  entre ¿ ?.
- **RF-06** — El árbol, el marcador y el ajuste de efectos se guardan entre visitas. Un árbol guardado inválido se descarta y se usa el inicial.
- **RF-07** — «Olvidar lo aprendido» (doble pulsación) restaura el árbol inicial y borra el marcador.
- **RF-08** — Los atajos S/N solo actúan mientras el juguete pregunta y fuera de campos de texto.
- **RF-09** — Accesibilidad: lo que dice el juguete está en una región `aria-live="polite"`; el formulario usa etiquetas y errores con `role="alert"`.
- **RF-10** — Al salir de la pantalla se detiene todo sonido (P9). Un botón de flecha vuelve a `/home`.

- **RF-11** — Mientras pregunta, el juguete muestra el hilo de preguntas ya contestadas (con su Sí/No) y los botones Sí/No ocupan todo el ancho. El atajo «S/N» solo se anuncia en pantallas anchas. La
  respuesta del animal nuevo se elige con un control segmentado Sí/No.

## Reglas de contenido

Textos en español. El motor es puro e inmutable: `teach` devuelve un árbol nuevo.

## Comportamiento visual

Panel de vidrio (máx. 28 rem). El robot flota mientras espera y rebota al acertar o aprender; lo que dice aparece en un globo con altura mínima fija (sin saltos) que parte las palabras largas. Botones
principales a todo el ancho. Con `prefers-reduced-motion` las animaciones se reducen al mínimo.

## Criterios de aceptación

- **CA-01** — Dado que no he iniciado sesión, cuando abro `/games/smart-toy` y pulso «¡Listo!», entonces el juguete me hace una pregunta.
- **CA-02** — Dado que el juguete propone «Rana» y no es mi animal, cuando le enseño «Sapo» con una pregunta, entonces en la siguiente partida esa pregunta aparece en ese camino.
- **CA-03** — Dado que enseñé un animal, cuando recargo la página, entonces «Animales» conserva el total.
- **CA-04** — Dado que escribo un animal ya conocido, cuando pulso «Enseñar», entonces veo el aviso y no se guarda.

## Fuera de alcance

Sincronizar lo aprendido entre dispositivos o cuentas, otras categorías además de animales, editar o borrar preguntas sueltas, multijugador.
