# ADR-005 — Mismo flujo de calidad y despliegue que portfolio

| Campo        | Valor                                                                                        |
| ------------ | -------------------------------------------------------------------------------------------- |
| **Estado**   | aceptada                                                                                     |
| **Fecha**    | 2026-11-06                                                                                   |
| **Afecta a** | `.github/workflows/deployment.yml`, `package.json`, `eslint.config.mjs`, `.husky/`, `.nvmrc` |

## Contexto

El proyecto `portfolio` tiene un flujo asentado (`dev` → PR → `main` → publicación, con puerta de calidad y especificaciones). `game-apps` desplegaba solo a mano, sin lint ni comprobación de formato o
tipos, y con `npm install`.

## Decisión

Adoptar el mismo flujo: `dev` como rama de trabajo, PR a `main`, publicación al fusionar (más disparo manual), `npm ci` con Node desde `.nvmrc`, puerta `lint:check` → `format:check` → `type-check` →
`test` → `build`, hook `pre-commit` con lint-staged, `package-lock.json` versionado, y `.specs/` como fuente de verdad. Se adapta a Angular (angular-eslint, Vitest) y se mantiene el formato Prettier
propio del proyecto (comillas dobles, 200 columnas) para no reformatear todo.

## Alternativas consideradas

| Alternativa                       | Ventajas          | Por qué se descartó                             |
| --------------------------------- | ----------------- | ----------------------------------------------- |
| Mantener el despliegue manual     | Sin cambios       | Se publica sin validar; fácil olvidarlo.        |
| Copiar también el estilo Prettier | Uniformidad total | Reformatearía todo el código sin aportar valor. |

## Consecuencias

**A favor:** un solo modo de trabajar en ambos proyectos; nada se publica sin pasar la puerta.

**En contra:** `any` y `@ts-ignore` heredados se muestran como avisos hasta resolverlos (ver deuda en `01-product.md`).

**Compromisos que impone:** `main` debe estar protegida (solo PR); un cambio de CI o de la puerta de calidad requiere ADR.

## Revisión

Si `portfolio` cambia su flujo de forma sustancial.
