# SPEC-002 — Marco de la aplicación

| Campo           | Valor                                  |
| --------------- | -------------------------------------- |
| **Estado**      | implementada                           |
| **Componentes** | `AppComponent`, `ToastOutletComponent` |
| **Depende de**  | SPEC-001                               |

## Propósito

Dar a todas las pantallas una cabecera común, un fondo con identidad de juego y un camino de vuelta a Inicio, de entrada o de salida.

## Requisitos funcionales

- **RF-01** — Una cabecera fija con el logo (icono y «GAME APPS») que lleva a `/home`, y un enlace «Juegos» a `/home`.
- **RF-02** — A la derecha, **sin sesión** el botón «Entrar» (`/login`); **con sesión** el botón «Salir» (`isAuthenticated`).
- **RF-03** — «Salir» ejecuta el cierre de sesión de SPEC-001.
- **RF-04** — Debajo de la cabecera se muestra la pantalla de la ruta activa; al final, un pie con el enlace al código en GitHub.
- **RF-05** — Un punto de avisos global (`app-toast-outlet`) muestra los mensajes de `ToastService` durante 3 s, anunciados con `aria-live="polite"`.

## Comportamiento visual

Tema neón oscuro (ADR-006): fondo con rejilla y manchas de degradado animadas, cabecera de vidrio, tipografía Orbitron para títulos e Inter para texto. Los cambios de ruta usan View Transitions. Con
`prefers-reduced-motion` no hay animaciones.

## Criterios de aceptación

- **CA-01** — Dado que no hay sesión, cuando veo cualquier pantalla, entonces aparece «Entrar» y no «Salir».
- **CA-02** — Dado que hay sesión, cuando pulso el logo, entonces llego a `/home`.
- **CA-03** — Dado un aviso, cuando pasan 3 s, entonces desaparece.

## Fuera de alcance

Menú de usuario, avatar, cambio de tema claro/oscuro.
