import { RouterLink } from "@angular/router";
import { Eye, EyeOff, LoaderCircle, LucideAngularModule } from "lucide-angular";
import { ButtonDirective } from "../../core/ui/button/button.directive";
import { FieldComponent } from "../../core/ui/field/field.component";
import { PanelComponent } from "../../core/ui/panel/panel.component";
import { ReactiveFormsModule } from "@angular/forms";
import { Component, inject } from "@angular/core";
import { AuthService } from "../auth.service";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";

@Component({
  imports: [ReactiveFormsModule, RouterLink, LucideAngularModule, ButtonDirective, FieldComponent, PanelComponent],
  selector: "app-login",
  templateUrl: "./login.component.html"
})
export class LoginComponent {
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);

  formGroup: FormGroup;
  submitted: boolean | undefined;
  loading: boolean = false;
  hidePwd = true;
  readonly icons = { Eye, EyeOff, LoaderCircle };

  constructor() {
    const formBuilder = this.formBuilder;

    this.formGroup = formBuilder.group({
      email: formBuilder.control("invitado@gmail.com", [Validators.required, Validators.email]),
      password: formBuilder.control("Invitado2023.", [Validators.required])
    });
  }

  async onSubmit() {
    this.submitted = true;

    // stop here if form is invalid
    if (this.formGroup.invalid) return;

    this.loading = true;
    const { email, password } = this.formGroup.value;

    // API
    return this.authService.signIn(email, password).catch(() => {
      this.submitted = false;
      this.loading = false;
    });
  }
}
