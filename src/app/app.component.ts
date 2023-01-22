import { Component, OnDestroy, OnInit } from '@angular/core'
import { Subject, take, takeUntil } from 'rxjs'
// import { AuthService } from './core/services/auth/auth.service'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  public title = 'GAME APPS'
  public isAuthenticated = false
  private _destroySub$ = new Subject<void>()

  // constructor(private authService: AuthService) {}

  public ngOnInit(): void {
    // this.authService.isAuthenticated$.pipe(takeUntil(this._destroySub$)).subscribe((isAuthenticated: boolean) => (this.isAuthenticated = isAuthenticated))
  }

  public ngOnDestroy(): void {
    this._destroySub$.next()
  }

  public logout(): void {
    // this.authService.logout('/login').pipe(take(1))
  }
}
