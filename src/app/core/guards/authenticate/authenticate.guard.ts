import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";
import { map, Observable, take, tap } from "rxjs";
import { Store } from "@ngrx/store";
import { selectIsAuthenticated } from "../../../modules/auth/store/auth.selectors";
import { AppState } from "../../../app.reducer";

@Injectable({
  providedIn: "root"
})
export class AuthenticateGuard implements CanActivate {
  constructor(
    private store: Store<AppState>,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    console.log("[AuthenticateGuard.canActivate]");

    return this.store.select(selectIsAuthenticated).pipe(
      // take(1),
      // map((isAuthenticated) => {
      //   if (isAuthenticated) {
      //     return true;
      //   } else {
      //     this.router.navigate(["/login"]);
      //     return false;
      //   }
      // })
      tap((isAuthenticated) => {
        if (!isAuthenticated) this.router.navigate(["/login"]);
      })

      // map((user) => {
      //   if (user) {
      //     return true; // Permitir acceso
      //   } else {
      //     this.router.navigate(["/login"]);
      //     return false;
      //   }
      // })

      // map((state) => !!state.user), // Verifica si hay un usuario autenticado
      // take(1), // Solo toma el primer valor
      // tap((isAuthenticated) => {
      //   console.log("AuthGuard: isAuthenticated =", isAuthenticated);
      //   if (!isAuthenticated) this.router.navigate(["/login"]); // Redirige al login si no está autenticado
      // })
    );
  }
}
