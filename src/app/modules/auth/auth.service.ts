import { Injectable } from "@angular/core";
import { Auth, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, UserCredential } from "@angular/fire/auth";
import { Firestore, doc, setDoc, getDoc, updateDoc, deleteDoc } from "@angular/fire/firestore";
import { Observable, from } from "rxjs";

@Injectable({
  providedIn: "root"
})
export class AuthService {
  isUserAuthenticated: boolean = false;

  constructor(private auth: Auth, private firestore: Firestore) {}

  // Register a new user and create their profile in Firestore
  registerUser(email: string, password: string, userData: any): Observable<UserCredential> {
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
    return from(signInWithEmailAndPassword(this.auth, email, password));
  }

  // Logout the current user
  logout(): Observable<void> {
    return from(signOut(this.auth));
  }

  // Get the current user (real-time updates)
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

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

  /**
   * Retornar verdadero cuando el usuario ha iniciado sesión
   */
  get isLoggedIn(): boolean {
    return this.isUserAuthenticated;
    // const user = JSON.parse(localStorage.getItem('users')!)
    // // return user;
    // return user !== null
    // return user !== null && user.emailVerified !== false
  }
}
