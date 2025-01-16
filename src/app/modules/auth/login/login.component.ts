import { Component } from "@angular/core";
import { AuthService } from "../auth.service";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { AuthActions } from "../store/auth.actions";
import { Store } from "@ngrx/store";

const { setUserLoggedIn } = AuthActions;

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
  providers: [AuthService]
})
export class LoginComponent {
  formGroup: FormGroup;
  submitted: boolean | undefined;
  loading: boolean = false;
  hidePwd = true;

  constructor(private formBuilder: FormBuilder, private authService: AuthService, private store: Store) {
    this.formGroup = this.formBuilder.group({
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
    return this.authService.loginUser(email, password).subscribe({
      next: (data) => {
        console.log("[authService.loginUser]", data);

        this.submitted = false;
        this.loading = false;

        this.store.dispatch(
          setUserLoggedIn({
            userAuthenticated: true
          })
        );
      },
      error: (error) => console.error("Error sending reset email:", error)
    });

    // => {
    //     this.submitted = false;
    //     this.loading = false;
    //   });
  }
}
