import { CustomType } from '../auth.types'
import { AuthActions } from './auth.actions'
import { createFeature, createReducer, on } from '@ngrx/store'

export interface State {
  lists: CustomType
}

export const initialState: State = {
  lists: {
    newType: [],
  },
}

export const AuthFeature = createFeature({
  name: 'auth',
  reducer: createReducer(
    initialState,
    on(AuthActions.doLogin, (state, action) => ({
      ...state,
      lists: { newType: [] },
    }))
  ),
})
