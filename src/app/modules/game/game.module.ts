import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { GameComponent } from './game.component'
import { AngularMaterialUIModule } from '../../shared/angular-material-ui/angular-material-ui.module'
import { AngularSettingsModule } from '../../shared/angular-settings/angular-settings.module'

@NgModule({
  declarations: [GameComponent],
  imports: [CommonModule, AngularMaterialUIModule, AngularSettingsModule],
})
export class GameModule {}
