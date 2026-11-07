import { Type } from "@angular/core";

export interface GameDefinition {
  /** Identificador único; se usa como segmento de ruta: /games/:id */
  id: string;
  title: string;
  /** Nombre del icono de Material Icons */
  icon: string;
  enabled: boolean;
  /** Carga perezosa del componente del juego (un chunk por juego) */
  loadComponent?: () => Promise<Type<unknown>>;
}

/**
 * Única fuente de verdad de los juegos.
 * Para agregar uno: crear games/<id>/<id>.component.ts y registrarlo aquí.
 */
export const GAMES: readonly GameDefinition[] = [
  {
    id: "tic-tac-toe",
    title: "Tres en linea",
    icon: "gamepad",
    enabled: true,
    loadComponent: () => import("./tic-tac-toe/tic-tac-toe.component").then((m) => m.TicTacToeComponent)
  },
  { id: "smart-toy", title: "Smart toy", icon: "smart_toy", enabled: false },
  { id: "basketball", title: "Basketball", icon: "sports_volleyball", enabled: false },
  { id: "tetris", title: "Tetris", icon: "sports_cricket", enabled: false }
];
