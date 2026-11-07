import { TestBed } from "@angular/core/testing";
import { ToastService } from "./toast.service";

describe("ToastService", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("shows a toast and removes it after the duration", () => {
    const service = TestBed.inject(ToastService);
    service.show("hola");
    expect(service.toasts().map((t) => t.message)).toEqual(["hola"]);
    vi.advanceTimersByTime(3000);
    expect(service.toasts()).toEqual([]);
  });
});
