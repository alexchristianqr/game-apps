import { Routes } from "@angular/router";
import { AuthenticateGuard } from "../../core/guards/authenticate/authenticate.guard";
import { TresEnLineaComponent } from "./tres-en-linea/tres-en-linea.component";

export const routes: Routes = [
  {
    path: "game",
    canActivate: [AuthenticateGuard],
    children: [
      {
        path: "tres-en-linea",
        component: TresEnLineaComponent
      },
      {
        path: "tetris",
        component: TresEnLineaComponent
      }
    ]
  }
];
