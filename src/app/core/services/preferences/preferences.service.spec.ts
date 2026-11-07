import { installMemoryStorage } from "./memory-storage.testing";
import { PreferencesService } from "./preferences.service";

describe("PreferencesService", () => {
  const service = new PreferencesService();

  beforeEach(() => installMemoryStorage());

  it("returns the fallback when nothing is stored", () => {
    expect(service.load("x", 5)).toBe(5);
  });

  it("round-trips values", () => {
    service.save("x", { a: 1 });
    expect(service.load("x", { a: 0 })).toEqual({ a: 1 });
  });

  it("fills new fields from the fallback on old data", () => {
    service.save("x", { a: 1 });
    expect(service.load("x", { a: 0, b: 2 })).toEqual({ a: 1, b: 2 });
  });

  it("falls back on corrupt data or a failing guard", () => {
    localStorage.setItem("game-apps:x", "{oops");
    expect(service.load("x", 7)).toBe(7);
    service.save("y", "texto");
    expect(service.load("y", 1, (v): v is number => typeof v === "number")).toBe(1);
  });
});
