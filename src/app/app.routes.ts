import { Routes } from "@angular/router";
import { GAMES } from "./games/games.registry";

const gameRoutes: Routes = GAMES.filter((g) => g.enabled && g.loadComponent).map((g) => ({
  path: `games/${g.id}`,
  loadComponent: g.loadComponent,
  title: g.title
}));

export const routes: Routes = [
  { path: "", redirectTo: "home", pathMatch: "full" },
  { path: "login", loadComponent: () => import("./auth/login/login.component").then((m) => m.LoginComponent) },
  { path: "register", loadComponent: () => import("./auth/register/register.component").then((m) => m.RegisterComponent) },
  { path: "forgot", loadComponent: () => import("./auth/forgot/forgot.component").then((m) => m.ForgotComponent) },
  {
    path: "home",
    loadComponent: () => import("./pages/home/home.component").then((m) => m.HomeComponent),
    title: "Inicio"
  },
  ...gameRoutes,
  // Compatibilidad con la ruta antigua
  { path: "game", redirectTo: "games/tic-tac-toe", pathMatch: "full" },
  { path: "**", redirectTo: "home" }
];
