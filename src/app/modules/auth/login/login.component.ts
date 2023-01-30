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
  validForm: boolean | undefined = true
  loadingButton: boolean | undefined = false
  hidePwd = true
  username = 'invitado@gmail.com'
  password = 'Invitado2023.'

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
