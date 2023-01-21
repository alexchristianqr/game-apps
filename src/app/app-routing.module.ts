import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {LoginComponent} from "./login/login.component";
import {GameComponent} from "./game/game.component";
import {HomeComponent} from "./home/home.component";
import {AuthGuard} from "./auth/auth.guard";

const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
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
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
