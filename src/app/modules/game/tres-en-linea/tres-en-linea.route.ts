import { Routes } from "@angular/router";
import { TresEnLineaComponent } from "./tres-en-linea.component";
import { AuthenticateGuard } from "../../../core/guards/authenticate/authenticate.guard";

export const routes: Routes = [
  {
    path: "tres-en-linea",
    component: TresEnLineaComponent,
    canActivate: [AuthenticateGuard]
  }
];
