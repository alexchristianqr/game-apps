import { computed, Directive, input } from "@angular/core";

export type ButtonVariant = "primary" | "ghost" | "danger" | "success";
export type ButtonSize = "sm" | "md" | "lg";

const BASE = "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-200 select-none " + "active:scale-95 disabled:pointer-events-none disabled:opacity-50";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-pink text-ink-950 shadow-glow-violet hover:brightness-110 hover:-translate-y-0.5",
  ghost: "glass text-white hover:bg-white/10",
  danger: "bg-gradient-to-r from-rose-500 to-orange-400 text-ink-950 hover:brightness-110 hover:-translate-y-0.5",
  success: "bg-gradient-to-r from-neon-lime to-neon-cyan text-ink-950 shadow-glow-lime hover:brightness-110 hover:-translate-y-0.5"
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-base",
  lg: "px-8 py-3.5 text-lg"
};

/** Botón o enlace nativo con el aspecto del portal: conserva teclado y semántica (P8). */
@Directive({
  selector: "button[appButton], a[appButton]",
  host: { "[class]": "classes()" }
})
export class ButtonDirective {
  public readonly variant = input<ButtonVariant>("primary");
  public readonly size = input<ButtonSize>("md");

  protected readonly classes = computed(() => `${BASE} ${VARIANTS[this.variant()]} ${SIZES[this.size()]}`);
}
