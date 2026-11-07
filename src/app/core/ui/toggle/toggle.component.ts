import { Component, forwardRef, signal } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";

/** Interruptor accesible compatible con ngModel / formControl. */
@Component({
  selector: "app-toggle",
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ToggleComponent), multi: true }],
  template: `
    <label class="flex cursor-pointer items-center gap-3">
      <input type="checkbox" role="switch" class="peer sr-only" [checked]="checked()" [disabled]="disabled()" (change)="onChange($event)" (blur)="touched()" />
      <span
        class="relative h-6 w-11 shrink-0 rounded-full bg-white/15 transition peer-checked:bg-neon-cyan peer-checked:shadow-glow-cyan peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-neon-cyan peer-disabled:opacity-50 after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5"
        aria-hidden="true"
      ></span>
      <span class="text-sm"><ng-content /></span>
    </label>
  `
})
export class ToggleComponent implements ControlValueAccessor {
  protected readonly checked = signal(false);
  protected readonly disabled = signal(false);

  private propagate: (value: boolean) => void = () => undefined;
  protected touched: () => void = () => undefined;

  public writeValue(value: boolean): void {
    this.checked.set(!!value);
  }
  public registerOnChange(fn: (value: boolean) => void): void {
    this.propagate = fn;
  }
  public registerOnTouched(fn: () => void): void {
    this.touched = fn;
  }
  public setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected onChange(event: Event): void {
    const value = (event.target as HTMLInputElement).checked;
    this.checked.set(value);
    this.propagate(value);
  }
}
