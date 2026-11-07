import { GAMES } from "./games.registry";

describe("GAMES registry", () => {
  it("has unique ids", () => {
    expect(new Set(GAMES.map((g) => g.id)).size).toBe(GAMES.length);
  });

  it("every enabled game can be lazy loaded", () => {
    for (const g of GAMES.filter((g) => g.enabled)) {
      expect(g.loadComponent, g.id).toBeTypeOf("function");
    }
  });
});
