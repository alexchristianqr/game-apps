import { Component, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
// import { AuthService } from '../../core/services/auth/auth.service'
import { filter, Subject, take, takeUntil } from 'rxjs'

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  public loginValid = true
  public username = ''
  public password = ''

  private _destroySub$ = new Subject<void>()
  private readonly returnUrl: string

  constructor(private _route: ActivatedRoute, private _router: Router) {
    this.returnUrl = this._route.snapshot.queryParams['returnUrl'] || '/game'
  }

  public ngOnInit(): void {}

  public ngOnDestroy(): void {}

  public onSubmit(): void {}
}
