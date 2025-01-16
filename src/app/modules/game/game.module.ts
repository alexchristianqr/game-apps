import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AngularMaterialUIModule } from "../../shared/angular-material-ui/angular-material-ui.module";
import { AngularSettingsModule } from "../../shared/angular-settings/angular-settings.module";
import { RouterModule } from "@angular/router";
import { routes } from "./game.route";
import { TresEnLineaComponent } from "./components/tres-en-linea/tres-en-linea.component";
import { TetrisComponent } from "./components/tetris/tetris.component";

@NgModule({
  declarations: [TetrisComponent, TresEnLineaComponent],
  imports: [CommonModule, AngularMaterialUIModule, AngularSettingsModule, RouterModule.forRoot(routes, { useHash: true })]
})
export class GameModule {}
