# ADR-004 — Builder esbuild y Vitest

| Campo        | Valor                                             |
| ------------ | ------------------------------------------------- |
| **Estado**   | aceptada                                          |
| **Fecha**    | 2026-11-06                                        |
| **Afecta a** | `angular.json`, `tsconfig.spec.json`, `*.spec.ts` |

## Contexto

La actualización a Angular 21 retiró Karma/Jasmine como camino recomendado y el builder `browser` (webpack) quedó heredado.

## Decisión

Compilar con `@angular/build:application` (esbuild), manteniendo `dist/` como salida, y probar con Vitest + jsdom mediante `@angular/build:unit-test`. Los specs son standalone.

## Alternativas consideradas

| Alternativa            | Ventajas      | Por qué se descartó                         |
| ---------------------- | ------------- | ------------------------------------------- |
| Mantener webpack/Karma | Sin migración | Obsoletos y más lentos; sin soporte futuro. |
| Jest                   | Conocido      | Integración no oficial con el builder.      |

## Consecuencias

**A favor:** builds y tests rápidos; configuración oficial.

**En contra:** dependencias CommonJS necesitan declararse (`allowedCommonJsDependencies`, hoy `tic-tac-toe-minimax`).

**Compromisos que impone:** los tests no dependen de un navegador real; lo que necesite uno se verifica a mano.

## Revisión

Si se necesitan tests de extremo a extremo en navegador real.
