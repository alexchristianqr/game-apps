# Flujos de trabajo

## Entorno

- Node ≥ 22 (`.nvmrc`), npm ≥ 10.
- `cp .env.example .env` y completa las variables de Firebase.
- `src/environments/environment.development.ts` y `environment.production.ts` **no se versionan**. Se generan con `node generate-env-prod.js`, que lee `.env` (o el entorno), aborta si falta una
  variable obligatoria y escribe ambos archivos.
- Obligatorias: `ANGULAR_FIREBASE_API_KEY`, `_AUTH_DOMAIN`, `_PROJECT_ID`, `_APP_ID`. Opcionales: `_STORAGE_BUCKET`, `_MESSAGING_SENDER_ID`, `_MEASUREMENT_ID`, `_DATABASE_URL`.
- Los `.env*` no se versionan (solo `.env.example`): la configuración web de Firebase es pública una vez compilada, pero no se publica en el repositorio.

## Servidor de desarrollo

`npm start` escucha en todas las interfaces (`--host=0.0.0.0`): sirve para abrir la app desde el móvil en la misma red. Ese puerto queda accesible a toda la red local mientras dure el servidor; úsalo
en redes de confianza.

## Scripts

| Script               | Qué hace                                                         |
| -------------------- | ---------------------------------------------------------------- |
| `npm start`          | Servidor de desarrollo (configuración `development`).            |
| `npm run build`      | Compilación de producción a `dist/`.                             |
| `npm test`           | Vitest una sola vez. `test:watch` queda en vigilancia.           |
| `npm run lint`       | ESLint con `--fix`. `lint:check` no modifica.                    |
| `npm run format`     | Prettier. `format:check` no modifica.                            |
| `npm run type-check` | `tsc --noEmit` sobre `tsconfig.app.json` y `tsconfig.spec.json`. |

**Puerta de calidad antes de integrar:** `lint:check`, `format:check`, `type-check`, `test`, `build`.

## Despliegue

GitHub Actions (`.github/workflows/deployment.yml`): instala con `npm ci`, genera los entornos, valida (lint, formato, tipos, tests), compila y publica `dist/` en la rama `gh-pages`, que sirve GitHub
Pages.

**Cuándo se publica** (solo estos dos casos):

1. **Al fusionar un PR a `main`** (`push` a `main`). Flujo habitual: se trabaja en `dev`, se abre un PR `dev` → `main` y, al fusionarlo, se publica. `main` debe estar protegida: solo recibe cambios
   por PR.
2. **A mano**, en Actions → Deployment → Run workflow, eligiendo la rama. Hay un solo sitio publicado: desplegar otra rama sustituye la versión real.

Nada más publica. Dos despliegues seguidos se encolan (`concurrency`) en vez de solaparse.

### Configuración en el repositorio

Settings → Secrets and variables → Actions → **Secrets**: `ANGULAR_FIREBASE_API_KEY`, `ANGULAR_FIREBASE_AUTH_DOMAIN`, `ANGULAR_FIREBASE_PROJECT_ID`, `ANGULAR_FIREBASE_APP_ID` y, opcionales,
`ANGULAR_FIREBASE_STORAGE_BUCKET`, `ANGULAR_FIREBASE_MESSAGING_SENDER_ID`, `ANGULAR_FIREBASE_MEASUREMENT_ID`, `ANGULAR_FIREBASE_DATABASE_URL`.

El workflow no imprime ningún valor. Firebase Auth debe tener autorizado el dominio `alexchristianqr.github.io`.
