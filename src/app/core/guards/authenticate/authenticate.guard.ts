import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from "@angular/router";
import { Observable } from "rxjs";
import { AuthService } from "../../../modules/auth/auth.service";

@Injectable({
  providedIn: "root"
})
export class AuthenticateGuard implements CanActivate {
  constructor(
    public authService: AuthService,
    public router: Router
  ) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    if (!this.authService.isLoggedIn) {
      return this.router.navigate(["login"]);
    }
    return true;
  }
}
