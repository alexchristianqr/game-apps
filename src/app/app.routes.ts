import { Routes } from "@angular/router";
import { authGuard } from "./core/guards/authenticate/authenticate.guard";
import { GAMES } from "./games/games.registry";

const gameRoutes: Routes = GAMES.filter((g) => g.enabled && g.loadComponent).map((g) => ({
  path: `games/${g.id}`,
  loadComponent: g.loadComponent,
  canActivate: [authGuard],
  title: g.title
}));

export const routes: Routes = [
  { path: "", redirectTo: "login", pathMatch: "full" },
  { path: "login", loadComponent: () => import("./auth/login/login.component").then((m) => m.LoginComponent) },
  { path: "register", loadComponent: () => import("./auth/register/register.component").then((m) => m.RegisterComponent) },
  { path: "forgot", loadComponent: () => import("./auth/forgot/forgot.component").then((m) => m.ForgotComponent) },
  {
    path: "home",
    loadComponent: () => import("./pages/home/home.component").then((m) => m.HomeComponent),
    canActivate: [authGuard]
  },
  ...gameRoutes,
  // Compatibilidad con la ruta antigua
  { path: "game", redirectTo: "games/tic-tac-toe", pathMatch: "full" },
  { path: "**", redirectTo: "login" }
];
