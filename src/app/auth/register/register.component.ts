import { RouterLink } from "@angular/router";
import { ReactiveFormsModule } from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { MatGridListModule } from "@angular/material/grid-list";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthService } from "../auth.service";

@Component({
  imports: [ReactiveFormsModule, RouterLink, MatCardModule, MatGridListModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  selector: "app-register",
  templateUrl: "./register.component.html",
  styleUrls: ["./register.component.scss"]
})
export class RegisterComponent implements OnInit {
  formGroup: FormGroup;
  loading = false;
  submitted: boolean | undefined;
  hidePwd = true;

  constructor(private formBuilder: FormBuilder, private route: ActivatedRoute, private router: Router, private authService: AuthService) {
    this.formGroup = formBuilder.group({
      displayName: formBuilder.control(null, [Validators.required]),
      email: formBuilder.control(null, [Validators.required, Validators.email]),
      password: formBuilder.control(null, [Validators.required, Validators.minLength(6)])
    });
  }

  ngOnInit() {
    this.formGroup.reset({
      displayName: null,
      email: null,
      password: null,
      emailVerified: null,
      photoURL: null
    });
  }

  async onSubmit() {
    this.submitted = true;

    // stop here if form is invalid
    if (this.formGroup.invalid) return;

    this.loading = true;
    const { email, password } = this.formGroup.value;

    // API
    return this.authService.signUp(email, password).catch((response) => {
      this.submitted = false;
      this.loading = false;
    });
  }
}
