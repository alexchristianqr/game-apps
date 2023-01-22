import { NgModule } from '@angular/core'
import { GameRoutingModule } from './game/game-routing.module'
import { HomeRoutingModule } from './home/home-routing.module'
import { LoginRoutingModule } from './login/login-routing.module'

@NgModule({
  exports: [GameRoutingModule, HomeRoutingModule, LoginRoutingModule],
})
export class CustomRoutingModule {}
