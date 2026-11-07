import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from "@angular/core";
import { provideRouter, withHashLocation, withViewTransitions } from "@angular/router";
import { provideFirebaseApp, initializeApp, FirebaseOptions } from "@angular/fire/app";
import { provideAuth, getAuth } from "@angular/fire/auth";
import { provideFirestore, getFirestore } from "@angular/fire/firestore";
import { provideStore, provideState } from "@ngrx/store";
import { provideEffects } from "@ngrx/effects";
import { provideStoreDevtools } from "@ngrx/store-devtools";
import { routes } from "./app.routes";
import { environment } from "../environments/environment";
import { AuthFeatureReducer } from "./auth/store/auth.reducer";
import { AuthEffects } from "./auth/store/auth.effects";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withHashLocation(), withViewTransitions()),
    provideFirebaseApp(() => initializeApp(environment.firebase as unknown as FirebaseOptions)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStore(),
    provideState(AuthFeatureReducer),
    provideEffects([AuthEffects]),
    provideStoreDevtools({ maxAge: 50, logOnly: environment.production })
  ]
};
