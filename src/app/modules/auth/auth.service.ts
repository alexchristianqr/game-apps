import { Injectable } from "@angular/core";
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  UserCredential,
  getAuth,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged
} from "@angular/fire/auth";
import { Firestore, doc, setDoc, getDoc, updateDoc, deleteDoc } from "@angular/fire/firestore";
import { Observable, from, tap } from "rxjs";
import { Router } from "@angular/router";
import firebase from "firebase/compat";
import Persistence = firebase.auth.Auth.Persistence;

@Injectable({
  providedIn: "root"
})
export class AuthService {
  isUserAuthenticated: boolean = false;

  // auth: Auth;
  // private browserLocalPersistence: Persistence;

  constructor(
    public auth: Auth,
    public firestore: Firestore,
    private router: Router
  ) {
    console.log("[AuthService.constructor]");

    // this.initializeUser().then();
    // this.auth = getAuth();

    // Establecer la persistencia de sesión
    // setPersistence(this.auth, browserLocalPersistence)
    //   .then(() => {
    //     console.log("Session persistence set to local.");
    //   })
    //   .catch((error) => {
    //     console.error("Error setting session persistence:", error);
    //   });

    // if (environment.useEmulators) {
    //   connectFirestoreEmulator(this.firestore, "localhost", 8081);
    // }

    // Escuchar cambios en el estado de autenticación
    // onAuthStateChanged(this.auth, (user) => {
    //   // console.log("onAuthStateChanged: jejeje", user);
    //   if (!user) {
    //     //   // this.router.navigate(["/home"]); // Redirigir a /home
    //     //
    //     //   this.userSubject.next(user); // Emitir el usuario autenticado
    //     //   if (user && this.router.url === "/login") {
    //     //     // Redirigir solo si está en /login
    //     //     this.router.navigate(["/home"]);
    //     //   }
    //     //
    //     //   // // Usuario autenticado
    //     //   // this.userSubject.next(user);
    //     //   // console.log("User authenticated:", user);
    //     //   // // Si necesitas el token
    //     //   // user.getIdToken().then((token) => {
    //     //   //   console.log("ID Token:", token);
    //     //   // });
    //     // } else {
    //     // Usuario no autenticado
    //     // this.userSubject.next(null);
    //     console.log("No user authenticated");
    //   }
    // });

    // onIdTokenChanged(this.auth, (user) => {
    //   if (user) {
    //     console.log("ID Token refreshed:", user);
    //     user.getIdToken().then((token) => console.log("New ID Token:", token));
    //   }
    // });
  }

  async initializeUser() {
    const user = await this.auth.currentUser;
    if (user) {
      console.log("Usuario autenticado:", user);
    } else {
      console.log("No hay usuario autenticado");
    }
  }

  // async setAuthPersistence() {
  //   await setPersistence(this.auth);
  // }

  // Register a new user and create their profile in Firestore
  registerUser(email: string, password: string, userData: any): Observable<UserCredential> {
    console.log("[AuthService.registerUser]", { email, password, userData });

    return from(
      createUserWithEmailAndPassword(this.auth, email, password).then(async (credential) => {
        const userRef = doc(this.firestore, `users/${credential.user.uid}`);
        await setDoc(userRef, userData);
        return credential;
      })
    );
  }

  // Login an existing user
  loginUser(email: string, password: string): Observable<UserCredential> {
    console.log("[AuthService.loginUser]");

    return from(signInWithEmailAndPassword(this.auth, email, password));
  }

  // Logout the current user
  // logout(): Observable<void> {
  //   console.log("[AuthService.logout]");
  //
  //   // return from(signOut(this.auth));
  //   return from(signOut(this.auth)).pipe(
  //     // En este punto, aseguramos que el logout se complete antes de redirigir.
  //     tap(() => {
  //       console.log("User logged out, redirecting to login...");
  //       this.router.navigate(["/login"]);
  //     })
  //   );
  // }

  // Método de logout utilizando signOut de Firebase
  logout(): Observable<void> {
    console.log("[AuthService.logout]");

    return from(signOut(this.auth)).pipe(
      tap(() => {
        console.log("User logged out, but no redirection yet.");
        // Redirigir a la página de login después de logout
        this.router.navigate(["/login"]);
      })
    );
  }

  // Get the current user (real-time updates)
  // getCurrentUser(): User | null {
  //   return this.auth.currentUser;
  // }

  // Fetch user data from Firestore
  getUserData(uid: string): Observable<any> {
    const userRef = doc(this.firestore, `users/${uid}`);
    return from(getDoc(userRef).then((doc) => doc.data()));
  }

  // Update user data in Firestore
  updateUserData(uid: string, updatedData: any): Observable<void> {
    const userRef = doc(this.firestore, `users/${uid}`);
    return from(updateDoc(userRef, updatedData));
  }

  // Delete user profile from Firestore
  deleteUserData(uid: string): Observable<void> {
    const userRef = doc(this.firestore, `users/${uid}`);
    return from(deleteDoc(userRef));
  }

  // Send password reset email
  forgotPassword(email: string): Observable<void> {
    return from(
      sendPasswordResetEmail(this.auth, email, {
        url: "https://alexchristianqr.github.io/game-apps/#/login"
      })
    );
  }
}
