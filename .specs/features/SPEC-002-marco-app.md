# SPEC-002 — Marco de la aplicación

| Campo           | Valor          |
| --------------- | -------------- |
| **Estado**      | implementada   |
| **Componentes** | `AppComponent` |
| **Depende de**  | SPEC-001       |

## Propósito

Dar a todas las pantallas una cabecera común y un camino de vuelta a Inicio o de salida.

## Requisitos funcionales

- **RF-01** — Una barra superior con el título «GAME APPS» y un botón que lleva a `/`.
- **RF-02** — Una segunda barra con «Inicio» (`/home`) a la izquierda y «Salir» a la derecha, **solo si hay sesión** (`isAuthenticated`).
- **RF-03** — «Salir» ejecuta el cierre de sesión de SPEC-001.
- **RF-04** — Debajo de las barras se muestra la pantalla de la ruta activa.

## Comportamiento visual

Barras de Angular Material (`primary` y `accent`) separadas por un divisor transparente. Iconos de Material Icons.

## Criterios de aceptación

- **CA-01** — Dado que no hay sesión, cuando veo `/login`, entonces no aparecen «Inicio» ni «Salir».
- **CA-02** — Dado que hay sesión, cuando pulso «Inicio», entonces llego a `/home`.

## Fuera de alcance

Menú de usuario, avatar, cambio de tema.
