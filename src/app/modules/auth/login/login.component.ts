import { Component } from "@angular/core";
import { AuthService } from "../auth.service";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"]
})
export class LoginComponent {
  formGroup: FormGroup;
  submitted: boolean | undefined;
  loading: boolean = false;
  hidePwd = true;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) {
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
