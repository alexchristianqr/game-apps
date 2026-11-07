export type PieceId = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
export type Cell = readonly [x: number, y: number];

export interface PieceDef {
  id: PieceId;
  /** Lado de la caja de rotación */
  size: number;
  /** Clase de Tailwind con el color caramelo (se usa como `currentColor` en `candy-block`) */
  color: string;
  /** Las 4 orientaciones (0, derecha, 180°, izquierda) */
  rotations: readonly (readonly Cell[])[];
}

/** Gira 90° en sentido horario dentro de una caja n×n. */
function rotateCw(cells: readonly Cell[], n: number): Cell[] {
  return cells.map(([x, y]) => [n - 1 - y, x] as const);
}

function def(id: PieceId, size: number, color: string, spawn: readonly Cell[]): PieceDef {
  const rotations: (readonly Cell[])[] = [spawn];
  for (let i = 1; i < 4; i++) rotations.push(rotateCw(rotations[i - 1], size));
  return { id, size, color, rotations };
}

// Clases completas (no interpoladas) para que Tailwind las detecte.
export const PIECES: Record<PieceId, PieceDef> = {
  I: def("I", 4, "text-candy-sky", [
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1]
  ]),
  O: def("O", 2, "text-candy-yellow", [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1]
  ]),
  T: def("T", 3, "text-candy-grape", [
    [1, 0],
    [0, 1],
    [1, 1],
    [2, 1]
  ]),
  S: def("S", 3, "text-candy-green", [
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1]
  ]),
  Z: def("Z", 3, "text-candy-red", [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1]
  ]),
  J: def("J", 3, "text-candy-blue", [
    [0, 0],
    [0, 1],
    [1, 1],
    [2, 1]
  ]),
  L: def("L", 3, "text-candy-orange", [
    [2, 0],
    [0, 1],
    [1, 1],
    [2, 1]
  ])
};

export const PIECE_IDS: readonly PieceId[] = ["I", "O", "T", "S", "Z", "J", "L"];

// Tablas de «wall kick» del Super Rotation System. Los valores originales usan y hacia arriba;
// aquí y crece hacia abajo, así que se invierte el signo de y al construirlas.
type Kick = readonly [number, number];

function flipY(table: Record<string, readonly Kick[]>): Record<string, readonly Kick[]> {
  const out: Record<string, readonly Kick[]> = {};
  for (const [key, kicks] of Object.entries(table)) out[key] = kicks.map(([x, y]) => [x, y === 0 ? 0 : -y] as const);
  return out;
}

const KICKS_JLSTZ = flipY({
  "01": [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [0, -2],
    [-1, -2]
  ],
  "10": [
    [0, 0],
    [1, 0],
    [1, -1],
    [0, 2],
    [1, 2]
  ],
  "12": [
    [0, 0],
    [1, 0],
    [1, -1],
    [0, 2],
    [1, 2]
  ],
  "21": [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [0, -2],
    [-1, -2]
  ],
  "23": [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, -2],
    [1, -2]
  ],
  "32": [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [0, 2],
    [-1, 2]
  ],
  "30": [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [0, 2],
    [-1, 2]
  ],
  "03": [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, -2],
    [1, -2]
  ]
});

const KICKS_I = flipY({
  "01": [
    [0, 0],
    [-2, 0],
    [1, 0],
    [-2, -1],
    [1, 2]
  ],
  "10": [
    [0, 0],
    [2, 0],
    [-1, 0],
    [2, 1],
    [-1, -2]
  ],
  "12": [
    [0, 0],
    [-1, 0],
    [2, 0],
    [-1, 2],
    [2, -1]
  ],
  "21": [
    [0, 0],
    [1, 0],
    [-2, 0],
    [1, -2],
    [-2, 1]
  ],
  "23": [
    [0, 0],
    [2, 0],
    [-1, 0],
    [2, 1],
    [-1, -2]
  ],
  "32": [
    [0, 0],
    [-2, 0],
    [1, 0],
    [-2, -1],
    [1, 2]
  ],
  "30": [
    [0, 0],
    [1, 0],
    [-2, 0],
    [1, -2],
    [-2, 1]
  ],
  "03": [
    [0, 0],
    [-1, 0],
    [2, 0],
    [-1, 2],
    [2, -1]
  ]
});

/** Desplazamientos a probar al girar de `from` a `to`. La pieza O no necesita kicks. */
export function kicksFor(id: PieceId, from: number, to: number): readonly Kick[] {
  if (id === "O") return [[0, 0]];
  const table = id === "I" ? KICKS_I : KICKS_JLSTZ;
  return table[`${from}${to}`] ?? [[0, 0]];
}
