import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { AngularSettingsModule } from "./shared/angular-settings/angular-settings.module";
import { AngularMaterialUIModule } from "./shared/angular-material-ui/angular-material-ui.module";
import { CustomModule } from "./modules/custom.module";
import { AppComponent } from "./app.component";
import { EffectsModule } from "@ngrx/effects";
import { StoreModule } from "@ngrx/store";
import { StoreDevtoolsModule } from "@ngrx/store-devtools";
import { environment } from "../environments/environment";
import { initializeApp, provideFirebaseApp } from "@angular/fire/app";
import { AngularFirestoreModule } from "@angular/fire/compat/firestore";
import { AngularFireModule } from "@angular/fire/compat";
import { getFirestore, provideFirestore } from "@angular/fire/firestore";

import { authReducer } from "./modules/auth/store/auth.reducer";
import { appReducer } from "./app.reducer";
import { provideAuth, getAuth } from "@angular/fire/auth";
// import { getAuth } from "firebase/auth";

const firebaseConfig = environment.firebase;

// @ts-ignore
@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,

    // Exports de modulos funcionales de Angular.io
    CustomModule,

    // Exports de las configuraciones generales de Angular.io
    AngularSettingsModule,

    // Exports de Angular Material UI
    AngularMaterialUIModule,

    // Exports de Firebase
    // AngularFireModule.initializeApp(firebaseConfig),
    AngularFirestoreModule,

    StoreModule.forRoot(appReducer),
    EffectsModule.forRoot([]),

    StoreDevtoolsModule.instrument({
      maxAge: 50,
      logOnly: environment.production
    }),

    AngularFirestoreModule // Importa el módulo de Firestore

    // AngularFireModule.initializeApp(firebaseConfig), // Inicializa Firebase
    // provideAuth(() => getAuth()) // Configuración de Auth
  ],
  providers: [provideFirebaseApp(() => initializeApp(firebaseConfig)), provideFirestore(() => getFirestore()), provideAuth(() => getAuth())],
  bootstrap: [AppComponent]
})
export class AppModule {}
