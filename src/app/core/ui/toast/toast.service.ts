import { Injectable, OnDestroy, signal } from "@angular/core";

export interface Toast {
  id: number;
  message: string;
  kind: "success" | "error";
}

/** Avisos temporales; cada temporizador se libera al expirar o destruir el servicio (P9). */
@Injectable({ providedIn: "root" })
export class ToastService implements OnDestroy {
  public readonly toasts = signal<Toast[]>([]);

  private nextId = 0;
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();

  public show(message: string, kind: Toast["kind"] = "success", durationMs = 3000): void {
    const id = this.nextId++;
    this.toasts.update((list) => [...list, { id, message, kind }]);
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      this.dismiss(id);
    }, durationMs);
    this.timers.add(timer);
  }

  public dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  public ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
    this.timers.clear();
  }
}
