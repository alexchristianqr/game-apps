import { routes } from "./app.routes";

describe("routes", () => {
  it("redirects the root and unknown paths to /home", () => {
    expect(routes.find((r) => r.path === "")?.redirectTo).toBe("home");
    expect(routes.find((r) => r.path === "**")?.redirectTo).toBe("home");
  });

  it("keeps the catalog and games public", () => {
    for (const path of ["home", "games/tic-tac-toe"]) {
      const route = routes.find((r) => r.path === path);
      expect(route, path).toBeDefined();
      expect(route?.canActivate, path).toBeUndefined();
    }
  });
});
