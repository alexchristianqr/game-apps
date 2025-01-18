import { checkAuthState, login, loginFailure, loginSuccess, logout, logoutFailure, logoutSuccess } from "./auth.actions";
import { createReducer, on } from "@ngrx/store";
import { initialState } from "./auth.state";

export const authReducer = createReducer(
  initialState,
  on(login, (state) => ({
    ...state,
    isAuthenticated: true,
    loading: true,
    error: null
  })),
  on(loginSuccess, (state, { user }) => ({
    ...state,
    user,
    isAuthenticated: true,
    loading: false,
    error: null
  })),
  on(loginFailure, (state, { error }) => ({
    ...state,
    user: null,
    isAuthenticated: false,
    loading: false,
    error
  })),
  on(logout, () => initialState),
  on(logoutSuccess, (state) => ({
    ...state,
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null
  })),
  on(logoutFailure, (state, { error }) => ({
    ...state,
    user: null,
    isAuthenticated: false,
    loading: false,
    error
  })),
  on(checkAuthState, (state) => ({
    ...state,
    user: state.user,
    isAuthenticated: !!state.user,
    loading: false,
    error: null
  }))
);
