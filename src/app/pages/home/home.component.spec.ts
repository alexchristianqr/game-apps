import { provideRouter } from "@angular/router";
import { TestBed } from "@angular/core/testing";
import { GAMES } from "../../games/games.registry";
import { HomeComponent } from "./home.component";

describe("HomeComponent", () => {
  it("renders one card per game and links only the enabled ones", async () => {
    await TestBed.configureTestingModule({ imports: [HomeComponent], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll("#catalogo ~ ul > li").length).toBe(GAMES.length);
    const links = Array.from(el.querySelectorAll<HTMLAnchorElement>("ul a")).map((a) => a.getAttribute("href"));
    expect(links).toEqual(["/games/tic-tac-toe", "/games/smart-toy", "/games/tetris", "/games/bomberman"]);
    expect(el.querySelectorAll("[aria-disabled='true']").length).toBe(GAMES.filter((g) => !g.enabled).length);
  });
});
