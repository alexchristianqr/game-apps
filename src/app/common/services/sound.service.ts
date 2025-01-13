import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root" // Esto hace que el servicio esté disponible en toda la aplicación
})
export class SoundService {
  // Ajustes del juego
  computerFirst: boolean = true;
  public allowSoundEndGame: boolean = true;
  public volumeSoundEndGame: number = 100;
  public allowSoundThemeGame: boolean = true;
  public volumeSoundThemeGame: number = 25;

  // Sonidos del juego
  private themeAudio: HTMLAudioElement;
  private endAudio: HTMLAudioElement;

  constructor() {
    this.themeAudio = new Audio("assets/sounds/theme.mp3");
    this.endAudio = new Audio("assets/sounds/end.mp3");
  }

  public playAudioTheme(): void {
    if (!this.allowSoundThemeGame) return;

    this.themeAudio.volume = this.volumeSoundThemeGame / 100;
    this.themeAudio.loop = true;
    this.themeAudio.play();
  }

  stopAudioTheme(): void {
    this.themeAudio.pause();
  }

  playAudioEndgame(): void {
    if (!this.allowSoundEndGame) return;

    this.endAudio.volume = this.volumeSoundEndGame / 100;
    this.endAudio.play();
  }

  stopAudioEnd(): void {
    this.endAudio.pause();
  }
}
