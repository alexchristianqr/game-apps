import { Component, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { AuthService } from '../../core/services/auth/auth.service'
import { filter, Subject, take, takeUntil } from 'rxjs'
import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { environment } from '../../../environments/environment'
import { getAuth } from 'firebase/auth'

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  public loginValid = true
  public username = ''
  public password = ''

  // private _destroySub$ = new Subject<void>()
  // private readonly returnUrl: string

  constructor(private authService: AuthService) {
    // this.returnUrl = this._route.snapshot.queryParams['returnUrl'] || '/game'
  }

  public ngOnInit(): void {
    // Initialize Firebase
    const firebaseConfig: object = environment.firebase
    const app = initializeApp(firebaseConfig)
    const analytics = getAnalytics(app)
    console.log({ analytics })
    // Initialize Firebase Authentication and get a reference to the service
    // const auth = getAuth(app);
  }

  public ngOnDestroy(): void {}

  public async onSubmit() {
    return this.authService.signIn(this.username, this.password)
  }
}
