import { Injectable } from '@angular/core'
import { CanActivate, Router, UrlTree } from '@angular/router'
// import { AuthService } from '../../services/auth/auth.service'
import { map, Observable } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  // constructor(private authService: AuthService, private router: Router) {}

  public canActivate(): Observable<boolean | UrlTree> {
    return new Observable()
    // return this.authService.isAuthenticated$.pipe(map((s: boolean) => (s ? true : this.router.parseUrl('/login'))))
  }
}
