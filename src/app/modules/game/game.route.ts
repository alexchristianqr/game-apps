import { Routes } from "@angular/router";
import { GameComponent } from "./game.component";
import { AuthenticateGuard } from "../../core/guards/authenticate/authenticate.guard";

export const routes: Routes = [
  {
    path: "game",
    component: GameComponent,
    canActivate: [AuthenticateGuard]
  }
];
