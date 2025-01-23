export interface AuthState {
  user: null; // Usuario autenticado
  isAuthenticated: boolean; // Si está autenticado
  loading: boolean; // Indicador de carga
  error: string | null; // Errores
}

export const initialState: AuthState = {
  user: null, // Usuario autenticado
  isAuthenticated: false, // Si está autenticado
  loading: false, // Indicador de carga
  error: null // Errores
};
