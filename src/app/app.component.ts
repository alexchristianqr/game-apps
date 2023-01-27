import { Component, OnDestroy, OnInit } from '@angular/core'
import { Subject } from 'rxjs'
import { AuthService } from './modules/auth/auth.service'
import { Store } from '@ngrx/store'
import * as AuthSelectors from './modules/auth/store/auth.selectors'
import { AuthActions } from './modules/auth/store/auth.actions'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  public title = 'GAME APPS'
  public isAuthenticated = false
  private destroySub = new Subject<void>()

  constructor(private authService: AuthService, private store: Store) {}

  public ngOnInit(): void {
    this.store.select(AuthSelectors.isLoggedIn).subscribe((response) => {
      console.log({ response })
      this.isAuthenticated = response
    })
  }

  public ngOnDestroy(): void {
    this.destroySub.next()
  }

  public async logout() {
    return this.authService.signOut().then(() => {
      this.isAuthenticated = false
      this.store.dispatch(AuthActions.setUserLoggedIn({ userAuthenticated: this.isAuthenticated }))
      this.authService.router.navigate(['login'])
    })
  }
}
