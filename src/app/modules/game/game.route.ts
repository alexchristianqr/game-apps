import { Routes } from "@angular/router";
import { AuthenticateGuard } from "../../core/guards/authenticate/authenticate.guard";
import { TresEnLineaComponent } from "./components/tres-en-linea/tres-en-linea.component";
import { TetrisComponent } from "./components/tetris/tetris.component";

export const routes: Routes = [
  {
    path: "game",
    canActivate: [AuthenticateGuard],
    children: [
      {
        path: "tres-en-linea",
        component: TresEnLineaComponent,
        canActivate: [AuthenticateGuard]
      },
      {
        path: "tetris",
        component: TetrisComponent,
        canActivate: [AuthenticateGuard]
      }
    ]
  }
];
