import { Component, OnDestroy, OnInit } from '@angular/core'
import { Subject } from 'rxjs'
import { AuthService } from './modules/auth/auth.service'
import { Store } from '@ngrx/store'
import * as AuthSelectors from './modules/auth/store/auth.selectors'
import { AuthActions } from './modules/auth/store/auth.actions'
import { StorageService } from './core/services/storage/storage.service'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnDestroy {
  public title = 'GAME APPS'
  private destroySub = new Subject<void>()

  constructor(private authService: AuthService) {}

  public ngOnDestroy(): void {
    this.destroySub.next()
  }

  get isAuthenticated(): boolean {
    return this.authService.isUserAuthenticated
  }

  public async logout() {
    return this.authService.signOut()
  }
}
