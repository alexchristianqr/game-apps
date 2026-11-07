import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { AudioService } from "../../core/services/audio/audio.service";
import { CelebrationService } from "../../core/services/celebration/celebration.service";
import { installMemoryStorage } from "../../core/services/preferences/memory-storage.testing";
import { SfxService } from "../../core/services/sfx/sfx.service";
import { TetrisComponent } from "./tetris.component";

describe("TetrisComponent", () => {
  let fixture: ComponentFixture<TetrisComponent>;
  let component: TetrisComponent;
  const audio = { playLoop: vi.fn(), playEffect: vi.fn(), stopLoop: vi.fn(), stopAll: vi.fn() };
  const noop = (): void => undefined;
  const sfx = { move: noop, rotate: noop, hold: noop, drop: noop, place: noop, clear: noop, levelUp: noop, lose: noop, muted: false, volume: 50 };
  let cancel: ReturnType<typeof vi.fn>;

  const key = (k: string, target?: EventTarget): KeyboardEvent => {
    const event = new KeyboardEvent("keydown", { key: k, cancelable: true });
    if (target) Object.defineProperty(event, "target", { value: target });
    return event;
  };

  beforeEach(async () => {
    installMemoryStorage();
    cancel = vi.fn();
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn(() => 7)
    );
    vi.stubGlobal("cancelAnimationFrame", cancel);
    Object.values(audio).forEach((f) => f.mockClear());

    await TestBed.configureTestingModule({
      imports: [TetrisComponent],
      providers: [
        provideRouter([]),
        { provide: AudioService, useValue: audio },
        { provide: SfxService, useValue: sfx },
        { provide: CelebrationService, useValue: { celebrate: () => Promise.resolve(), burst: () => Promise.resolve() } }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(TetrisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("shows the start screen and an empty 10×20 board", () => {
    expect(component.phase()).toBe("idle");
    expect(fixture.nativeElement.textContent).toContain("¡Jugar!");
    expect(component.cells()).toHaveLength(200);
  });

  it("starts a game with music and a piece on the board", () => {
    component.startGame();
    expect(component.phase()).toBe("playing");
    expect(audio.playLoop).toHaveBeenCalled();
    expect(component.cells().some((c) => c.id && !c.ghost)).toBe(true);
  });

  it("moves, rotates and hard drops with the keyboard", () => {
    component.startGame();
    const x0 = component.state()!.active.x;
    component.onKeyDown(key("ArrowLeft"));
    component.onKeyUp(new KeyboardEvent("keyup", { key: "ArrowLeft" }));
    expect(component.state()!.active.x).toBe(x0 - 1);

    const rot0 = component.state()!.active.rot;
    component.onKeyDown(key("x"));
    // La pieza O no cambia visualmente pero sí su rotación
    expect(component.state()!.active.rot).toBe((rot0 + 1) % 4);

    const before = component.state()!.board;
    component.onKeyDown(key(" "));
    expect(component.state()!.board).not.toBe(before);
    expect(component.state()!.score).toBeGreaterThan(0);
  });

  it("only intercepts game keys while playing and ignores typing", () => {
    const idle = key(" ");
    component.onKeyDown(idle);
    expect(idle.defaultPrevented).toBe(false);

    component.startGame();
    const input = document.createElement("input");
    const typing = key(" ", input);
    component.onKeyDown(typing);
    expect(typing.defaultPrevented).toBe(false);
    const game = key(" ");
    component.onKeyDown(game);
    expect(game.defaultPrevented).toBe(true);
  });

  it("pauses and resumes with P, stopping the music while paused", () => {
    component.startGame();
    component.onKeyDown(key("p"));
    expect(component.phase()).toBe("paused");
    expect(audio.stopLoop).toHaveBeenCalled();
    const x = component.state()!.active.x;
    component.onKeyDown(key("ArrowRight"));
    expect(component.state()!.active.x).toBe(x);
    component.onKeyDown(key("p"));
    expect(component.phase()).toBe("playing");
  });

  it("holds a piece with C", () => {
    component.startGame();
    const id = component.state()!.active.id;
    component.onKeyDown(key("c"));
    expect(component.holdId()).toBe(id);
    expect(component.canHold()).toBe(false);
  });

  it("stores a new record when the game ends", () => {
    component.startGame();
    // Se llena la partida cayendo piezas hasta perder
    for (let i = 0; i < 60 && component.phase() === "playing"; i++) component.act({ type: "hardDrop" });
    expect(component.phase()).toBe("over");
    expect(component.best()).toBeGreaterThan(0);
    expect(JSON.parse(localStorage.getItem("game-apps:tetris-best") ?? "0")).toBe(component.best());
    expect(component.newRecord()).toBe(true);
  });

  it("releases the animation frame and all sound on destroy", () => {
    component.startGame();
    fixture.destroy();
    expect(cancel).toHaveBeenCalledWith(7);
    expect(audio.stopAll).toHaveBeenCalled();
  });
});
