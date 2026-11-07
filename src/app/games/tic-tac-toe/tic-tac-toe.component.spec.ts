import { provideRouter } from "@angular/router";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AudioService } from "../../core/services/audio/audio.service";
import { CelebrationService } from "../../core/services/celebration/celebration.service";
import { installMemoryStorage } from "../../core/services/preferences/memory-storage.testing";
import { SfxService } from "../../core/services/sfx/sfx.service";
import { TicTacToeComponent } from "./tic-tac-toe.component";

describe("TicTacToeComponent", () => {
  let component: TicTacToeComponent;
  let fixture: ComponentFixture<TicTacToeComponent>;

  async function setup(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [TicTacToeComponent],
      providers: [
        provideRouter([]),
        { provide: AudioService, useValue: { playLoop: () => undefined, playEffect: () => undefined, stopLoop: () => undefined, stopAll: () => undefined } },
        { provide: SfxService, useValue: { place: () => undefined, muted: false, volume: 50 } },
        { provide: CelebrationService, useValue: { celebrate: () => Promise.resolve() } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TicTacToeComponent);
    component = fixture.componentInstance;
    component.computerFirst = false;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    installMemoryStorage();
    await setup();
  });

  it("should create with an empty, disabled board", () => {
    const cells = fixture.nativeElement.querySelectorAll("[aria-label^='Casilla']") as NodeListOf<HTMLButtonElement>;
    expect(cells.length).toBe(9);
    expect(cells[0].disabled).toBe(true);
  });

  it("ignores moves before the game starts", () => {
    component.makeHumanMove(0);
    expect(component.board()[0]).toBe(0);
  });

  it("places X and does not overwrite an occupied cell", () => {
    component.startGame();
    component.makeHumanMove(4);
    expect(component.board()[4]).toBe("X");
    component.makeHumanMove(4);
    expect(component.board()[4]).toBe("X");
  });

  it("lets the robot start when configured", () => {
    component.computerFirst = true;
    component.startGame();
    expect(component.board().filter((c) => c === "O").length).toBe(1);
  });

  it("labels cells accessibly and follows the piece theme", () => {
    expect(component.cellLabel(0)).toBe("Casilla 1, vacía");
    component.setTheme("animals");
    component.startGame();
    component.makeHumanMove(0);
    expect(component.cellLabel(0)).toBe("Casilla 1, gato");
  });

  it("in two-player mode alternates X and O without the robot", () => {
    component.setMode("duo");
    component.startGame();
    component.makeHumanMove(0);
    component.makeHumanMove(1);
    expect(component.board().slice(0, 2)).toEqual(["X", "O"]);
    expect(component.robotTurn()).toBe(false);
  });

  it("records a win in the scoreboard and persists it", () => {
    component.setMode("duo");
    component.startGame();
    // X: 0,1,2 — O: 3,4
    [0, 3, 1, 4, 2].forEach((i) => component.makeHumanMove(i));
    expect(component.outcome()).toBe("X");
    expect(component.winLine()).toEqual([0, 1, 2]);
    expect(component.score()).toMatchObject({ wins: 1, losses: 0 });
    expect(JSON.parse(localStorage.getItem("game-apps:ttt-score-duo") ?? "{}")).toMatchObject({ wins: 1 });
  });

  it("plays a cell with a numpad key (7 = top-left) and ignores keys while typing", () => {
    component.setMode("duo");
    component.startGame();
    component.onDocumentKey(new KeyboardEvent("keydown", { key: "7" }));
    expect(component.board()[0]).toBe("X");
    const input = document.createElement("input");
    const event = new KeyboardEvent("keydown", { key: "9" });
    Object.defineProperty(event, "target", { value: input });
    component.onDocumentKey(event);
    expect(component.board()[2]).toBe(2);
  });

  it("clears the scoreboard only after confirmation", () => {
    component.setMode("duo");
    component.startGame();
    [0, 3, 1, 4, 2].forEach((i) => component.makeHumanMove(i));
    component.resetScore();
    expect(component.score().wins).toBe(1);
    component.resetScore();
    expect(component.score().wins).toBe(0);
  });
});
