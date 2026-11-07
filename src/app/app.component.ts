import { Component, inject } from "@angular/core";
import { RouterLink, RouterOutlet } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { MatDividerModule } from "@angular/material/divider";
import { MatIconModule } from "@angular/material/icon";
import { MatToolbarModule } from "@angular/material/toolbar";
import { AuthService } from "./auth/auth.service";

@Component({
  selector: "app-root",
  imports: [RouterLink, RouterOutlet, MatToolbarModule, MatButtonModule, MatIconModule, MatDividerModule],
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent {
  private readonly authService = inject(AuthService);

  public readonly title = "GAME APPS";
  public readonly isAuthenticated = this.authService.isAuthenticated;

  public logout() {
    return this.authService.signOut();
  }
}
