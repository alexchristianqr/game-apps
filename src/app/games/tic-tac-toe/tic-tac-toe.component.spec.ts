import { provideRouter } from "@angular/router";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { TicTacToeComponent } from "./tic-tac-toe.component";

describe("TicTacToeComponent", () => {
  let component: TicTacToeComponent;
  let fixture: ComponentFixture<TicTacToeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicTacToeComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(TicTacToeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
