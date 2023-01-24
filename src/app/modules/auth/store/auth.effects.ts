import { Injectable } from '@angular/core'
import { Actions, OnInitEffects } from '@ngrx/effects'
import { Action } from '@ngrx/store'
import { AuthActions } from './auth.actions'

@Injectable()
export class AuthEffects implements OnInitEffects {
  constructor(private actions$: Actions) {}

  ngrxOnInitEffects(): Action {
    return AuthActions.doLogin()
  }
}
