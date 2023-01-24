import { Component, OnDestroy, OnInit } from '@angular/core'
import { AuthService } from '../auth.service'
import { initializeApp } from 'firebase/app'
import { environment } from '../../../../environments/environment'
import { getAuth } from 'firebase/auth'

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  public loginValid: boolean | undefined = true
  public hidePwd = true
  public username = 'invitado@gmail.com'
  public password = 'Invitado2023.'

  // private _destroySub$ = new Subject<void>()
  // private readonly returnUrl: string

  constructor(private authService: AuthService) {}

  public ngOnInit(): void {
    // Initialize Firebase
    const firebaseConfig: object = environment.firebase
    const app = initializeApp(firebaseConfig)
    const authUser = getAuth(app)
    console.log({ authUser })
    // Initialize Firebase Authentication and get a reference to the service
    // const auth = getAuth(app);
  }

  public ngOnDestroy(): void {}

  public async onSubmit() {
    this.loginValid = undefined

    return this.authService
      .signIn(this.username, this.password)
      .then((result) => {
        this.authService.setUserData(result.user)
        this.authService.afAuth.authState.subscribe((user) => {
          if (user) {
            this.authService.router.navigate(['home'])
          }
        })
        this.loginValid = true
      })
      .catch((error) => {
        this.loginValid = false
        // window.alert(error.message)
      })
    // .then(() => {
    //   this.loginValid = true
    // })
    // .catch((r) => {
    //   this.loginValid = false
    // })
  }
}
