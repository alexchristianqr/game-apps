import { ActionReducerMap } from "@ngrx/store";
import { authReducer } from "./modules/auth/store/auth.reducer";
import { AuthState } from "./modules/auth/store/auth.state";
// import { AuthState } from './auth/auth.state';

export interface AppState {
  auth: AuthState; // Aquí defines las propiedades del estado global
}

export const appReducer: ActionReducerMap<AppState> = {
  auth: authReducer // Asocias el reducer de auth con la clave "auth"
};
