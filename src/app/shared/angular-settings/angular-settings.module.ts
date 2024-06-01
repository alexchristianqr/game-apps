import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { AppRoutingModule } from "../../app-routing.module";

@NgModule({
  exports: [FormsModule, ReactiveFormsModule, AppRoutingModule]
})
export class AngularSettingsModule {}
