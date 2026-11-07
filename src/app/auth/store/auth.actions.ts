import { createActionGroup, props } from "@ngrx/store";

export const AuthActions = createActionGroup({
  source: "Auth",
  events: {
    "Set User Logged In": props<{ userAuthenticated: boolean }>()
  }
});
