import { createActionGroup, emptyProps, props } from '@ngrx/store'

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    // 'Ack Employee': props<{ employee: string }>(),
    'Do Login': emptyProps(),
    // 'Load Employees Success': props<{ employees: EmployeeLists }>(),
    // 'Load Employees Failure': props<{ error: unknown }>()
  },
})
