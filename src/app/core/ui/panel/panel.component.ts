import { Component } from "@angular/core";

/** Tarjeta de vidrio con borde de degradado. */
@Component({
  selector: "app-panel",
  template: `
    <div class="rounded-3xl bg-gradient-to-br from-neon-cyan/40 via-neon-violet/30 to-neon-pink/40 p-px shadow-2xl shadow-black/40">
      <div class="rounded-[calc(1.5rem-1px)] bg-ink-900/80 p-6 glass sm:p-8">
        <ng-content />
      </div>
    </div>
  `
})
export class PanelComponent {}
