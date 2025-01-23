import { Component, OnInit } from "@angular/core";
import { Store } from "@ngrx/store";

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
export class HomeComponent implements OnInit {
  apps: Array<App> = [];
  constructor(private store: Store) {
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
        disabled: false,
        icon: "sports_cricket",
        path: "/game/tetris"
      }
    ];
  }

  ngOnInit(): void {
    console.log("[HomeComponent.ngOnInit]");
  }
}
