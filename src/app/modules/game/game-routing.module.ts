import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { GameComponent } from './game.component'
import {AuthenticateGuard} from "../../core/guards/authenticate/authenticate.guard";

const routes: Routes = [
  {
    path: 'game',
    component: GameComponent,
    canActivate: [AuthenticateGuard]
  },
]

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class GameRoutingModule {}
