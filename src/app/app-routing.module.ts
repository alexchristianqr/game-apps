import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { CustomRoutingModule } from './modules/custom-routing.module'

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
]

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true }), CustomRoutingModule],
  exports: [RouterModule],
})
export class AppRoutingModule {}
