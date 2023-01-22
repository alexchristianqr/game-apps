import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { LoginComponent } from './modules/login/login.component'
import { GameComponent } from './modules/game/game.component'
import { HomeComponent } from './modules/home/home.component'

const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'game',
    component: GameComponent,
    // canActivate: [AuthGuard]
  },
  {
    path: '',
    component: HomeComponent,
    // canActivate: [AuthGuard]
  },
]

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
