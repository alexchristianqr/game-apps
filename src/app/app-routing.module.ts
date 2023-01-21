import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LoginComponent} from "./login/login.component";
import {GameComponent} from "./game/game.component";
import {HomeComponent} from "./home/home.component";

const routes: Routes = [
  {path: 'login', component: LoginComponent},
  {
    path: 'game',
    component: GameComponent,
  },
  {
    path: '',
    component: HomeComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
