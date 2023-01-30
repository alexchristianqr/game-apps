import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { AuthService } from '../auth.service'

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  formGroup: FormGroup
  loading = false
  submitted: boolean | undefined
  hidePwd = true

  constructor(private formBuilder: FormBuilder, private route: ActivatedRoute, private router: Router, private authService: AuthService) {
    this.formGroup = formBuilder.group({
      displayName: formBuilder.control(null, Validators.required),
      email: formBuilder.control(null, Validators.required),
      password: formBuilder.control(null, [Validators.required, Validators.minLength(6)]),
    })
  }

  ngOnInit() {
    this.formGroup.reset({
      displayName: null,
      email: null,
      password: null,
      emailVerified: null,
      photoURL: null,
    })
  }

  async onSubmit() {
    this.submitted = true

    // stop here if form is invalid
    if (this.formGroup.invalid) return

    this.loading = true
    const { email, password } = this.formGroup.value

    // API
    return this.authService.signUp(email, password).catch((response) => {
      this.submitted = false
      this.loading = false
    })
  }
}
