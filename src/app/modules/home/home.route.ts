import { Routes } from '@angular/router'
import { HomeComponent } from './home.component'
import { AuthenticateGuard } from '../../core/guards/authenticate/authenticate.guard'

export const routes: Routes = [
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AuthenticateGuard],
  },
]
