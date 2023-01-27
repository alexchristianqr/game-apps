import { NgModule } from '@angular/core'
import { AngularFirestoreModule } from '@angular/fire/compat/firestore'
import { AngularFireDatabaseModule } from '@angular/fire/compat/database'
import { AngularFireStorageModule } from '@angular/fire/compat/storage'
import { AngularFireModule } from '@angular/fire/compat'
import { environment } from '../../../environments/environment'
const firebaseConfig: object = environment.firebase

@NgModule({
  imports: [AngularFireModule.initializeApp(firebaseConfig, 'game-apps')],
  exports: [AngularFireModule, AngularFirestoreModule, AngularFireDatabaseModule, AngularFireStorageModule],
})
export class AngularFirebaseModule {}
