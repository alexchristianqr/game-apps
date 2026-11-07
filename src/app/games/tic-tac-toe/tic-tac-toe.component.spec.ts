import { provideRouter } from "@angular/router";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AudioService } from "../../core/services/audio/audio.service";
import { CelebrationService } from "../../core/services/celebration/celebration.service";
import { TicTacToeComponent } from "./tic-tac-toe.component";

describe("TicTacToeComponent", () => {
  let component: TicTacToeComponent;
  let fixture: ComponentFixture<TicTacToeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicTacToeComponent],
      providers: [
        provideRouter([]),
        { provide: AudioService, useValue: { playLoop: () => undefined, playEffect: () => undefined, stopLoop: () => undefined, stopAll: () => undefined } },
        { provide: CelebrationService, useValue: { celebrate: () => Promise.resolve() } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TicTacToeComponent);
    component = fixture.componentInstance;
    component.computerFirst = false;
    fixture.detectChanges();
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

  it("labels cells accessibly", () => {
    expect(component.cellLabel(0)).toBe("Casilla 1, vacía");
  });
});
