import { Component, input } from "@angular/core";

/** Etiqueta + control proyectado (input/select) + mensaje de error. El <input> debe llevar la clase `app-input`. */
@Component({
  selector: "app-field",
  template: `
    <!-- El control se proyecta desde fuera: el lint no puede verlo dentro del <label> -->
    <!-- eslint-disable-next-line @angular-eslint/template/label-has-associated-control -->
    <label class="block text-left">
      <span class="mb-1.5 block text-sm font-medium text-white/80">{{ label() }}</span>
      <ng-content />
    </label>
    @if (error()) {
      <p class="mt-1 text-left text-sm text-rose-400" role="alert">{{ error() }}</p>
    }
  `
})
export class FieldComponent {
  public readonly label = input.required<string>();
  public readonly error = input<string | null>(null);
}
