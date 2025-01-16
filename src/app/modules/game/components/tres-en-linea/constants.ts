export interface Board {
  value: number;
  bgColor: string;
}

export const board: Array<Board> = [
  { value: 0, bgColor: "div0" },
  { value: 1, bgColor: "div1" },
  { value: 2, bgColor: "div2" },
  { value: 3, bgColor: "div3" },
  { value: 4, bgColor: "div4" },
  { value: 5, bgColor: "div5" },
  { value: 6, bgColor: "div6" },
  { value: 7, bgColor: "div7" },
  { value: 8, bgColor: "div8" }
];

export const backgroundAudio = "assets/sounds/theme_game.mp3";

export const endgameAudio = "assets/sounds/end_game.mp3";

interface DefaultSettings {
  enabled: boolean;
  volume: number;
}
export interface Settings {
  background: DefaultSettings;
  endgame: DefaultSettings;
}

export const settings: any = {
  background: {
    enabled: true as boolean,
    volume: 25 as number
  },
  endgame: {
    enabled: true as boolean,
    volume: 50 as number
  }
};
