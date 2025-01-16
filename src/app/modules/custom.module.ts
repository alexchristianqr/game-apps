import { NgModule } from "@angular/core";
import { HomeModule } from "./home/home.module";
import { GameModule } from "./game/game.module";
import { AuthModule } from "./auth/auth.module";
import { NgForOf, NgIf } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";

@NgModule({
  exports: [HomeModule, GameModule, AuthModule],
  imports: [NgForOf, NgIf, ReactiveFormsModule, RouterLink]
})
export class CustomModule {}
