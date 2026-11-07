# ADR-006 — Tailwind con primitivas propias, sin Material ni Bootstrap

| Campo        | Valor                                                                              |
| ------------ | ---------------------------------------------------------------------------------- |
| **Estado**   | aceptada                                                                           |
| **Fecha**    | 2026-11-06                                                                         |
| **Afecta a** | `src/styles.css`, `.postcssrc.json`, `angular.json`, `src/app/core/ui/`, pantallas |

## Contexto

El producto pasa a ser un portal de juegos de aspecto arcade, colorido y moderno. Angular Material (tema `indigo-pink`) y Bootstrap dan un aspecto de aplicación de formularios, se pisaban entre sí
(resets, rejilla) y sumaban peso y CSS prebuilt que había que sobrescribir con `!important`.

## Decisión

Tailwind CSS v4 (`@tailwindcss/postcss`) como única base de estilos, con el tema neón definido en `@theme` de `styles.css`. Los pocos controles necesarios se escriben como primitivas en `core/ui/`
(botón, panel, interruptor, campo, avisos) sobre elementos nativos. Iconos con `lucide-angular`, fuentes autoalojadas con Fontsource, confeti con `canvas-confetti` cargado al vuelo. Se retiran
`bootstrap`, `@angular/material`, `@angular/cdk` y `@angular/animations`.

## Alternativas consideradas

| Alternativa                         | Ventajas          | Por qué se descartó                                     |
| ----------------------------------- | ----------------- | ------------------------------------------------------- |
| Tailwind + Material (sin Bootstrap) | Menos reescritura | Dos sistemas visuales; tema oscuro de Material costoso. |
| Tailwind sobre todo lo existente    | Cambio mínimo     | Choques de reset y bundle más pesado.                   |

## Consecuencias

**A favor:** identidad visual propia, bundle inicial menor (≈ 240 kB transferidos), controles nativos accesibles, sin Google Fonts remotas.

**En contra:** hay que mantener las primitivas (interruptor, campo, avisos) y la accesibilidad es responsabilidad nuestra.

**Compromisos que impone:** las clases de Tailwind se escriben completas (no interpoladas); el estilo nuevo va en utilidades o en `styles.css`, no en SCSS por componente.

## Revisión

Si el número de controles propios crece mucho (selects personalizados, diálogos): valorar una librería headless.
