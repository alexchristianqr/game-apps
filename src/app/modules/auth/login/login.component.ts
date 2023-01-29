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
  public validForm: boolean | undefined = true
  public loadingButton: boolean| undefined = false
  public hidePwd = true
  public username = 'invitado@gmail.com'
  public password = 'Invitado2023.'

  constructor(private authService: AuthService, private store$: Store, private storageService: StorageService) {}

  protected async signIn() {
    this.loadingButton = true
    this.validForm = undefined
    return this.authService.signIn(this.username, this.password).catch(() => {
      this.validForm = false
      this.loadingButton = false
    })
  }
}
