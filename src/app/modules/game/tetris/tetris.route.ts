import { Routes } from "@angular/router";
import { AuthenticateGuard } from "../../../core/guards/authenticate/authenticate.guard";
import { TetrisComponent } from "./tetris.component";

export const routes: Routes = [
  {
    path: "tetris",
    component: TetrisComponent,
    canActivate: [AuthenticateGuard]
  }
];
