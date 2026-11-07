import { Injectable, inject } from "@angular/core";
import { Actions } from "@ngrx/effects";
import { Store } from "@ngrx/store";

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private store$ = inject(Store);
}
