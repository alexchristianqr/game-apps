import { Injectable, OnDestroy } from "@angular/core";

interface Tone {
  /** Frecuencia en Hz */
  freq: number;
  /** Retraso desde el inicio del efecto, en segundos */
  at: number;
  /** Duración en segundos */
  dur: number;
  type?: OscillatorType;
  gain?: number;
}

/** Efectos cortos sintetizados con Web Audio: no necesitan archivos y se pueden mezclar con la música. */
@Injectable({ providedIn: "root" })
export class SfxService implements OnDestroy {
  /** 0..100 */
  public volume = 60;
  public muted = false;

  private ctx: AudioContext | null = null;

  public move(): void {
    this.play([{ freq: 220, at: 0, dur: 0.04, type: "square", gain: 0.25 }]);
  }
  public rotate(): void {
    this.play([{ freq: 520, at: 0, dur: 0.05, type: "triangle" }]);
  }
  public place(): void {
    this.play([{ freq: 330, at: 0, dur: 0.09, type: "triangle" }]);
  }
  public drop(): void {
    this.play([
      { freq: 160, at: 0, dur: 0.08, type: "sawtooth", gain: 0.5 },
      { freq: 90, at: 0.04, dur: 0.12, type: "square", gain: 0.5 }
    ]);
  }
  public hold(): void {
    this.play([
      { freq: 400, at: 0, dur: 0.05, type: "sine" },
      { freq: 600, at: 0.05, dur: 0.06, type: "sine" }
    ]);
  }
  /** Más líneas, arpegio más largo y brillante. */
  public clear(lines: number): void {
    const notes = [523, 659, 784, 1047].slice(0, Math.max(1, Math.min(4, lines)));
    this.play(notes.map((freq, i) => ({ freq, at: i * 0.07, dur: 0.12, type: "triangle" as const })));
  }
  public levelUp(): void {
    this.play([523, 659, 784, 1047, 1319].map((freq, i) => ({ freq, at: i * 0.08, dur: 0.14, type: "square" as const, gain: 0.3 })));
  }
  public win(): void {
    this.play([523, 659, 784, 1047].map((freq, i) => ({ freq, at: i * 0.1, dur: 0.18, type: "triangle" as const })));
  }
  public lose(): void {
    this.play([392, 330, 262, 196].map((freq, i) => ({ freq, at: i * 0.14, dur: 0.2, type: "sawtooth" as const, gain: 0.35 })));
  }

  public ngOnDestroy(): void {
    void this.ctx?.close().catch(() => undefined);
    this.ctx = null;
  }

  private play(tones: Tone[]): void {
    if (this.muted || this.volume <= 0) return;
    const ctx = this.context();
    if (!ctx) return;
    const now = ctx.currentTime;
    const master = (this.volume / 100) * 0.25;

    for (const tone of tones) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + tone.at;
      osc.type = tone.type ?? "sine";
      osc.frequency.value = tone.freq;
      // Ataque y caída cortos evitan el «clic» al cortar la onda.
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(master * (tone.gain ?? 1), start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + tone.dur + 0.02);
    }
  }

  /** El contexto se crea en el primer sonido (siempre tras un gesto) para respetar la política de autoplay. */
  private context(): AudioContext | null {
    try {
      this.ctx ??= new AudioContext();
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return this.ctx;
    } catch {
      return null;
    }
  }
}
