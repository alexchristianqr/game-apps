import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { AngularMaterialUIModule } from '../../shared/angular-material-ui/angular-material-ui.module'
import { AngularSettingsModule } from '../../shared/angular-settings/angular-settings.module'
import { EffectsModule } from '@ngrx/effects'
import { StoreModule } from '@ngrx/store'
import { AuthEffects } from './store/auth.effects'
import * as authReducer from './store/auth.reducer'
import { RouterModule } from '@angular/router'
import { routes } from './auth.route'
import { LoginComponent } from './login/login.component'
import { RegisterComponent } from './register/register.component'
import { ForgotComponent } from './forgot/forgot.component'

@NgModule({
  declarations: [LoginComponent, RegisterComponent, ForgotComponent],
  imports: [
    CommonModule,
    AngularMaterialUIModule,
    AngularSettingsModule,
    RouterModule.forRoot(routes, { useHash: true }),
    StoreModule.forFeature(authReducer.AuthFeatureReducer),
    EffectsModule.forFeature([AuthEffects]),
  ],
})
export class AuthModule {}
