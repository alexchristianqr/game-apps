import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { AngularSettingsModule } from './shared/angular-settings/angular-settings.module'
import { AngularMaterialUIModule } from './shared/angular-material-ui/angular-material-ui.module'
import { CustomAppModule } from './modules'
import { AppComponent } from './app.component'

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,

    // Exports de las configuraciones generales de Angular.io
    AngularSettingsModule,

    // Exports de Angular Material UI
    AngularMaterialUIModule,

    // Exports de modulos funcionales de Angular.io
    CustomAppModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
