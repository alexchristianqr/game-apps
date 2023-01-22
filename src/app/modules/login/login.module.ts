import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { LoginComponent } from './login.component'
import { AngularMaterialUIModule } from '../../shared/angular-material-ui/angular-material-ui.module'
import { AngularSettingsModule } from '../../shared/angular-settings/angular-settings.module'

@NgModule({
  declarations: [LoginComponent],
  imports: [CommonModule, AngularMaterialUIModule, AngularSettingsModule],
})
export class LoginModule {}
