import { Component } from '@angular/core'
import { AuthService } from '../auth.service'
import { Store } from '@ngrx/store'
import { StorageService } from '../../../core/services/storage/storage.service'

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  public loginValid: boolean | undefined = true
  public hidePwd = true
  public username = 'invitado@gmail.com'
  public password = 'Invitado2023.'

  constructor(private authService: AuthService, private store$: Store, private storageService: StorageService) {}

  public async onSubmit() {
    this.loginValid = undefined

    return this.authService.signIn(this.username, this.password)
  }

  get isAuthenticated(): boolean {
    return this.authService.isUserAuthenticated
  }
}
