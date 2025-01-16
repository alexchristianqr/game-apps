export interface PatternInterface {
  startGame(toggle: boolean): Promise<void>;
  restartGame(toggle: boolean): Promise<void>;
  pauseGame?(toggle: boolean): Promise<void>;
  resumeGame?(toggle: boolean): Promise<void>;
  endGame(toggle: boolean): Promise<void>;
}
