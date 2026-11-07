import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { AudioService } from "../../core/services/audio/audio.service";
import { CelebrationService } from "../../core/services/celebration/celebration.service";
import { installMemoryStorage } from "../../core/services/preferences/memory-storage.testing";
import { SfxService } from "../../core/services/sfx/sfx.service";
import { BombermanComponent } from "./bomberman.component";
import type { BombermanState } from "./bomberman.engine";

interface Internals {
  current: BombermanState;
  update(dt: number): void;
  onOver(state: BombermanState): void;
}

/** jsdom no tiene WebGL: el renderer falla y el componente lo avisa, pero la lógica del juego sigue siendo comprobable. */
describe("BombermanComponent", () => {
  let fixture: ComponentFixture<BombermanComponent>;
  let component: BombermanComponent;
  const audio = { playLoop: vi.fn(), playEffect: vi.fn(), stopLoop: vi.fn(), stopAll: vi.fn() };
  const sfx = { place: vi.fn(), explosion: vi.fn(), powerUp: vi.fn(), drop: vi.fn(), levelUp: vi.fn(), win: vi.fn(), lose: vi.fn(), muted: false, volume: 50 };

  const key = (k: string, type = "keydown"): KeyboardEvent => new KeyboardEvent(type, { key: k, cancelable: true });
  const internals = (): Internals => component as unknown as Internals;

  beforeEach(async () => {
    installMemoryStorage();
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn(() => 7)
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    Object.values(audio).forEach((f) => f.mockClear());
    Object.values(sfx).forEach((f) => typeof f === "function" && f.mockClear());

    await TestBed.configureTestingModule({
      imports: [BombermanComponent],
      providers: [
        provideRouter([]),
        { provide: AudioService, useValue: audio },
        { provide: SfxService, useValue: sfx },
        { provide: CelebrationService, useValue: { celebrate: () => Promise.resolve(), burst: () => Promise.resolve() } }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(BombermanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => vi.unstubAllGlobals());

  it("warns instead of showing an empty canvas when WebGL is missing", () => {
    expect(component.webglFailed()).toBe(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector("[role=alert]")?.textContent).toContain("WebGL");
  });

  it("starts a game with music and a fresh scoreboard", () => {
    component.startGame();
    expect(component.phase()).toBe("playing");
    expect(audio.playLoop).toHaveBeenCalled();
    expect(component.lives()).toBe(3);
    expect(component.level()).toBe(1);
    expect(component.enemies()).toBeGreaterThan(0);
  });

  it("moves with the keyboard and stops on release", () => {
    component.startGame();
    const x0 = internals().current.player.x;
    component.onKeyDown(key("ArrowRight"));
    internals().update(200);
    expect(internals().current.player.x).toBeGreaterThan(x0);
    component.onKeyUp(key("ArrowRight", "keyup"));
    const x1 = internals().current.player.x;
    internals().update(200);
    expect(internals().current.player.x).toBe(x1);
  });

  it("drops a bomb with Space and ignores the key outside a game", () => {
    component.onKeyDown(key(" "));
    expect(sfx.place).not.toHaveBeenCalled();
    component.startGame();
    const event = key(" ");
    component.onKeyDown(event);
    expect(sfx.place).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
    expect(internals().current.bombs).toHaveLength(1);
  });

  it("pauses with P, freezes the game and resumes", () => {
    component.startGame();
    component.onKeyDown(key("p"));
    expect(component.phase()).toBe("paused");
    expect(audio.stopLoop).toHaveBeenCalled();
    const left = internals().current.timeLeft;
    internals().update(500);
    expect(internals().current.timeLeft).toBe(left);
    component.onKeyDown(key("Escape"));
    expect(component.phase()).toBe("playing");
  });

  it("pauses by itself when the tab loses focus", () => {
    component.startGame();
    vi.spyOn(document, "hasFocus").mockReturnValue(false);
    component.onHidden();
    expect(component.phase()).toBe("paused");
  });

  it("ending the game returns to the start screen and silences everything", () => {
    component.startGame();
    component.endGame();
    expect(component.phase()).toBe("idle");
    expect(audio.stopAll).toHaveBeenCalled();
  });

  it("saves a new record when the game ends", () => {
    component.startGame();
    internals().onOver({ ...internals().current, score: 1234 });
    expect(component.phase()).toBe("over");
    expect(component.newRecord()).toBe(true);
    expect(component.best()).toBe(1234);
    expect(sfx.lose).toHaveBeenCalled();
  });

  it("does not flag a record when the score is lower", () => {
    component.startGame();
    internals().onOver({ ...internals().current, score: 1234 });
    component.startGame();
    internals().onOver({ ...internals().current, score: 10 });
    expect(component.newRecord()).toBe(false);
    expect(component.best()).toBe(1234);
  });

  it("clears the level, then moves on to the next one on request", () => {
    component.startGame();
    const s = internals().current;
    // Salida a un paso y sin enemigos: al primer cuadro se completa el nivel
    internals().current = { ...s, enemies: [], exit: { x: 1, y: 1 } };
    internals().update(16);
    expect(component.phase()).toBe("levelClear");
    expect(sfx.win).toHaveBeenCalled();
    component.continueToNextLevel();
    expect(component.phase()).toBe("playing");
    expect(component.level()).toBe(2);
  });

  it("releases audio and the loop when destroyed", () => {
    fixture.destroy();
    expect(audio.stopAll).toHaveBeenCalled();
  });
});
