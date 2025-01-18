import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { AuthService } from "../auth.service";
import { catchError, map, of, switchMap, tap } from "rxjs";
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
          map((data) => loginSuccess({ user: data.user })),
          catchError((error) => of(loginFailure({ error: error.message })))
        )
      )
    )
  );

  logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(logout),
        switchMap(
          () =>
            this.authService.logout().pipe(
              map(() => {
                this.router.navigate(["/login"]);
                return logoutSuccess();
              }),
              catchError((error) => {
                console.error("Error during logout", error);
                return of(logoutFailure({ error: error.message })); // Manejar el error
              })
            )
          // this.router.navigate(["/login"]);
          // this.authService.logout().pipe(
          //   map((data) => {
          //     console.log("logout effect", data);
          //     logoutSuccess();
          //   }),
          //   catchError((error) => of(logoutFailure(error)))
          // );
          // this.authService.logout().then(() => logoutSuccess()).catch((error) => logoutFailure(error))
        )
      ),
    { dispatch: true }
  );

  checkAuthState$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(checkAuthState),
        map(() => {
          // onAuthStateChanged(this.auth, (user) => {
          //   console.log("onAuthStateChanged", user);
          //   // if (user) {
          //   //   this.store.dispatch(loginSuccess({ user }));
          //   // } else {
          //   //   // this.store.dispatch(loginFailure({ error: "User not authenticated" }));
          //   //   this.store.dispatch(logout());
          //   // }
          // });
        })
      ),
    { dispatch: false }
  );
}
