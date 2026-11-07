import { Component, computed, inject, OnDestroy, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { ArrowLeft, Bot, ChevronDown, LucideAngularModule, Trash2 } from "lucide-angular";
import { AudioService } from "../../core/services/audio/audio.service";
import { CelebrationService } from "../../core/services/celebration/celebration.service";
import { PreferencesService } from "../../core/services/preferences/preferences.service";
import { SfxService } from "../../core/services/sfx/sfx.service";
import { ButtonDirective } from "../../core/ui/button/button.directive";
import { FieldComponent } from "../../core/ui/field/field.component";
import { PanelComponent } from "../../core/ui/panel/panel.component";
import { SegmentedComponent, type SegmentedOption } from "../../core/ui/segmented/segmented.component";
import { StatComponent } from "../../core/ui/stat/stat.component";
import { ToggleComponent } from "../../core/ui/toggle/toggle.component";
import { type Answer, countAnimals, EMPTY_SCORE, isNode, knows, nodeAt, normalizeAnimal, normalizeQuestion, type Path, type Scoreboard, SEED_TREE, teach, type TreeNode } from "./smart-toy.logic";

type Phase = "idle" | "asking" | "won" | "teach" | "learned";

interface Settings {
  sfx: boolean;
}

const DEFAULTS: Settings = { sfx: true };
const ANSWER_OPTIONS: readonly SegmentedOption[] = [
  { value: "yes", label: "Sí" },
  { value: "no", label: "No" }
];
const TREE_KEY = "smart-toy-tree";
const SCORE_KEY = "smart-toy-score";
const SETTINGS_KEY = "smart-toy-settings";

@Component({
  selector: "app-smart-toy",
  imports: [RouterLink, FormsModule, LucideAngularModule, ButtonDirective, FieldComponent, PanelComponent, SegmentedComponent, StatComponent, ToggleComponent],
  templateUrl: "./smart-toy.component.html",
  host: { "(document:keydown)": "onDocumentKey($event)" }
})
export class SmartToyComponent implements OnDestroy {
  public readonly answerOptions = ANSWER_OPTIONS;
  public readonly icons = { ArrowLeft, Bot, ChevronDown, Trash2 };

  public readonly phase = signal<Phase>("idle");
  public readonly tree = signal<TreeNode>(SEED_TREE);
  public readonly path = signal<Path>([]);
  public readonly score = signal<Scoreboard>(EMPTY_SCORE);
  public readonly settingsOpen = signal(false);
  public readonly confirmForget = signal(false);
  /** Errores del formulario de enseñanza, mostrados tras el primer intento de enviar */
  public readonly submitted = signal(false);

  public readonly current = computed(() => nodeAt(this.tree(), this.path()));
  public readonly animals = computed(() => countAnimals(this.tree()));
  /** Pregunta en curso, o null si el nodo actual es una hipótesis */
  public readonly question = computed(() => {
    const node = this.current();
    return node.kind === "question" ? node.text : null;
  });
  public readonly guessed = computed(() => {
    const node = this.current();
    return node.kind === "guess" ? node.animal : null;
  });
  /** Preguntas ya contestadas en esta ronda, para que la persona vea el hilo y no se pierda. */
  public readonly history = computed(() => {
    const trail: { text: string; answer: Answer }[] = [];
    let node = this.tree();
    for (const step of this.path()) {
      if (node.kind !== "question") break;
      trail.push({ text: node.text, answer: step });
      node = node[step];
    }
    return trail;
  });
  /** Etiqueta accesible de lo que el juguete dice ahora */
  public readonly speech = computed(() => {
    switch (this.phase()) {
      case "idle":
        return "Piensa en un animal y no me lo digas. ¡Voy a adivinarlo!";
      case "asking":
        return this.question() ?? `¿Estás pensando en: ${this.guessed()}?`;
      case "won":
        return "¡Lo adiviné! 🎉";
      case "teach":
        return "¡Me rindo! Enséñame ese animal.";
      case "learned":
        return `¡Gracias! Ahora conozco ${this.animals()} animales.`;
    }
  });

  // Formulario de enseñanza
  public animalInput = "";
  public questionInput = "";
  public answerForNew: Answer = "yes";
  public sfxOn = DEFAULTS.sfx;

  public readonly animalError = computed(() => {
    if (!this.submitted()) return null;
    return this.animalValue() === "" ? "Escribe el nombre del animal." : knows(this.tree(), this.animalValue()) ? "Ese animal ya lo conozco: piensa en otro." : null;
  });
  public readonly questionError = computed(() => (this.submitted() && this.questionValue() === "" ? "Escribe una pregunta que los distinga." : null));

  private readonly animalValue = signal("");
  private readonly questionValue = signal("");

  private readonly audio = inject(AudioService);
  private readonly sfx = inject(SfxService);
  private readonly celebration = inject(CelebrationService);
  private readonly prefs = inject(PreferencesService);

  public constructor() {
    this.tree.set(this.prefs.load<TreeNode>(TREE_KEY, SEED_TREE, isNode));
    this.score.set(this.prefs.load<Scoreboard>(SCORE_KEY, EMPTY_SCORE));
    this.sfxOn = this.prefs.load<Settings>(SETTINGS_KEY, DEFAULTS).sfx;
  }

  public ngOnDestroy(): void {
    this.audio.stopAll();
  }

  // ---- Flujo ----

  public start(): void {
    this.path.set([]);
    this.resetForm();
    this.phase.set("asking");
  }

  public answer(value: Answer): void {
    if (this.phase() !== "asking") return;
    this.playSfx(() => this.sfx.place());
    const node = this.current();

    if (node.kind === "question") {
      this.path.update((p) => [...p, value]);
      return;
    }
    // Hoja: el juguete propuso un animal.
    if (value === "yes") {
      this.setScore({ ...this.score(), robot: this.score().robot + 1 });
      this.phase.set("won");
      this.playSfx(() => this.sfx.win());
      void this.celebration.celebrate();
      return;
    }
    this.playSfx(() => this.sfx.lose());
    this.phase.set("teach");
  }

  public learn(): void {
    this.submitted.set(true);
    this.syncForm();
    if (this.animalError() || this.questionError()) return;

    this.tree.set(teach(this.tree(), this.path(), { animal: this.animalInput, question: this.questionInput, answerForNew: this.answerForNew }));
    this.prefs.save<TreeNode>(TREE_KEY, this.tree());
    this.setScore({ ...this.score(), player: this.score().player + 1 });
    this.phase.set("learned");
  }

  public syncForm(): void {
    this.animalValue.set(normalizeAnimal(this.animalInput));
    this.questionValue.set(normalizeQuestion(this.questionInput));
  }

  /** Texto de la pregunta tal como quedará guardada, para mostrarla en el formulario */
  public readonly newQuestionPreview = computed(() => this.questionValue());

  public toggleSfx(): void {
    this.prefs.save<Settings>(SETTINGS_KEY, { sfx: this.sfxOn });
  }

  public forget(): void {
    if (!this.confirmForget()) {
      this.confirmForget.set(true);
      return;
    }
    this.confirmForget.set(false);
    this.tree.set(SEED_TREE);
    this.prefs.remove(TREE_KEY);
    this.setScore(EMPTY_SCORE);
    this.path.set([]);
    this.phase.set("idle");
  }

  /** S / N responden mientras el juguete pregunta, salvo al escribir en un campo. */
  public onDocumentKey(event: KeyboardEvent): void {
    if (this.phase() !== "asking") return;
    const target = event.target as HTMLElement | null;
    if (target && /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (key === "s") this.answer("yes");
    else if (key === "n") this.answer("no");
  }

  // ---- Interno ----

  private resetForm(): void {
    this.animalInput = "";
    this.questionInput = "";
    this.answerForNew = "yes";
    this.submitted.set(false);
    this.animalValue.set("");
    this.questionValue.set("");
  }

  private playSfx(play: () => void): void {
    this.sfx.muted = !this.sfxOn;
    play();
  }

  private setScore(score: Scoreboard): void {
    this.score.set(score);
    this.prefs.save<Scoreboard>(SCORE_KEY, score);
  }
}
