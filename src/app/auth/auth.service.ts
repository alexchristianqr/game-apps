import {Injectable, OnDestroy} from '@angular/core';
import { BehaviorSubject, catchError, from, map, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { AuthnTransaction, OktaAuth } from '@okta/okta-auth-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy{

  private authSub: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public get isAuthenticated$(): Observable<boolean> {
    return this.authSub.asObservable();
  }

  constructor(private _router: Router, private authClient: OktaAuth) {
    this.authClient.session.exists().then(exists => this.authSub.next(exists));
  }

  public ngOnDestroy(): void {
    this.authSub.next(false);
    this.authSub.complete();
  }

  public login(username: string, password: string): Observable<void> {
    return from(this.authClient.signInWithCredentials({username, password})).pipe(
      map((t: AuthnTransaction) => this.handleSignInResponse(t))
    );
  }

  public logout(redirect: string): Observable<void> {
    return from(this.authClient.signOut()).pipe(
      tap( _ => (this.authSub.next(false), this._router.navigate([redirect]))),
      catchError(err => {
        console.error(err);
        throw new Error('Unable to sign out');
      })
    )
  }

  private handleSignInResponse(transaction: AuthnTransaction): void {
    if (transaction.status !== 'SUCCESS') {
      throw new Error(`We cannot handle the ${transaction.status} status`);
    }

    this.authSub.next(true)
    this.authClient.session.setCookieAndRedirect(transaction.sessionToken);
  }
}
