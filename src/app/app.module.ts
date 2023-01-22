import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { AngularSettingsModule } from './shared/angular-settings/angular-settings.module'
import { AngularMaterialUIModule } from './shared/angular-material-ui/angular-material-ui.module'
import { CustomAppModule } from './modules/custom-app.module'
import { AppComponent } from './app.component'
import { AuthService } from './core/services/auth/auth.service'
import { AngularFirebaseModule } from './shared/angular-firebase/angular-firebase.module'

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,

    // Exports de modulos funcionales de Angular.io
    CustomAppModule,

    // Exports de las configuraciones generales de Angular.io
    AngularSettingsModule,

    // Exports de Angular Material UI
    AngularMaterialUIModule,

    // Exports firebase
    AngularFirebaseModule,
  ],
  providers: [AuthService],
  bootstrap: [AppComponent],
})
export class AppModule {}
