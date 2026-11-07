import { Type } from "@angular/core";
import { Blocks, Bot, Dribbble, Grid3x3, type LucideIconData } from "lucide-angular";

export type GameAccent = "cyan" | "pink" | "violet" | "lime" | "amber";

export interface GameDefinition {
  /** Identificador único; se usa como segmento de ruta: /games/:id */
  id: string;
  title: string;
  /** Texto corto de la tarjeta de Inicio */
  description: string;
  /** Icono de Lucide */
  icon: LucideIconData;
  /** Color de acento de la tarjeta */
  accent: GameAccent;
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
    title: "Tres en línea",
    description: "Reta al robot o juega con un amigo.",
    icon: Grid3x3,
    accent: "cyan",
    enabled: true,
    loadComponent: () => import("./tic-tac-toe/tic-tac-toe.component").then((m) => m.TicTacToeComponent)
  },
  {
    id: "smart-toy",
    title: "Smart toy",
    description: "Un juguete inteligente que aprende de ti.",
    icon: Bot,
    accent: "pink",
    enabled: true,
    loadComponent: () => import("./smart-toy/smart-toy.component").then((m) => m.SmartToyComponent)
  },
  { id: "basketball", title: "Basketball", description: "Encesta contra el reloj.", icon: Dribbble, accent: "amber", enabled: false },
  {
    id: "tetris",
    title: "Tetris",
    description: "Encaja piezas de colores y limpia líneas.",
    icon: Blocks,
    accent: "violet",
    enabled: true,
    loadComponent: () => import("./tetris/tetris.component").then((m) => m.TetrisComponent)
  }
];
