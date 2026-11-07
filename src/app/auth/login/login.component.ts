import { RouterLink } from "@angular/router";
import { ReactiveFormsModule } from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { MatGridListModule } from "@angular/material/grid-list";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { Component, inject } from "@angular/core";
import { AuthService } from "../auth.service";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";

@Component({
  imports: [ReactiveFormsModule, RouterLink, MatCardModule, MatGridListModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"]
})
export class LoginComponent {
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);

  formGroup: FormGroup;
  submitted: boolean | undefined;
  loading: boolean = false;
  hidePwd = true;

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
