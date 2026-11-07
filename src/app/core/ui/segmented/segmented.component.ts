import { Component, forwardRef, input, signal } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: string;
  /** Emoji o símbolo opcional antes de la etiqueta */
  icon?: string;
}

/** Control segmentado accesible (radiogroup con flechas) compatible con ngModel. */
@Component({
  selector: "app-segmented",
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SegmentedComponent), multi: true }],
  template: `
    <div class="flex gap-1 rounded-2xl bg-white/5 p-1 ring-1 ring-white/10" role="radiogroup" [attr.aria-label]="label()">
      @for (option of options(); track option.value) {
        <button
          type="button"
          role="radio"
          class="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-sm font-semibold transition active:scale-95 disabled:opacity-50"
          [class]="option.value === value() ? 'bg-gradient-to-r from-neon-cyan to-neon-violet text-ink-950 shadow-glow-violet' : 'text-white/70 hover:bg-white/10'"
          [attr.aria-checked]="option.value === value()"
          [attr.tabindex]="option.value === value() ? 0 : -1"
          [disabled]="disabled()"
          (click)="select(option.value)"
          (keydown)="onKey($event, option.value)"
        >
          @if (option.icon) {
            <span aria-hidden="true">{{ option.icon }}</span>
          }
          <span class="truncate">{{ option.label }}</span>
        </button>
      }
    </div>
  `
})
export class SegmentedComponent implements ControlValueAccessor {
  public readonly options = input.required<readonly SegmentedOption[]>();
  public readonly label = input<string>("");

  protected readonly value = signal<string>("");
  protected readonly disabled = signal(false);

  private propagate: (value: string) => void = () => undefined;
  private touched: () => void = () => undefined;

  public writeValue(value: string): void {
    this.value.set(value);
  }
  public registerOnChange(fn: (value: string) => void): void {
    this.propagate = fn;
  }
  public registerOnTouched(fn: () => void): void {
    this.touched = fn;
  }
  public setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected select(value: string): void {
    this.value.set(value);
    this.propagate(value);
    this.touched();
  }

  protected onKey(event: KeyboardEvent, current: string): void {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const options = this.options();
    const index = options.findIndex((o) => o.value === current);
    const next = options[(index + step + options.length) % options.length];
    this.select(next.value);
    // El foco sigue a la selección, como en un radiogroup nativo.
    const buttons = (event.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLButtonElement>("button");
    queueMicrotask(() => buttons?.[options.indexOf(next)]?.focus());
  }
}
