import { Injectable, OnDestroy } from "@angular/core";

/** Reproducción de sonidos reutilizable por todos los juegos. */
@Injectable({ providedIn: "root" })
export class AudioService implements OnDestroy {
  private loop: HTMLAudioElement | null = null;
  private effect: HTMLAudioElement | null = null;
  private effectTimer: ReturnType<typeof setTimeout> | undefined;

  /** Música de fondo en bucle. volume: 0..100 */
  public playLoop(src: string, volume: number): void {
    this.stopLoop();
    this.loop = new Audio(src);
    this.loop.volume = volume / 100;
    this.loop.loop = true;
    this.loop.play().catch(console.error);
  }

  public stopLoop(): void {
    this.loop?.pause();
    this.loop = null;
  }

  /** Efecto corto; se corta solo a los maxMs. volume: 0..100 */
  public playEffect(src: string, volume: number, maxMs = 2000): void {
    this.stopEffect();
    this.effect = new Audio(src);
    this.effect.volume = volume / 100;
    this.effect.play().catch(console.error);
    this.effectTimer = setTimeout(() => this.stopEffect(), maxMs);
  }

  public stopEffect(): void {
    clearTimeout(this.effectTimer);
    this.effect?.pause();
    this.effect = null;
  }

  public stopAll(): void {
    this.stopLoop();
    this.stopEffect();
  }

  ngOnDestroy(): void {
    this.stopAll();
  }
}
