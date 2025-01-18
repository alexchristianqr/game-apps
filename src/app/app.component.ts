import { Component, OnDestroy, OnInit } from "@angular/core";
import { map, Observable, Subject } from "rxjs";
import { AuthService } from "./modules/auth/auth.service";
import { Store } from "@ngrx/store";
import { Router } from "@angular/router";
import { AuthState } from "./modules/auth/store/auth.state";
import { checkAuthState, login, logout } from "./modules/auth/store/auth.actions";
import { selectIsAuthenticated, selectUser } from "./modules/auth/store/auth.selectors";
import { AppState } from "./app.reducer";
import { User } from "@angular/fire/auth";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent implements OnInit, OnDestroy {
  public title = "GAME APPS";
  private destroySub = new Subject<void>();
  // isAuthenticated$: Observable<boolean>;

  user$: Observable<User | null>;
  isAuthenticated$: Observable<boolean>;

  // currentUser$ = this.store.select(selectCurrentUser);

  constructor(
    private authService: AuthService,
    private router: Router,
    private store: Store
  ) {
    this.user$ = this.store.select(selectUser);
    this.isAuthenticated$ = this.store.select(selectIsAuthenticated);

    console.log(this.isAuthenticated$, "alexxxxxxxxxxxxxxxx");
    // console.log("isAuthenticated$", this.isAuthenticated$);
    // isAuthenticated$ = this.store.select(selectIsAuthenticated);
    // Usar selectores para leer el estado
    // this.store.select(selectUser).subscribe((authState) => {
    //   console.log("Estado de autenticación:", authState);
    //   // return route home
    //   if (!authState) {
    //     // this.isAuthenticated$ = this.store.select(selectIsAuthenticated);
    //     // this.router.navigate(["home"]);
    //
    //     // this.isAuthenticated$ = this.store.select("auth").pipe(
    //     //   map((state) => !!state.user) // Devuelve true si hay un usuario autenticado
    //     // );
    //     // } else {
    //     // this.isAuthenticated$ = null;
    //     this.router.navigate(["login"]);
    //   }
    // });
  }

  ngOnInit(): void {
    // this.store.dispatch(checkAuthState());
  }

  public ngOnDestroy(): void {
    this.destroySub.next();
  }

  get isAuthenticated(): boolean {
    return this.authService.isUserAuthenticated;
  }

  public async onLogout() {
    // if (this.isAuthenticated$) return;
    this.store.dispatch(logout());

    // return this.authService.logout().subscribe({
    //   next: (data) => {
    //     console.log("[authService.logout]", data);
    //
    //     this.store.dispatch(logout());
    //
    //     localStorage.removeItem("user");
    //     this.router.navigate(["login"]);
    //   },
    //   error: (error) => console.error("Error sending reset email:", error)
    // });
  }
}
