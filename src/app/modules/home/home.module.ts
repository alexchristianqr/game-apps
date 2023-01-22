import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HomeComponent } from './home.component'
import { AngularMaterialUIModule } from '../../shared/angular-material-ui/angular-material-ui.module'
import { AngularSettingsModule } from '../../shared/angular-settings/angular-settings.module'

@NgModule({
  declarations: [HomeComponent],
  imports: [CommonModule, AngularMaterialUIModule, AngularSettingsModule],
})
export class HomeModule {}
