import { Component, inject } from "@angular/core";
import { ToastService } from "./toast.service";

@Component({
  selector: "app-toast-outlet",
  template: `
    <div class="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
      @for (toast of toasts.toasts(); track toast.id) {
        <div
          animate.enter="animate-fade-up"
          class="pointer-events-auto rounded-xl bg-ink-800/90 px-4 py-3 text-sm shadow-xl glass"
          [class.text-neon-lime]="toast.kind === 'success'"
          [class.text-rose-300]="toast.kind === 'error'"
        >
          {{ toast.message }}
        </div>
      }
    </div>
  `
})
export class ToastOutletComponent {
  protected readonly toasts = inject(ToastService);
}
