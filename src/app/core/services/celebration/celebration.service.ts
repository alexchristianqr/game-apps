import { Injectable } from "@angular/core";

const COLORS = ["#22d3ee", "#a78bfa", "#f472b6", "#a3e635", "#fbbf24"];

/** Confeti. La librería se carga al primer uso para no pesar en el bundle inicial. */
@Injectable({ providedIn: "root" })
export class CelebrationService {
  /** Victoria: confeti grande desde el centro. */
  public async celebrate(colors: string[] = COLORS): Promise<void> {
    const { default: confetti } = await import("canvas-confetti");
    void confetti({ particleCount: 140, spread: 80, origin: { y: 0.65 }, colors, disableForReducedMotion: true });
  }

  /** Estallido pequeño en un punto de la pantalla (x, y de 0 a 1), p. ej. al limpiar líneas. */
  public async burst(x: number, y: number, particles = 40): Promise<void> {
    const { default: confetti } = await import("canvas-confetti");
    void confetti({ particleCount: particles, spread: 60, startVelocity: 25, ticks: 90, origin: { x, y }, colors: COLORS, disableForReducedMotion: true });
  }
}
