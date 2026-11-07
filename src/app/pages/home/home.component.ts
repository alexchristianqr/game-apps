import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule, Sparkles } from "lucide-angular";
import { GAMES, type GameAccent } from "../../games/games.registry";
import { ButtonDirective } from "../../core/ui/button/button.directive";

/** Clases completas (no interpoladas) para que Tailwind las detecte. */
const ACCENTS: Record<GameAccent, { icon: string; glow: string }> = {
  cyan: { icon: "from-neon-cyan to-sky-500", glow: "hover:shadow-glow-cyan hover:border-neon-cyan/50" },
  pink: { icon: "from-neon-pink to-rose-500", glow: "hover:shadow-glow-pink hover:border-neon-pink/50" },
  violet: { icon: "from-neon-violet to-indigo-500", glow: "hover:shadow-glow-violet hover:border-neon-violet/50" },
  lime: { icon: "from-neon-lime to-emerald-500", glow: "hover:shadow-glow-lime hover:border-neon-lime/50" },
  amber: { icon: "from-neon-amber to-orange-500", glow: "hover:shadow-glow-amber hover:border-neon-amber/50" }
};

@Component({
  selector: "app-home",
  imports: [RouterLink, LucideAngularModule, ButtonDirective],
  templateUrl: "./home.component.html"
})
export class HomeComponent {
  public readonly games = GAMES;
  public readonly accents = ACCENTS;
  public readonly sparkles = Sparkles;
  /** Primera partida jugable, destino del botón principal. */
  public readonly firstPlayable = GAMES.find((g) => g.enabled && g.loadComponent);
}
