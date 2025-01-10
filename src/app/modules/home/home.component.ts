import { Component } from "@angular/core";

type App = {
  id: number;
  title: string;
  disabled: boolean;
  icon: string;
  path: string;
};

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"]
})
export class HomeComponent {
  apps: Array<App> = [];
  constructor() {
    this.apps = [
      {
        id: 1,
        title: "Tres en linea",
        disabled: false,
        icon: "gamepad",
        path: "/game/tres-en-linea"
      },
      {
        id: 2,
        title: "Smart toy",
        disabled: true,
        icon: "smart_toy",
        path: "/game/smart-toy"
      },
      {
        id: 3,
        title: "Basketball",
        disabled: true,
        icon: "sports_volleyball",
        path: "/game/basketball"
      },
      {
        id: 4,
        title: "Tetris",
        disabled: true,
        icon: "sports_cricket",
        path: "/game/tetris"
      }
    ];
  }
}
