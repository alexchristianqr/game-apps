# Game apps

Aplicación de juegos clásicos con Angular 21 (LTS) + Firebase 12 (`@angular/fire`) + Angular Material + NgRx.

Requiere Node `^20.19`, `^22.12` o `>=24`.

## Desarrollo local

```bash
cp .env.example .env   # y completar las credenciales de Firebase
npm install
npm start
```

## Build de producción

```bash
node generate-env-prod.js   # genera src/environments/environment.production.ts desde .env
npm run build               # salida en dist/
```

## Tests

```bash
npm test   # Vitest
```

## Agregar un juego

1. Crear `src/app/games/<id>/<id>.component.ts` (componente standalone).
2. Registrarlo en `src/app/games/games.registry.ts` con `id`, `title`, `icon`, `enabled: true` y `loadComponent`.

La ruta `/games/<id>` (protegida por `authGuard` y con carga perezosa) y la tarjeta en Inicio se generan solas desde el registro.
Para reproducir sonidos usar `AudioService` (`src/app/core/services/audio`).
