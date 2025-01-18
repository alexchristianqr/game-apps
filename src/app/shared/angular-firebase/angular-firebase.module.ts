import { NgModule } from "@angular/core";
import { AngularFirestoreModule } from "@angular/fire/compat/firestore";
import { AngularFireModule } from "@angular/fire/compat";
import { environment } from "../../../environments/environment";
import { AngularFireAuthModule } from "@angular/fire/compat/auth";
const firebaseConfig: object = environment.firebase;

@NgModule({
  imports: [AngularFireModule.initializeApp(firebaseConfig, "game-apps"), AngularFireAuthModule, AngularFirestoreModule],
  exports: [AngularFireModule, AngularFireAuthModule, AngularFirestoreModule]
})
export class AngularFirebaseModule {}
