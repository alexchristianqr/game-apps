# Plan técnico — <NNN-slug>

> Se escribe después de que `spec.md` esté cerrada. Aquí sí se habla de archivos, funciones y estructuras: es el «cómo».

## Resumen

Dos o tres frases sobre el enfoque elegido.

## Requisitos cubiertos

`RF-01`, `RF-02`, …

## Cambios previstos

| Archivo | Acción                    | Detalle |
| ------- | ------------------------- | ------- |
| `…`     | crear / editar / eliminar | …       |

## Contratos

Interfaces, servicios, rutas o entradas del registro nuevas o modificadas.

## Impacto

- **Especificaciones a actualizar:** SPEC-NNN …
- **Capas afectadas:** respeta la dirección de `02-architecture.md`.
- **Riesgo de regresión:** qué se puede romper y cómo se comprueba.

## Alternativas descartadas

| Alternativa | Por qué no |
| ----------- | ---------- |
| …           | …          |

## Decisiones que requieren ADR

Si el plan introduce una dependencia, cambia el stack, las capas o el despliegue, se enlaza aquí el ADR. Si no hay ninguna, «Ninguna».

## Verificación

Comandos y comprobaciones manuales concretas, además de la puerta de calidad de [`04-workflows.md`](../04-workflows.md).
