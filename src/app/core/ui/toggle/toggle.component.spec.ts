import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { ToggleComponent } from "./toggle.component";

@Component({ imports: [FormsModule, ToggleComponent], template: `<app-toggle [(ngModel)]="on">Sonido</app-toggle>` })
class HostComponent {
  on = false;
}

describe("ToggleComponent", () => {
  it("syncs with ngModel in both directions", async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const input: HTMLInputElement = fixture.nativeElement.querySelector("input[role='switch']");
    expect(input.checked).toBe(false);

    input.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.on).toBe(true);

    fixture.componentInstance.on = false;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.checked).toBe(false);
  });
});
