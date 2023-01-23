import { Component, OnDestroy, OnInit } from '@angular/core'
import { Subject, take, takeUntil } from 'rxjs'
import { AuthService } from './core/services/auth/auth.service'
// import { AuthService } from './core/services/auth/auth.service'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  public title = 'GAME APPS'
  public isAuthenticated = false
  private destroySub = new Subject<void>()

  constructor(private authService: AuthService) {}

  public ngOnInit(): void {
    this.isAuthenticated = this.authService.isLoggedIn
    console.log('alex',this.isAuthenticated)
  }

  public ngOnDestroy(): void {
    this.destroySub.next()
  }

  public logout() {
    return this.authService.signOut()
  }
}
