import { Component, OnInit } from "@angular/core";
import { AuthService } from "../auth.service";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { checkAuthState, login, loginSuccess } from "../store/auth.actions";
import { Store } from "@ngrx/store";
import { Router } from "@angular/router";
import { AuthState } from "../store/auth.state";
import { map, take } from "rxjs";
import { selectIsAuthenticated } from "../store/auth.selectors";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
  providers: [AuthService]
})
export class LoginComponent implements OnInit {
  formGroup: FormGroup;
  submitted: boolean | undefined;
  loading: boolean = false;
  hidePwd = true;

  error: string | null = null;

  constructor(
    formBuilder: FormBuilder,
    private authService: AuthService,
    private store: Store<{ auth: AuthState }>,
    private router: Router
  ) {
    this.formGroup = formBuilder.group({
      email: formBuilder.control("invitado@gmail.com", [Validators.required, Validators.email]),
      password: formBuilder.control("Invitado2023.", [Validators.required])
    });
  }

  ngOnInit(): void {
    console.log("[LoginComponent.ngOnInit]");
    // this.store.dispatch(checkAuthState());
  }

  async onLoginSubmit() {
    this.submitted = true;

    // stop here if form is invalid
    if (this.formGroup.invalid) return;

    this.loading = true;
    const { email, password } = this.formGroup.value;

    console.log("[onLoginSubmit formGroup.value]", this.formGroup.value);

    this.store.dispatch(
      login({
        email,
        password
      })
    );

    // this.store
    //   .select("auth")
    //   // .pipe(
    //   //   map((state) => state.user),
    //   //   take(1)
    //   // )
    //   .subscribe((user) => {
    //     alert(333);
    //     if (user) this.router.navigate(["/home"]); // Redirige a 'home'
    //   });
  }
}
