import { NgModule } from "@angular/core";
import { HomeModule } from "./home/home.module";
import { GameModule } from "./game/game.module";
import { AuthModule } from "./auth/auth.module";

@NgModule({
  exports: [HomeModule, GameModule, AuthModule]
})
export class CustomModule {}
