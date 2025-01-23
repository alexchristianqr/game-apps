import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { AuthService } from "../auth.service";
import { catchError, map, of, switchMap, take, tap } from "rxjs";
import { login, loginSuccess, loginFailure, logout, checkAuthState, logoutFailure, logoutSuccess } from "./auth.actions";
import { onAuthStateChanged } from "@angular/fire/auth";
import { Auth } from "@angular/fire/auth";
import { Store } from "@ngrx/store";
import { AppState } from "../../../app.reducer";
import { Router } from "@angular/router";

@Injectable()
export class AuthEffects {
  constructor(
    private actions$: Actions,
    private authService: AuthService,
    private auth: Auth,
    private store: Store<AppState>,
    private router: Router
  ) {}

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(login),
      switchMap(({ email, password }) =>
        this.authService.loginUser(email, password).pipe(
          map((data) => {
            alert("login$");
            console.log("login$", data.user);
            this.router.navigate(["/home"]); // Redirige a 'home'
            return loginSuccess({ user: data.user });
          }),
          catchError((error) => of(loginFailure({ error: error.message })))
        )
      )
    )
  );

  logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(logout)
        // take(1),
        // switchMap(() => {
        //   alert("logout$");
        //   this.router.navigate(["/login"]);
        //   // logout()
        //   return this.authService.logout().pipe(
        //     tap(() => {
        //       this.router.navigate(["/login"]);
        //     })
        //   );
        // })
      ),
    { dispatch: false }
  );

  checkAuthState$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(checkAuthState),
        map(() => {
          onAuthStateChanged(this.auth, (user) => {
            console.log("onAuthStateChanged jeeeeee", user);
            if (user) {
              this.store.dispatch(loginSuccess({ user }));
              this.router.navigate(["/home"]);
            } else {
              // this.store.dispatch(loginFailure({ error: "User not authenticated" }));
              this.store.dispatch(logout());
              this.router.navigate(["/login"]);
            }
          });
        })
      ),
    { dispatch: false }
  );
}
