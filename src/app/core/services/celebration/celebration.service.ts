import { Injectable } from "@angular/core";

/** Confeti de victoria. La librería se carga al primer uso para no pesar en el bundle inicial. */
@Injectable({ providedIn: "root" })
export class CelebrationService {
  public async celebrate(): Promise<void> {
    const { default: confetti } = await import("canvas-confetti");
    const colors = ["#22d3ee", "#a78bfa", "#f472b6", "#a3e635", "#fbbf24"];
    void confetti({ particleCount: 140, spread: 80, origin: { y: 0.65 }, colors, disableForReducedMotion: true });
  }
}
