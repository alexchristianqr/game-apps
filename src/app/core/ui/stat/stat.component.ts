import { Component, computed, input } from "@angular/core";

export type StatAccent = "cyan" | "pink" | "violet" | "lime" | "amber";

const TEXT: Record<StatAccent, string> = {
  cyan: "text-neon-cyan",
  pink: "text-neon-pink",
  violet: "text-neon-violet",
  lime: "text-neon-lime",
  amber: "text-neon-amber"
};

const RING: Record<StatAccent, string> = {
  cyan: "ring-neon-cyan shadow-glow-cyan",
  pink: "ring-neon-pink shadow-glow-pink",
  violet: "ring-neon-violet shadow-glow-violet",
  lime: "ring-neon-lime shadow-glow-lime",
  amber: "ring-neon-amber shadow-glow-amber"
};

/** Tile de estadística: etiqueta pequeña y valor grande que «salta» al cambiar. */
@Component({
  selector: "app-stat",
  template: `
    <div class="rounded-2xl bg-white/5 px-3 py-2 text-center ring-1 transition" [class]="ringClass()">
      <div class="text-[0.65rem] font-semibold tracking-widest text-white/60 uppercase">{{ label() }}</div>
      <!-- track por valor: al cambiar se recrea el nodo y se reproduce la animación -->
      @for (v of [value()]; track v) {
        <div class="animate-pop text-xl font-black tabular-nums" [class]="textClass()">{{ v }}</div>
      }
    </div>
  `
})
export class StatComponent {
  public readonly label = input.required<string>();
  public readonly value = input.required<string | number>();
  public readonly accent = input<StatAccent>("cyan");
  /** Resalta el tile (p. ej. el turno actual) */
  public readonly active = input(false);

  protected readonly textClass = computed(() => TEXT[this.accent()]);
  protected readonly ringClass = computed(() => (this.active() ? RING[this.accent()] : "ring-white/10"));
}
