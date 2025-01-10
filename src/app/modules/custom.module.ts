import { NgModule } from "@angular/core";
import { HomeModule } from "./home/home.module";
import { GameModule } from "./game/game.module";
import { AuthModule } from "./auth/auth.module";
// import { TetrisComponent } from "./game/tetris/tetris.component";
// import { TresEnLineaComponent } from "./game/tres-en-linea/tres-en-linea.component";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDividerModule } from "@angular/material/divider";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatGridListModule } from "@angular/material/grid-list";
import { MatIconModule } from "@angular/material/icon";
import { MatOptionModule } from "@angular/material/core";
import { MatSelectModule } from "@angular/material/select";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatSliderModule } from "@angular/material/slider";
import { NgForOf, NgIf } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";

@NgModule({
  exports: [HomeModule, GameModule, AuthModule],
  imports: [
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatGridListModule,
    MatIconModule,
    MatOptionModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSliderModule,
    NgForOf,
    NgIf,
    ReactiveFormsModule,
    RouterLink
  ]
  // declarations: [TetrisComponent, TresEnLineaComponent]
})
export class CustomModule {}
