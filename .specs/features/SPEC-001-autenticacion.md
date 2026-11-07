# SPEC-001 — Autenticación

| Campo           | Valor                                                                          |
| --------------- | ------------------------------------------------------------------------------ |
| **Estado**      | implementada                                                                   |
| **Componentes** | `LoginComponent`, `RegisterComponent`, `ForgotComponent`, `authGuard`          |
| **Servicio**    | `AuthService` (`src/app/auth/auth.service.ts`)                                 |
| **Estado**      | NgRx feature `auth` (`isLoggedIn`)                                             |
| **Rutas**       | `/login`, `/register`, `/forgot` (públicas); `/home` y `/games/*` (protegidas) |
| **Depende de**  | —                                                                              |

## Propósito

Que solo una persona con cuenta juegue, y que pueda crearla, entrar y recuperar el acceso sin salir de la aplicación.

## Requisitos funcionales

- **RF-01** — La ruta raíz y cualquier ruta desconocida llevan a `/login`.
- **RF-02** — Login con correo y contraseña. Ambos son obligatorios y el correo debe tener formato válido; mientras el formulario sea inválido no se envía.
- **RF-03** — Registro con nombre, correo y contraseña de al menos 6 caracteres; los tres son obligatorios.
- **RF-04** — Tras un login o registro correcto se guarda el perfil (`uid`, `email`, `displayName`, `photoURL`, `emailVerified`) en `users/{uid}` de Firestore con `merge` y se navega a `/home`.
- **RF-05** — Recuperación de contraseña: se pide el correo y se envía el enlace de Firebase, que devuelve a `#/login`. El resultado se informa con un aviso de 3 s («Enlace enviado con éxito…» o «El
  enlace no se ha enviado»).
- **RF-06** — Cerrar sesión cierra la sesión de Firebase, borra `users` de `localStorage` y navega a `/login`.
- **RF-07** — `/home` y `/games/*` exigen sesión: sin ella se redirige a `/login`. El guard espera la primera emisión de Firebase, así que una sesión persistida no se pierde al recargar.
- **RF-08** — Mientras se procesa un envío, el botón se bloquea (`loading`); si falla, el formulario vuelve a poder usarse.
- **RF-09** — El estado «hay sesión» está disponible como señal (`isAuthenticated`) y en NgRx (`isLoggedIn`), ambos derivados de la misma suscripción a Firebase.

## Reglas de contenido

Los textos están en español. Las contraseñas nunca se guardan fuera de Firebase.

## Comportamiento visual

Tarjeta de Angular Material centrada con campos de formulario; enlaces cruzados entre las tres pantallas («Olvidé mi contraseña», «Regístrate», «Iniciar sesión»). La contraseña del login se puede
mostrar u ocultar.

## Criterios de aceptación

- **CA-01** — Dado que no hay sesión, cuando abro `/home`, entonces termino en `/login`.
- **CA-02** — Dado que tengo sesión, cuando recargo `/home`, entonces sigo en `/home`.
- **CA-03** — Dado el registro, cuando dejo la contraseña con 5 caracteres, entonces no se envía.
- **CA-04** — Dado que pulso «Salir», cuando termina, entonces estoy en `/login` y `/home` vuelve a redirigirme.
- **CA-05** — Dado un correo registrado, cuando uso «Olvidé mi contraseña», entonces veo el aviso de éxito.

## Fuera de alcance

- Verificación obligatoria del correo.
- Roles o permisos distintos entre usuarios.
- Ocultar `/login` a quien ya tiene sesión.

## Deuda conocida

- Un login fallido no muestra mensaje: solo reactiva el formulario.
- El formulario de login trae credenciales de invitado como valor inicial (cuenta de demostración). Si se decide que la demo deja de ser pública, se vacían.
- `googleAuth()` existe en el servicio pero ninguna pantalla lo ofrece.
- `sendVerificationMail()` navega a una ruta inexistente.
- `authLogin()` informa los errores con `window.alert`.
