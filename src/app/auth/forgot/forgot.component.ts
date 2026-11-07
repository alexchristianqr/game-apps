import { RouterLink } from "@angular/router";
import { LoaderCircle, LucideAngularModule } from "lucide-angular";
import { ButtonDirective } from "../../core/ui/button/button.directive";
import { FieldComponent } from "../../core/ui/field/field.component";
import { PanelComponent } from "../../core/ui/panel/panel.component";
import { ToastService } from "../../core/ui/toast/toast.service";
import { ReactiveFormsModule } from "@angular/forms";
import { Component, inject } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthService } from "../auth.service";

@Component({
  imports: [ReactiveFormsModule, RouterLink, LucideAngularModule, ButtonDirective, FieldComponent, PanelComponent],
  selector: "app-forgot",
  templateUrl: "./forgot.component.html"
})
export class ForgotComponent {
  private formBuilder = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  readonly icons = { LoaderCircle };

  formGroup: FormGroup;
  submitted: boolean | undefined;
  loading: boolean = false;

  constructor() {
    const formBuilder = this.formBuilder;

    this.formGroup = formBuilder.group({
      email: formBuilder.control(null, [Validators.required, Validators.email])
    });
  }

  async onSubmit() {
    this.submitted = true;

    // stop here if form is invalid
    if (this.formGroup.invalid) return;

    this.loading = true;
    const { email } = this.formGroup.value;

    // API
    return this.authService
      .forgotPassword(email)
      .then(() => {
        this.submitted = undefined;
        this.loading = false;
        this.toast.show("Enlace enviado con éxito, porfavor revise su correo");
      })
      .catch(() => {
        this.submitted = false;
        this.loading = false;
        this.toast.show("El enlace no se ha enviado", "error");
      });
  }
}
