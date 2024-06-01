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
        title: "Tic tac toe",
        disabled: false,
        icon: "gamepad",
        path: "/game"
      },
      {
        id: 2,
        title: "Smart toy",
        disabled: true,
        icon: "smart_toy",
        path: "/game"
      },
      {
        id: 3,
        title: "Basketball",
        disabled: true,
        icon: "sports_volleyball",
        path: "/game"
      },
      {
        id: 4,
        title: "Tetris",
        disabled: true,
        icon: "sports_cricket",
        path: "/game"
      }
    ];
  }
}
