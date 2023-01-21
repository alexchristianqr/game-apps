import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';

import { FormsModule } from '@angular/forms';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatDividerModule } from '@angular/material/divider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import { MatGridListModule } from '@angular/material/grid-list';
import { HomeComponent } from './home/home.component';
import { GameComponent } from './game/game.component';
import OktaAuth from "@okta/okta-auth-js";


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    HomeComponent,
    GameComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,

    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatSidenavModule,
    MatDividerModule,
    FormsModule,
    MatToolbarModule,
    MatInputModule,
    MatCardModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatOptionModule,
    MatGridListModule,
  ],
  providers: [
    {
      provide: OktaAuth,
      useValue: new OktaAuth({
        issuer: 'https://dev-23725084.okta.com/oauth2/default',
        clientId: '0oa81mp7qllduvYHe5d7',
      })
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
