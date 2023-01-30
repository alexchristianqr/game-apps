import { Injectable } from '@angular/core'
import * as auth from 'firebase/auth'
import { AngularFireAuth } from '@angular/fire/compat/auth'
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/compat/firestore'
import { Router } from '@angular/router'
import { User } from '../user/user.model'
import { StorageService } from '../../core/services/storage/storage.service'
import { AuthActions } from './store/auth.actions'
import { Store } from '@ngrx/store'

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  isUserAuthenticated: boolean = false

  constructor(
    public afs: AngularFirestore, // Inject Firestore service
    public afAuth: AngularFireAuth, // Inject Firebase auth service
    public router: Router,
    private storageService: StorageService,
    private store: Store
  ) {
    // Guardar data en localstorage
    this.afAuth.authState.subscribe(async (user) => {
      if (user) {
        this.isUserAuthenticated = true
        this.storageService.set('users', user)
        await this.router.navigate(['home'])
      } else {
        this.storageService.set('users', false)
      }
    })
  }

  /**
   * Actualizar data del usuario firebase
   * @param user
   */
  async setUserData(user: any) {
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${user.uid}`)
    const userData: User = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
    }

    return userRef.set(userData, {
      merge: true,
    })
  }

  /**
   * Iniciar sesión
   * @param email
   * @param password
   */
  async signIn(email: string, password: string) {
    return this.afAuth.signInWithEmailAndPassword(email, password).then((result) => {
      this.afAuth.authState.subscribe((user: any) => {
        if (!user) return
        this.isUserAuthenticated = true
        this.setUserData(result.user) // Guardar en firebase
        this.storageService.set('users', user) // Guardar en localstorage
        this.router.navigate(['home']) // Redireccionar a la pagina de Home
      })
    })
  }

  /**
   * Cerrar sesión
   */
  async signOut() {
    return this.afAuth.signOut().then(() => {
      this.isUserAuthenticated = false
      this.store.dispatch(
        AuthActions.setUserLoggedIn({
          userAuthenticated: this.isUserAuthenticated,
        })
      )
      localStorage.removeItem('user')
      this.router.navigate(['login'])
    })
  }

  /**
   * Registrar usuario
   * @param email
   * @param password
   */
  async signUp(email: string, password: string) {
    return this.afAuth.createUserWithEmailAndPassword(email, password).then((result) => {
      // Call the SendVerificaitonMail() function when new user sign
      // up and returns promise
      // this.sendVerificationMail()
      console.log({ result })
      this.setUserData(result.user)
    })
  }

  /**
   * Enviar email de verificación
   */
  async sendVerificationMail() {
    return this.afAuth.currentUser
      .then((u: any) => u.sendEmailVerification())
      .then(() => {
        this.router.navigate(['verify-email-address'])
      })
  }

  /**
   * Recuperar contraseña
   * @param passwordResetEmail
   */
  forgotPassword(passwordResetEmail: string) {
    return this.afAuth
      .sendPasswordResetEmail(passwordResetEmail)
      .then(() => {
        window.alert('Password reset email sent, check your inbox.')
      })
      .catch((error) => {
        window.alert(error)
      })
  }

  /**
   * Retornar verdadero cuando el usuario ha iniciado sesión
   */
  get isLoggedIn(): boolean {
    return this.isUserAuthenticated
    // const user = JSON.parse(localStorage.getItem('users')!)
    // // return user;
    // return user !== null
    // return user !== null && user.emailVerified !== false
  }

  /**
   * Iniciar sesión con Google
   */
  async googleAuth() {
    return this.authLogin(new auth.GoogleAuthProvider()).then((res: any) => {
      this.router.navigate(['home'])
    })
  }

  /**
   * Login para ejecutar un proveedor de autenticación
   * @param provider
   */
  async authLogin(provider: any) {
    return this.afAuth
      .signInWithPopup(provider)
      .then((result) => {
        this.router.navigate(['home'])
        this.setUserData(result.user)
      })
      .catch((error) => {
        window.alert(error)
      })
  }
}
