import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root"
})
export class SoundService {
  private audios: { [key: string]: HTMLAudioElement } = {};

  constructor() {}

  public getAudio(key: string) {
    return this.audios[key];
  }

  /**
   * 🎶 Inicializa un nuevo audio.
   * @param key Identificador del audio.
   * @param audioPath Ruta del archivo de audio.
   * @param volume Volumen inicial (0-100).
   * @param loop Determina si el audio debe repetirse en bucle.
   */
  public initAudio(key: string, audioPath: string, volume: number = 100, loop: boolean = false): void {
    if (this.audios[key]) {
      console.warn(`El audio con clave "${key}" ya está inicializado.`);
      return;
    }

    const audio = new Audio(audioPath);
    audio.volume = this.convertVolumeToRange(volume);
    audio.loop = loop;

    this.audios[key] = audio;
  }

  /**
   * ▶️ Reproduce el audio especificado.
   * @param key Identificador del audio.
   */
  public playAudio(key: string): void {
    const audio = this.audios[key];
    if (!audio) {
      console.error(`No se encontró el audio con clave "${key}".`);
      return;
    }

    audio.play().catch((error) => {
      console.error(`Error al reproducir el audio "${key}":`, error);
    });
  }

  /**
   * ⏹ Detiene el audio especificado.
   * @param key Identificador del audio.
   */
  public stopAudio(key: string): void {
    const audio = this.audios[key];
    if (!audio) {
      console.error(`No se encontró el audio con clave "${key}".`);
      return;
    }

    audio.pause();
    audio.currentTime = 0;
  }

  /**
   * 🔊 Ajusta el volumen del audio especificado.
   * @param key Identificador del audio.
   * @param volume Volumen (0-100).
   */
  public setAudioVolume(key: string, volume: number): void {
    const audio = this.audios[key];
    if (!audio) {
      console.error(`No se encontró el audio con clave "${key}".`);
      return;
    }

    audio.volume = this.convertVolumeToRange(volume);
  }

  /**
   * 🗑 Elimina un audio especificado.
   * @param key Identificador del audio.
   */
  public removeAudio(key: string): void {
    if (!this.audios[key]) {
      console.warn(`El audio con clave "${key}" no existe.`);
      return;
    }

    delete this.audios[key];
  }

  /**
   * 📏 Conversión de volumen (0 a 100) al rango (0 a 1).
   */
  private convertVolumeToRange(volume: number): number {
    return Math.max(0, Math.min(volume / 100, 1));
  }
}
