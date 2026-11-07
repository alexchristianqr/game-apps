import { TestBed } from "@angular/core/testing";
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from "@angular/router";
import { firstValueFrom, Observable, of } from "rxjs";
import { AuthService } from "../../../auth/auth.service";
import { authGuard } from "./authenticate.guard";

describe("authGuard", () => {
  function run(user: unknown) {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { user$: of(user) } }]
    });
    return TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)) as Observable<boolean | UrlTree>;
  }

  it("allows an authenticated user", async () => {
    expect(await firstValueFrom(run({ uid: "1" }))).toBe(true);
  });

  it("redirects to /login without a session", async () => {
    const result = await firstValueFrom(run(null));
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe("/login");
  });
});
