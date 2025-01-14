import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root"
})
export class SoundService {
  // Archivos de audio
  public backgroundAudio = new Audio("assets/sounds/theme_game.mp3");
  public endGameAudio = new Audio("assets/sounds/end_game.mp3");

  // Configuración inicial de audio
  public backgroundAudioSettings = {
    enabled: true,
    volume: 100 // El volumen inicial es 100 (máximo)
  };

  public endGameAudioSettings = {
    enabled: true,
    volume: 100 // El volumen inicial es 100 (máximo)
  };

  constructor() {
    this.configureAudio(this.backgroundAudio, true);
    this.configureAudio(this.endGameAudio, false);
  }

  // 🎛 Configurar los ajustes iniciales del audio
  private configureAudio(audio: HTMLAudioElement, loop: boolean): void {
    audio.volume = this.convertVolumeToRange(this.backgroundAudioSettings.volume);
    audio.loop = loop;
  }

  // 🎵 Métodos para reproducir audio de fondo
  public playBackgroundAudio(): void {
    if (!this.backgroundAudioSettings.enabled) return;

    this.backgroundAudio.play().catch((error) => {
      console.error("Error al reproducir el audio de fondo:", error);
    });
  }

  public stopBackgroundAudio(): void {
    this.backgroundAudio.pause();
    this.backgroundAudio.currentTime = 0;
  }

  // 🎯 Métodos para reproducir audio de fin de juego
  public playEndGameAudio(): void {
    if (!this.endGameAudioSettings.enabled) return;

    this.endGameAudio.play().catch((error) => {
      console.error("Error al reproducir el audio de fin de juego:", error);
    });
  }

  public stopEndGameAudio(): void {
    this.endGameAudio.pause();
    this.endGameAudio.currentTime = 0;
  }

  // 🛠 Método para ajustar el volumen
  public setBackgroundAudioVolume(volume: number): void {
    this.backgroundAudioSettings.volume = volume;
    this.backgroundAudio.volume = this.convertVolumeToRange(volume);
  }

  public setEndGameAudioVolume(volume: number): void {
    this.endGameAudioSettings.volume = volume;
    this.endGameAudio.volume = this.convertVolumeToRange(volume);
  }

  // 📏 Conversión de volumen (0 a 100) al rango (0 a 1)
  private convertVolumeToRange(volume: number): number {
    return volume / 100;
  }
}
