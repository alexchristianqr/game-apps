import { RouterLink } from "@angular/router";
import { Eye, EyeOff, LoaderCircle, LucideAngularModule } from "lucide-angular";
import { ButtonDirective } from "../../core/ui/button/button.directive";
import { FieldComponent } from "../../core/ui/field/field.component";
import { PanelComponent } from "../../core/ui/panel/panel.component";
import { ReactiveFormsModule } from "@angular/forms";
import { Component, OnInit, inject } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthService } from "../auth.service";

@Component({
  imports: [ReactiveFormsModule, RouterLink, LucideAngularModule, ButtonDirective, FieldComponent, PanelComponent],
  selector: "app-register",
  templateUrl: "./register.component.html"
})
export class RegisterComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  formGroup: FormGroup;
  loading = false;
  submitted: boolean | undefined;
  hidePwd = true;
  readonly icons = { Eye, EyeOff, LoaderCircle };

  constructor() {
    const formBuilder = this.formBuilder;

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
    return this.authService.signUp(email, password).catch(() => {
      this.submitted = false;
      this.loading = false;
    });
  }
}
