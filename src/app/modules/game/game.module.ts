import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { GameComponent } from "./game.component";
import { AngularMaterialUIModule } from "../../shared/angular-material-ui/angular-material-ui.module";
import { AngularSettingsModule } from "../../shared/angular-settings/angular-settings.module";
import { RouterModule } from "@angular/router";
import { routes } from "./game.route";

@NgModule({
  declarations: [GameComponent],
  imports: [CommonModule, AngularMaterialUIModule, AngularSettingsModule, RouterModule.forRoot(routes, { useHash: true })]
})
export class GameModule {}
