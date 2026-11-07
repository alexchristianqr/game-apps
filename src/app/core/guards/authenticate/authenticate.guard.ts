import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { map, take } from "rxjs";
import { AuthService } from "../../../auth/auth.service";

/** Espera la primera emisión de Firebase para no expulsar a usuarios con sesión persistida. */
export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(AuthService).user$.pipe(
    take(1),
    map((user) => (user ? true : router.createUrlTree(["/login"])))
  );
};
