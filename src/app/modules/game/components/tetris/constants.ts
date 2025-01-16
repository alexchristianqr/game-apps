export const pieces = [
  {
    shape: [[1, 1, 1, 1]],
    color: "cyan"
  }, // I
  {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: "yellow"
  }, // O
  {
    shape: [
      [0, 1, 0],
      [1, 1, 1]
    ],
    color: "purple"
  }, // T
  {
    shape: [
      [1, 0, 0],
      [1, 1, 1]
    ],
    color: "green"
  }, // L
  {
    shape: [
      [0, 0, 1],
      [1, 1, 1]
    ],
    color: "red"
  }, // J
  {
    shape: [
      [1, 1, 0],
      [0, 1, 1]
    ],
    color: "blue"
  }, // S
  {
    shape: [
      [0, 1, 1],
      [1, 1, 0]
    ],
    color: "orange"
  } // Z
];

export const backgroundAudio = "assets/sounds/theme_game.mp3";

export const endgameAudio = "assets/sounds/end_game.mp3";

export const settings: any = {
  background: {
    enabled: true as boolean,
    volume: 15 as number
  },
  endgame: {
    enabled: true as boolean,
    volume: 50 as number
  }
};
