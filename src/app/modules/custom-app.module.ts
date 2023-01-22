import { NgModule } from '@angular/core'
import { HomeModule } from './home/home.module'
import { GameModule } from './game/game.module'
import { LoginModule } from './login/login.module'

@NgModule({
  exports: [HomeModule, GameModule, LoginModule],
})
export class CustomAppModule {}
