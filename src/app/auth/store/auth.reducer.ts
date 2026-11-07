import { AuthActions } from "./auth.actions";
import { createFeature, createReducer, on } from "@ngrx/store";
import { AuthState } from "./auth.state";

export const initialState: AuthState = {
  isLoggedIn: false
};

export const AuthFeatureReducer = createFeature({
  name: "auth",
  reducer: createReducer(
    initialState,
    on(AuthActions.setUserLoggedIn, (state, payload) => ({
      isLoggedIn: payload.userAuthenticated
    }))
  )
});
