import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { AuthService } from "./modules/auth/auth.service";
import { Store } from "@ngrx/store";
import { AuthActions } from "./modules/auth/store/auth.actions";
import { Router } from "@angular/router";

const { setUserLoggedIn } = AuthActions;

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent implements OnDestroy {
  public title = "GAME APPS";
  private destroySub = new Subject<void>();

  constructor(private authService: AuthService, private store: Store, private router: Router) {}

  public ngOnDestroy(): void {
    this.destroySub.next();
  }

  get isAuthenticated(): boolean {
    return this.authService.isUserAuthenticated;
  }

  public async logout() {
    return this.authService.logout().subscribe({
      next: (data) => {
        console.log("[authService.logout]", data);

        this.store.dispatch(
          setUserLoggedIn({
            userAuthenticated: false
          })
        );

        localStorage.removeItem("user");
        this.router.navigate(["login"]);
      },
      error: (error) => console.error("Error sending reset email:", error)
    });
  }
}
