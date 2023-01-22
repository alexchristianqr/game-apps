import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { GameComponent } from './game.component'

const routes: Routes = [
  {
    path: 'game',
    component: GameComponent,
    // canActivate: [AuthGuard]
  },
]

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class GameRoutingModule {}
