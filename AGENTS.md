# AGENTS.md

Instrucciones operativas para cualquier agente o persona. Las reglas viven en [`.specs/`](.specs/); este archivo solo dice por dónde empezar.

1. Lee [`.specs/00-principles.md`](.specs/00-principles.md) y [`.specs/02-architecture.md`](.specs/02-architecture.md) antes de tocar nada.
2. Si cambias una capacidad, lee su `SPEC-NNN` en [`.specs/features/`](.specs/features/).
3. Si el código contradice una especificación, hay un bug: señálalo, no elijas en silencio.
4. Un cambio no termina hasta que la `SPEC-NNN` afectada refleja el comportamiento nuevo.
5. Puerta de calidad: `npm run lint:check`, `npm run format:check`, `npm run type-check`, `npm test`, `npm run build`.
6. Dependencias entre capas: `core/services → user → auth → core/guards → games / pages → app`. Nunca hacia atrás.
7. Un juego nuevo se declara solo en `games/games.registry.ts` y lleva su propia `SPEC-NNN`.
8. Nunca versiones claves de Firebase ni los `environment.*.ts` generados.
