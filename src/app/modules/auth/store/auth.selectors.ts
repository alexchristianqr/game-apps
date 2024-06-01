import { createSelector } from "@ngrx/store";
import { AuthState } from "./auth.state";
import { AuthFeatureReducer } from "./auth.reducer";

export const isLoggedIn = createSelector(AuthFeatureReducer.selectAuthState, (state: AuthState) => state.isLoggedIn);
