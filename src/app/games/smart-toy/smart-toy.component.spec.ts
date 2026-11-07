import { provideRouter } from "@angular/router";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AudioService } from "../../core/services/audio/audio.service";
import { CelebrationService } from "../../core/services/celebration/celebration.service";
import { installMemoryStorage } from "../../core/services/preferences/memory-storage.testing";
import { SfxService } from "../../core/services/sfx/sfx.service";
import { SmartToyComponent } from "./smart-toy.component";
import { SEED_TREE } from "./smart-toy.logic";

describe("SmartToyComponent", () => {
  let component: SmartToyComponent;
  let fixture: ComponentFixture<SmartToyComponent>;
  const stopAll = vi.fn();

  async function setup(): Promise<void> {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [SmartToyComponent],
      providers: [
        provideRouter([]),
        { provide: AudioService, useValue: { stopAll } },
        { provide: SfxService, useValue: { place: () => undefined, win: () => undefined, lose: () => undefined, muted: false } },
        { provide: CelebrationService, useValue: { celebrate: () => Promise.resolve() } }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(SmartToyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    installMemoryStorage();
    await setup();
  });

  it("starts idle and asks the first question after «¡Listo!»", () => {
    expect(component.phase()).toBe("idle");
    component.start();
    expect(component.phase()).toBe("asking");
    expect(component.speech()).toBe("¿Vive en el agua?");
  });

  it("wins when the player confirms the guess", () => {
    component.start();
    component.answer("yes");
    component.answer("yes");
    expect(component.guessed()).toBe("Rana");
    component.answer("yes");
    expect(component.phase()).toBe("won");
    expect(component.score().robot).toBe(1);
  });

  it("learns a new animal, persists it and asks the new question next game", async () => {
    component.start();
    component.answer("yes");
    component.answer("yes");
    component.answer("no");
    expect(component.phase()).toBe("teach");

    component.animalInput = "Sapo";
    component.questionInput = "tiene verrugas";
    component.learn();
    expect(component.phase()).toBe("learned");
    expect(component.animals()).toBe(9);

    await setup(); // recarga: el árbol viene de localStorage
    expect(component.animals()).toBe(9);
    component.start();
    component.answer("yes");
    component.answer("yes");
    expect(component.speech()).toBe("¿Tiene verrugas?");
  });

  it("refuses an empty or already known animal", () => {
    component.start();
    component.answer("yes");
    component.answer("yes");
    component.answer("no");
    component.animalInput = "rana";
    component.questionInput = "";
    component.learn();
    expect(component.phase()).toBe("teach");
    expect(component.animalError()).toMatch(/ya lo conozco/);
    expect(component.questionError()).toBeTruthy();
  });

  it("answers with S / N keys but not while typing", () => {
    component.start();
    component.onDocumentKey(new KeyboardEvent("keydown", { key: "s" }));
    expect(component.path()).toEqual(["yes"]);
    const input = document.createElement("input");
    const event = new KeyboardEvent("keydown", { key: "n" });
    Object.defineProperty(event, "target", { value: input });
    component.onDocumentKey(event);
    expect(component.path()).toEqual(["yes"]);
  });

  it("forgets everything after a double confirmation", () => {
    component.start();
    component.answer("yes");
    component.answer("yes");
    component.answer("no");
    component.animalInput = "Sapo";
    component.questionInput = "¿Tiene verrugas?";
    component.learn();
    component.forget();
    expect(component.animals()).toBe(9);
    component.forget();
    expect(component.tree()).toEqual(SEED_TREE);
    expect(component.score()).toEqual({ robot: 0, player: 0 });
  });

  it("silences audio on destroy", () => {
    fixture.destroy();
    expect(stopAll).toHaveBeenCalled();
  });
});
