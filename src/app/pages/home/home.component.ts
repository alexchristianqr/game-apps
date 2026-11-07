import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { GAMES } from "../../games/games.registry";

@Component({
  selector: "app-home",
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"]
})
export class HomeComponent {
  public readonly games = GAMES;
}
