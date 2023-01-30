import { Component } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { AuthService } from '../auth.service'

@Component({
  selector: 'app-forgot',
  templateUrl: './forgot.component.html',
  styleUrls: ['./forgot.component.scss'],
})
export class ForgotComponent {
  formGroup: FormGroup
  submitted: boolean | undefined
  loading: boolean = false

  constructor(private formBuilder: FormBuilder, private route: ActivatedRoute, private router: Router, private authService: AuthService) {
    this.formGroup = formBuilder.group({
      email: formBuilder.control(null, [Validators.required, Validators.email]),
    })
  }

  async onSubmit() {
    this.submitted = true

    // stop here if form is invalid
    if (this.formGroup.invalid) return

    this.loading = true
    const { email } = this.formGroup.value

    // API
    return this.authService
      .forgotPassword(email)
      .then((response) => {
        this.submitted = undefined
        this.loading = false
      })
      .catch((response) => {
        this.submitted = false
        this.loading = false
      })
  }
}
