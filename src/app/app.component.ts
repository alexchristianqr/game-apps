import { Component, inject } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { Gamepad2, Github, LogIn, LogOut, LucideAngularModule } from "lucide-angular";
import { AuthService } from "./auth/auth.service";
import { ButtonDirective } from "./core/ui/button/button.directive";
import { ToastOutletComponent } from "./core/ui/toast/toast-outlet.component";

@Component({
  selector: "app-root",
  imports: [RouterLink, RouterLinkActive, RouterOutlet, LucideAngularModule, ButtonDirective, ToastOutletComponent],
  templateUrl: "./app.component.html"
})
export class AppComponent {
  private readonly authService = inject(AuthService);

  public readonly title = "GAME APPS";
  public readonly isAuthenticated = this.authService.isAuthenticated;
  public readonly icons = { Gamepad2, Github, LogIn, LogOut };

  public logout(): Promise<void> {
    return this.authService.signOut();
  }
}
