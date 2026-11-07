import { computed, inject, Injectable } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { Router } from "@angular/router";
import { Store } from "@ngrx/store";
import {
  Auth,
  authState,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  AuthProvider,
  User as FirebaseUser
} from "@angular/fire/auth";
import { doc, Firestore, setDoc } from "@angular/fire/firestore";
import { shareReplay, tap } from "rxjs";
import { User } from "../user/user.model";
import { StorageService } from "../core/services/storage/storage.service";
import { AuthActions } from "./store/auth.actions";

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);
  private readonly router = inject(Router);
  private readonly storageService = inject(StorageService);
  private readonly store = inject(Store);

  /** Usuario de Firebase; emite null si no hay sesión. Una sola suscripción para toda la app. */
  public readonly user$ = authState(this.auth).pipe(
    tap((user) => {
      this.storageService.set("users", user ?? false);
      this.store.dispatch(AuthActions.setUserLoggedIn({ userAuthenticated: !!user }));
    }),
    shareReplay({ bufferSize: 1, refCount: false })
  );

  private readonly user = toSignal(this.user$, { initialValue: null });
  public readonly isAuthenticated = computed(() => !!this.user());

  /**
   * Actualizar data del usuario en Firestore
   */
  async setUserData(user: FirebaseUser) {
    const userData: User = {
      uid: user.uid,
      email: user.email ?? "",
      displayName: user.displayName ?? "",
      photoURL: user.photoURL ?? "",
      emailVerified: user.emailVerified
    };
    return setDoc(doc(this.firestore, `users/${user.uid}`), userData, { merge: true });
  }

  /** Iniciar sesión */
  async signIn(email: string, password: string) {
    const result = await signInWithEmailAndPassword(this.auth, email, password);
    await this.setUserData(result.user);
    await this.router.navigate(["home"]);
  }

  /** Cerrar sesión */
  async signOut() {
    await fbSignOut(this.auth);
    this.storageService.remove("users");
    await this.router.navigate(["login"]);
  }

  /** Registrar usuario */
  async signUp(email: string, password: string) {
    const result = await createUserWithEmailAndPassword(this.auth, email, password);
    await this.setUserData(result.user);
    await this.router.navigate(["home"]);
  }

  /** Enviar email de verificación */
  async sendVerificationMail() {
    if (!this.auth.currentUser) return;
    await sendEmailVerification(this.auth.currentUser);
    await this.router.navigate(["verify-email-address"]);
  }

  /** Recuperar contraseña */
  forgotPassword(passwordResetEmail: string) {
    return sendPasswordResetEmail(this.auth, passwordResetEmail, {
      url: "https://alexchristianqr.github.io/game-apps/#/login"
    });
  }

  /** Iniciar sesión con Google */
  async googleAuth() {
    return this.authLogin(new GoogleAuthProvider());
  }

  /** Login con un proveedor de autenticación */
  async authLogin(provider: AuthProvider) {
    try {
      const result = await signInWithPopup(this.auth, provider);
      await this.setUserData(result.user);
      await this.router.navigate(["home"]);
    } catch (error) {
      window.alert(error);
    }
  }
}
