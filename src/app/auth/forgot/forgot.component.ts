import { RouterLink } from "@angular/router";
import { ReactiveFormsModule } from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { MatGridListModule } from "@angular/material/grid-list";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { Component, inject } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthService } from "../auth.service";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
  imports: [ReactiveFormsModule, RouterLink, MatCardModule, MatGridListModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSnackBarModule],
  selector: "app-forgot",
  templateUrl: "./forgot.component.html",
  styleUrls: ["./forgot.component.scss"]
})
export class ForgotComponent {
  private formBuilder = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

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
        this.snackBar.open("Enlace enviado con éxito, porfavor revise su correo", "", {
          duration: 3000
        });
      })
      .catch(() => {
        this.submitted = false;
        this.loading = false;
        this.snackBar.open("El enlace no se ha enviado", "", {
          duration: 3000
        });
      });
  }
}
