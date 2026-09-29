# FEAT-003 - Usuarios y roles

| | |
|---|---|
| **Estado** | **Implementado y verificado** (ver sección 10) |
| **Requerimientos** | Autenticar al usuario **y autorizar por rol** el acceso a pantallas y API (amplía la autenticación, que ya existía) - gestionar las cuentas de usuario: alta, cambio de rol y deshabilitación, solo `ADMIN` (nuevo) |
| **Consume** | Supabase Auth (identidad) - tablas `user_data`, `role`, `user_role` |
| **Escrita** | 2026-09-28 |

## 1. Qué se construye

La autorización por rol de SIGBI, de punta a punta:

- **Dos roles**, uno por cada perfil de usuario del sistema: `ADMIN` (el responsable de la
  instancia) y `BIBLIOTECARIO` (quien opera catálogo, clientes y reservas).
- El **backend** decide qué puede hacer cada rol; el frontend solo lo refleja.
- Una pantalla **Usuarios**, solo para `ADMIN`, para dar de alta cuentas, cambiarles el rol
  y deshabilitarlas.
- El **arranque** crea los roles y el primer administrador, porque la API de alta ya exige
  ser administrador y no puede crear al primero.

La identidad sigue siendo de Supabase Auth: SIGBI no guarda contraseñas. Lo que es de SIGBI
es **qué rol tiene cada identidad**, y vive en `user_data` + `user_role`, enlazado por el
`sub` del token (`supabase_user_id`).

## 2. Matriz de permisos

| Recurso | `ADMIN` | `BIBLIOTECARIO` | Autenticado sin rol o deshabilitado |
|---|---|---|---|
| `/v1/categories`, `/v1/books`, `/v1/clients`, `/v1/reservations`, `/v1/agents` | Sí | Sí | **403** |
| `/v1/users`, `/v1/roles`, `/v1/admin/**` | Sí | **403** | **403** |
| `/auth/user` | Sí | Sí | Sí (devuelve `roles: []`) |
| `/login/**`, `/auth/logout` | Público | Público | Público |

Con `AUTH_ENABLED=false` todo sigue abierto (`permitAll`), como hoy: la matriz solo se aplica
con la seguridad activa.

## 3. Reglas

| # | Regla | Por qué |
|---|---|---|
| R-1 | Tener un token válido **no basta**: `/v1/**` exige `ADMIN` o `BIBLIOTECARIO` | Hoy un usuario sin fila en `user_data`, o deshabilitado, recibe cero roles pero `authenticated()` le deja pasar |
| R-2 | Los permisos se declaran **por URL en `WebSecurityConfig`**, en un solo sitio | La matriz de sección 2 se revisa leyendo un bloque, no recorriendo controladores |
| R-3 | Los roles son **fijos**: los crea el arranque y la API solo los lista | La configuración de seguridad los nombra; un rol creado por API no tendría ningún permiso |
| R-4 | Un usuario **no se borra, se deshabilita** (`enabled = false`) | Borrar la fila local deja la identidad viva en Supabase y sin rastro de quién era |
| R-5 | Debe quedar **al menos un `ADMIN` habilitado**. Ni quitarle el rol ni deshabilitar al último | Sin él nadie puede volver a gestionar cuentas |
| R-6 | Un administrador **no puede deshabilitarse ni quitarse `ADMIN` a sí mismo** | Evita el bloqueo accidental; otro administrador puede hacerlo |
| R-7 | Un usuario tiene **al menos un rol** | Sin rol la cuenta existe pero no sirve (R-1): eso es deshabilitarla |
| R-8 | El correo de la cuenta es su `username` y **es único** | Es con lo que se inicia sesión |
| R-9 | Una regla incumplida responde **400** con mensaje en español; un permiso denegado, **403**. Nunca 500 | Hoy `IllegalArgumentException` y `AccessDeniedException` caen al manejador genérico y salen como 500 |
| R-10 | Si el correo **ya tiene identidad en Supabase Auth** pero no cuenta en SIGBI, el alta **la vincula**: crea la fila en `user_data` con los roles pedidos. **No cambia su contraseña**; la del formulario se ignora | Añadida el 2026-09-28. Las cuentas creadas a mano en el panel de Supabase existen allí sin fila local: sin esto quedan sin rol y el alta responde "ya existe" |

## 4. Contrato

### 4.1 Sesión

`GET /auth/user` -> `200`
```json
{ "username": "ana@biblioteca.pe", "roles": ["BIBLIOTECARIO"] }
```
`roles` contiene solo roles de la aplicación (`ADMIN`, `BIBLIOTECARIO`), no las autoridades
técnicas del token (`authenticated`, `SCOPE_*`).

### 4.2 Usuarios (solo `ADMIN`)

| Método y ruta | Cuerpo | Respuesta |
|---|---|---|
| `GET /v1/users` | - | `200` `[{ idUser, username, enabled, roles: [{ idRole, name, description }] }]` |
| `POST /v1/admin/users` | `{ email, password, roles: ["BIBLIOTECARIO"] }` | `201` con `Location` y `{ idUser, username, linked }`, donde `linked` dice si se vinculó una identidad existente (R-10); `400` si el correo ya tiene cuenta en SIGBI, un rol no existe o falta rol |
| `PUT /v1/users/{id}` | `{ enabled, roles: [{ name }] }` | `200` con el usuario; `400` si incumple R-5, R-6 o R-7 |
| `GET /v1/roles` | - | `200` `[{ idRole, name, description }]` |

- `PUT` **solo cambia `enabled` y los roles**. El `username` y el `supabase_user_id` no se
  editan: los fija Supabase.
- Se retiran `POST /v1/users` (crearía un usuario sin identidad en Supabase),
  `DELETE /v1/users/{id}` (R-4) y `POST`/`PUT`/`DELETE /v1/roles` (R-3).
- `supabaseUserId` no viaja al frontend: no lo necesita.

### 4.3 Arranque

Un `ApplicationRunner` idempotente:

1. Garantiza que existen `ADMIN` ("Gestiona las cuentas y opera el sistema") y
   `BIBLIOTECARIO` ("Opera catálogo, clientes, reservas y asistente").
2. Si **no hay ningún `ADMIN` habilitado** y están definidas `BOOTSTRAP_ADMIN_EMAIL` y
   `BOOTSTRAP_ADMIN_PASSWORD`, crea esa cuenta en Supabase Auth y en `user_data` con rol
   `ADMIN`, por el mismo servicio que usa `POST /v1/admin/users`.
3. Si ya hay un administrador, no hace nada con esas variables. Si la creación falla, lo
   registra con `log.warn` y **el arranque continúa**.

Las dos variables son opcionales y la contraseña es un secreto: van al `.env` y a las
variables del servicio donde se despliegue, marcadas como secretas, nunca al repositorio.

## 5. Modelo

| Cambio | Motivo |
|---|---|
| `Role.idRole` y `User.idUser` pasan a `@GeneratedValue(strategy = IDENTITY)` | Es la norma de clave primaria del proyecto (`Integer id<Clase>` con `IDENTITY`). Hoy se asignan a mano (`getNextId()`, `idUser` forzado para un `data.sql` que no existe) |
| Se retiran `getNextId()` y `AdminUserRequest.idUser` | Quedan sin uso |
| Se retiran `Menu`, `IMenuRepo`, `IMenuService`, `MenuServiceImpl`, `MenuController`, `MenuDTO` y las tablas `menu`, `menu_role` | Decisión de esta spec: el menú es fijo, definido en el frontend y filtrado por rol; la base no guarda menús |
| Se retira `AuthorizeLogic` | Usa roles ajenos a SIGBI (`USER`, `DBA`) y ningún controlador lo invoca; R-2 lo sustituye |

Las cinco tablas de seguridad están **vacías**, así que se eliminan en Supabase y Hibernate
recrea `role`, `user_data` y `user_role` con identidad. Tras recrearlas **hay que volver a
activar RLS** en ellas: la API REST pública de Supabase no debe verlas.

## 6. Frontend

| Pieza | Responsabilidad |
|---|---|
| `store/session.store.ts` | Además del correo, expone `$roles` y `$esAdmin`. Con `AUTH_ENABLED=false` se comporta como `ADMIN` (el backend está abierto) |
| `guards/rol.guard.ts` | `canActivate` por rol. **Espera a que la sesión haya cargado** antes de decidir; sin permiso navega a `/403` |
| `pages/layout` | Cada destino declara qué roles lo ven; el menú y la barra inferior muestran solo los permitidos. **Usuarios** es un séptimo destino, solo `ADMIN`, fuera de la barra inferior |
| `pages/user/`, `store/user.store.ts`, `services/user.service.ts`, `forms/user.form.ts`, `model/user.ts` | Pantalla Usuarios con el patrón componente + store: ningún componente inyecta `HttpClient` |

### 6.1 Pantalla Usuarios

- **Tabla**: correo, roles (chips), estado (*Activo* / *Deshabilitado*) y acción editar.
- **Nuevo usuario** (diálogo): correo, contraseña (mínimo 6, con conmutador de visibilidad
  como en `login`) y roles como casillas; al menos una marcada.
- **Editar** (diálogo): correo solo lectura, roles y el interruptor *Activo*.
- La fila de la **propia cuenta** no permite desmarcar `ADMIN` ni desactivarse (R-6); el
  backend lo rechaza igualmente.
- Los cinco estados de toda pantalla de datos (cargando, con datos, vacío, error con
  reintento, filtrado sin resultados); textos en español; colores solo de tokens
  `--mat-sys-*` / `--sigbi-*`, ninguno literal.

## 7. Criterios de aceptación

Con `AUTH_ENABLED=true` en backend y frontend, y un `ADMIN` y un `BIBLIOTECARIO` creados.

| # | Acción | Esperado |
|---|---|---|
| 1 | Arrancar con la base de seguridad vacía y `BOOTSTRAP_ADMIN_*` definidas | Existen los dos roles y la cuenta `ADMIN`; puede iniciar sesión |
| 2 | Arrancar otra vez | No duplica roles ni cuentas |
| 3 | `ADMIN` entra | Ve los siete destinos, incluido Usuarios |
| 4 | `ADMIN` crea un `BIBLIOTECARIO` | Aparece en la tabla; puede iniciar sesión |
| 5 | `BIBLIOTECARIO` entra | Ve seis destinos; **no** ve Usuarios |
| 6 | `BIBLIOTECARIO` abre `/pages/user` a mano | Página 403, sin el menú |
| 7 | `BIBLIOTECARIO` llama a `GET /v1/users` con su token | `403` |
| 8 | `ADMIN` deshabilita al bibliotecario | La siguiente llamada del bibliotecario responde `403` sin reemitir el token |
| 9 | `ADMIN` intenta quitarse `ADMIN` o deshabilitarse | Rechazo con mensaje, sin cambios |
| 10 | Crear un usuario con un correo ya registrado | `400` con mensaje en español, no `500` |
| 11 | Token válido de una identidad sin fila en `user_data` | `403` en `/v1/**`; `/auth/user` responde con `roles: []` |
| 12 | API REST pública de Supabase con la `anon key` sobre `user_data` | Lista vacía (RLS) |
| 13 | Alta de un correo que existe en Supabase Auth pero no en SIGBI | `201` con `linked: true`; la cuenta entra con **su contraseña de siempre** y con el rol asignado |
| 14 | Repetir esa alta | `400` "Ya existe una cuenta con el correo …": ahora sí tiene cuenta en SIGBI |

## 8. Lo que esta feature no hace

- **No cambia contraseñas ni recupera cuentas.** Eso es de Supabase Auth (panel o flujo de
  recuperación); SIGBI no toca credenciales después del alta.
- **No da permisos por acción dentro de una pantalla** (por ejemplo, un bibliotecario que
  lee pero no borra). Con dos roles, el permiso es por recurso.
- **No borra identidades de Supabase.** Deshabilitar corta el acceso a SIGBI; la cuenta de
  Supabase se elimina, si hace falta, desde su panel.

## 9. Configuración que cambia con esta feature

`BOOTSTRAP_ADMIN_EMAIL` y `BOOTSTRAP_ADMIN_PASSWORD` se documentan en el `README` y en
`.env.example`, con la contraseña marcada como secreta.

## 10. Estado de la implementación

> Añadido el 2026-09-28, después de implementar. Lo de arriba es el texto original, tal
> como se escribió antes de existir el código.

**Backend**: la matriz de sección 2 en `security/WebSecurityConfig.java`, el arranque de
sección 4.3 en `security/SecurityBootstrap.java`, el 403 en JSON en
`security/RestAccessDeniedHandler.java`, el alta en `AdminUserController` +
`AdminUserServiceImpl` y la edición en `UserController` + `UserServiceImpl`. Se retiraron
`Menu` y sus piezas, `AuthorizeLogic`, `getNextId()` y `AdminUserRequest.idUser`.

**R-10**, añadida el mismo día: `SupabaseServiceImpl.findAuthUserByEmail` busca la
identidad por la API de administración de Supabase (páginas de 200, como mucho 50) y
`AdminUserServiceImpl.create()` la vincula si existe, sin llamar a `createAuthUser`; si su
`sub` ya está enlazado a una fila local, `400` "Ya existe una cuenta con el correo ...". El
servicio devuelve `AdminUserCreation(user, linked)` y `AdminUserController` responde con
`AdminUserResponse` (`{ idUser, username, linked }`). `SecurityBootstrap` usa el mismo
camino: si `BOOTSTRAP_ADMIN_EMAIL` ya tiene identidad, la vincula, no aplica
`BOOTSTRAP_ADMIN_PASSWORD` y registra `BOOTSTRAP ADMIN LINKED TO EXISTING SUPABASE
IDENTITY`.

**Frontend**: `guards/rol.guard.ts`, `store/session.store.ts` (`$roles`, `$esAdmin`,
`$estado`), los destinos filtrados de `pages/layout` y la pantalla `pages/user/` con su
diálogo, `UserStore`, `UserDialogStore`, `UserForm` y `UserService`. Por R-10,
`model/user.ts` tipa `AdminUserResponse` y el diálogo cierra el alta con "Se creó la cuenta
<correo>." o, si `linked`, "La cuenta <correo> ya existía en Supabase: se vinculó y
conserva su contraseña."; la ayuda de la contraseña dice "Al menos 6 caracteres. Si el
correo ya tiene cuenta en Supabase, se vincula y conserva su contraseña."

### Desviaciones respecto al texto de arriba

| Punto | Qué se hizo y por qué |
|---|---|
| Sección 4.3, registro del arranque | El `log.info`/`log.warn` del arranque **no incluye el correo** del administrador: la norma de registro prohíbe datos personales en el log, y el correo lo es |
| Sección 4.3, paso 2 | *(Por R-10.)* Si `BOOTSTRAP_ADMIN_EMAIL` ya tiene identidad en Supabase Auth, el arranque no la crea: la vincula con rol `ADMIN` y `BOOTSTRAP_ADMIN_PASSWORD` no se aplica; el registro lo distingue (`BOOTSTRAP ADMIN LINKED TO EXISTING SUPABASE IDENTITY`) |
| Sección 5, `role.name` | Además de la identidad, `role.name` es **único** (`unique = true`): los roles se buscan por nombre y el arranque decide por él si ya existen |
| Sección 4.2, `POST /v1/admin/users` | Responde `201` sin cuerpo *(superado por R-10: ahora devuelve `{ idUser, username, linked }`)*, y el `Location` apunta a `/v1/users/{id}`, que es donde se lee el usuario creado, no a `/v1/admin/users/{id}`, que no existe |
| Sección 6, posición de Usuarios | No es el séptimo destino al final de la lista: a petición del responsable va **antes de Asistente**, que queda siempre el último. Orden del `ADMIN`: Panel, Libros, Categorías, Clientes, Reservas, Usuarios, Asistente; el `BIBLIOTECARIO` ve el mismo sin Usuarios |
| Sección 6, pie del menú | Con `AUTH_ENABLED=false` la sesión se comporta como `ADMIN`, así que el pie muestra el perfil **"Administrador"** (antes decía "Bibliotecario" escrito a mano) y la cuenta "Sin sesión" |

### Verificación

Ejecutada el 2026-09-28 con `AUTH_ENABLED=true` en backend y frontend.

**Base de datos.** Las cinco tablas de seguridad (`user_data`, `role`, `user_role`,
`menu`, `menu_role`) estaban vacías. Se eliminaron en Supabase y Hibernate recreó `role`,
`user_data` y `user_role` con claves de identidad; `menu` y `menu_role` ya no existen. Se
volvió a activar RLS en las tres recreadas: **8 tablas, todas con RLS**.

**Arranque (criterios 1 y 2).** El primero creó `ADMIN`, `BIBLIOTECARIO` y la cuenta
administradora; un reinicio no creó nada nuevo (quedaron 2 roles, 2 usuarios y 2
asignaciones).

**API: 25 de 25 comprobaciones superadas.**

- Sin token, `401`. El administrador recibe `roles: ["ADMIN"]` en `/auth/user`, lee
  `/v1/users` y `/v1/roles` lista los dos roles. `POST /v1/roles` y `DELETE /v1/users` ya
  no existen.
- El administrador crea un `BIBLIOTECARIO`: `201` con `Location: /v1/users/2`, y esa cuenta
  inicia sesión (criterio 4). El listado no expone `supabaseUserId`.
- El bibliotecario recibe `200` en `/v1/books` y `403` "No tiene permiso para acceder a
  este recurso" en `/v1/users` y `/v1/admin/users` (criterio 7).
- Correo repetido: `400` "Ya existe una cuenta con el correo ..." (criterio 10). Rol
  inexistente: `400` "No existe el rol NOEXISTE". Usuario sin roles: `400` "El usuario
  debe tener al menos un rol" (R-7).
- El administrador que intenta quitarse `ADMIN` o deshabilitarse: `400` "No puede
  deshabilitarse ni quitarse el rol ADMIN a sí mismo" (criterio 9, R-6).
- Deshabilitar al bibliotecario hace que **su mismo token** reciba `403`; volver a
  habilitarlo devuelve el `200` (criterio 8).
- Una identidad de Supabase sin fila en `user_data`: `403` en `/v1/books` y `roles: []` en
  `/auth/user` (criterio 11).
- La API REST de Supabase con la `anon key` sobre `user_data` devuelve `[]` (criterio 12).

**Interfaz, como `BIBLIOTECARIO` (criterios 5 y 6).** Seis destinos, sin Usuarios; el pie
del menú dice "Bibliotecario". Escribir `/pages/user` en la barra de direcciones lleva a
`/403`, sin el menú.

**R-10 (criterios 13 y 14): 11 de 11 comprobaciones superadas**, el 2026-09-28 en una
instancia aparte. Motivo: las cuentas creadas a mano en el panel de Supabase son
identidades sin fila en `user_data`; tras desplegar esta feature recibirían *Sin permiso*,
y ahora el administrador lo arregla dándolas de alta en Usuarios con rol `BIBLIOTECARIO`.

- Una identidad creada directamente en Supabase inicia sesión y recibe `roles: []`.
- El administrador la da de alta con una contraseña **distinta**: `201` con `linked:
  true` (criterio 13).
- Entra con **su contraseña original**, recibe `roles: ["BIBLIOTECARIO"]` y `200` en
  `/v1/books`; la contraseña del formulario no sirve.
- Repetir el alta: `400` "Ya existe una cuenta con el correo ..." (criterio 14).
- Un correo nuevo sigue igual que antes: `201` con `linked: false`, y entra con la
  contraseña del formulario.

Las cuentas de prueba se eliminaron después.

### Lo que queda abierto

- **Criterio 3 sin verificar en la interfaz**: la vista del `ADMIN` -siete destinos y la
  pantalla Usuarios en uso- queda pendiente de la comprobación manual del responsable.
- **R-5 sin ejercitar**: con un solo administrador, quitarse `ADMIN` dispara antes R-6. Y
  con la seguridad activa no se alcanza nunca: quien edita es un `ADMIN` habilitado, así
  que el último que queda es siempre él mismo y R-6 va primero. La regla está en
  `UserServiceImpl.update()` y solo actúa con `AUTH_ENABLED=false`, donde no hay usuario
  actual; ahí queda por probar.
- ~~La página `/403` es un resto sin diseñar~~ **Resuelto el 2026-09-28**: `not-403` y
  `not-404` comparten `shared/components/error-page`. La 403 ofrece
  *Volver al panel* solo si la cuenta tiene rol, *Cerrar sesión* y la cuenta con la que se
  entró. Verificado en el navegador como `BIBLIOTECARIO` abriendo `/pages/user`; el caso de
  cuenta sin rol no se ha visto en pantalla.
- ~~Usuarios no tiene entrada por debajo de 1024 px~~ **Resuelto el 2026-09-28**: el menú
  del avatar de la cabecera (`page-header`), que solo existe en ese ancho, ofrece
  "Usuarios" a las cuentas `ADMIN`. Pendiente de ver en pantalla con
  una cuenta de administrador.
- **R-10 verificada por API, no en la interfaz**: el snackbar de vinculación y la nueva
  ayuda de la contraseña quedan por ver en pantalla, con la misma
  comprobación pendiente del criterio 3.
