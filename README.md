# SIGBI - Sistema de Gestión Bibliotecaria Inteligente

Aplicación Full Stack para la gestión de libros, clientes, categorías y reservas de una
biblioteca, con capacidades de IA (agente conversacional sobre catálogo y reservas).

Trabajo final del curso **Java AI Full Stack - MitoCode**.

| Capa | Tecnología |
|------|------------|
| Backend | Spring Boot 4.1.0 - Java 25 - Maven |
| Frontend | Angular 22 - Angular Material 22 - Signals |
| Base de datos | PostgreSQL 15+ (local o Supabase) |
| IA | Spring AI 2.0 - cualquier servicio compatible con la API de OpenAI (OpenAI, Gemini…) |
| Autenticación | Supabase Auth (JWT, OAuth2 Resource Server) - *opcional* |

---

## Estructura del repositorio

```
sigbi/
+-- backend/          API REST Spring Boot
+-- frontend/         SPA Angular
```

---

## Configuración para la evaluación

El fichero **`backend/.env`** con la configuración del entorno de evaluación -base de datos
en Supabase, autenticación y asistente de IA- **no está en el repositorio**: contiene
credenciales y se envía a **cursos@mitocodenetwork.com**, junto con el enlace del
repositorio, en el correo de entrega del trabajo final. Basta con copiarlo
en la carpeta `backend/` y seguir los pasos de las secciones 2 y 3. Con él, la base ya
tiene las tablas, los datos de ejemplo y la cuenta de acceso que se indica en ese correo.

Para montar un entorno propio, `backend/.env.example` es la plantilla con todas las
variables (sección 2).

---

## Requisitos previos

- **JDK 25** (`java -version`)
- **Node.js** 22.22+, 24.15+ o 26+ (lo exige Angular 22) y npm
- Solo para un entorno propio: **PostgreSQL 15+** en local o un proyecto en
  [Supabase](https://supabase.com), y la clave de un servicio de IA compatible con la API de
  OpenAI (para el asistente). Con el `.env` de la evaluación no hace falta nada de esto.

---

## 1. Base de datos

**Con el `.env` de la evaluación no hay que hacer nada:** la base ya tiene las tablas y los
datos. Esta sección es solo para montar un entorno propio.

El esquema **lo genera Hibernate automáticamente** al arrancar el backend, a partir de las
entidades JPA (`spring.jpa.hibernate.ddl-auto: update`). No hay scripts SQL ni migraciones
que ejecutar a mano.

- **PostgreSQL local:** solo hay que crear la base vacía, ejecutando en `psql` o pgAdmin
  `CREATE DATABASE sigbi;`.
- **Supabase:** la base (`postgres`) ya existe. Usa la cadena del **Session pooler**
  (puerto 5432) de *Project Settings → Database*. Tras el primer arranque, activa RLS en las
  tablas de `public` para que la API REST pública de Supabase no las exponga; el backend
  entra como propietario de las tablas y no se ve afectado.

No hace falta ninguna extensión: la memoria del asistente vive en el proceso, no en la base.

---

## 2. Backend

### Variables de entorno

| Variable | Obligatoria | Por defecto | Descripción |
|----------|-------------|-------------|-------------|
| `DB_URL` | Sí | - | `jdbc:postgresql://localhost:5432/sigbi` |
| `DB_USERNAME` | Sí | - | Usuario de PostgreSQL |
| `DB_PASSWORD` | Sí | - | Contraseña de PostgreSQL |
| `DB_POOL_SIZE` | No | `5` | Conexiones por instancia. El Session Pooler de Supabase admite 15 en total: con 5 caben dos instancias a la vez (un despliegue que solapa) y quedan libres para `psql` |
| `SERVER_PORT` | No | `8080` | Es el puerto que espera el frontend. En la nube la plataforma suele inyectar `PORT`, que tiene prioridad |
| `FRONT_URL` | Sí | - | `http://localhost:4200` (origen permitido por CORS) |
| `OPENAI_API_KEY` | Solo IA | - | Clave del servicio de IA (OpenAI u otro compatible con su API) |
| `OPENAI_BASE_URL` | No | `https://api.openai.com/v1` | URL del servicio de IA, con `/v1`. Por ejemplo `https://generativelanguage.googleapis.com/v1beta/openai` (Gemini, con nivel gratuito) |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | Modelo de chat. Tiene que admitir llamadas a herramientas |
| `SUPABASE_ISSUER_URI` | Sí | - | `https://<proyecto>.supabase.co/auth/v1`. Sin valor el arranque falla aunque `AUTH_ENABLED=false`; en ese caso vale cualquier URL |
| `SUPABASE_URL` | Sí | - | `https://<proyecto>.supabase.co`. Obligatoria para arrancar, como la anterior |
| `SUPABASE_ANON_KEY` | Sí | - | Clave pública del proyecto. Obligatoria para arrancar |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí | - | Clave de servicio (**nunca** al repo). La usan el alta de usuarios y el arranque |
| `AUTH_ENABLED` | No | `true` | `false` abre `/v1/**` sin token para desarrollo; tiene que coincidir con `AUTH_ENABLED` del frontend; con `true` los roles de FEAT-003 se aplican |
| `AUTH_MODE` | No | `bearer` | `bearer` o `cookie`. Debe coincidir con `AUTH_MODE` del frontend |
| `AUTH_COOKIE_SECURE` | No | `false` | `true` en producción (HTTPS) |
| `AUTH_COOKIE_SAME_SITE` | No | `Lax` | `None` si el frontend vive en otro dominio |
| `BOOTSTRAP_ADMIN_EMAIL` | No | - | Correo del primer `ADMIN`. Solo se usa si no hay ningún `ADMIN` habilitado |
| `BOOTSTRAP_ADMIN_PASSWORD` | No | - | Contraseña de ese primer `ADMIN`, mínimo 6 caracteres (**nunca** al repo) |

Se definen en **`backend/.env`**, que el backend lee solo al arrancar desde la carpeta
`backend/`. Para un entorno propio, parte de la plantilla y rellena los valores:

```bash
cd backend
cp .env.example .env
```

El `.env` está en `.gitignore`: nunca se sube al repositorio. Una variable de entorno del
sistema o del IDE con el mismo nombre tiene prioridad sobre el fichero.

### Compilar y ejecutar

```bash
cd backend
./mvnw -DskipTests compile     # compilar
./mvnw spring-boot:run         # ejecutar (en Windows: mvnw.cmd)
```

La API queda en `http://localhost:8080`. Todos los endpoints cuelgan de `/v1/...`.

---

## 3. Frontend

```bash
cd frontend
npm install
npm start
```

Disponible en `http://localhost:4200`.

La URL del backend y la autenticación se configuran en
`frontend/src/environments/environment.development.ts` (y en `environment.ts` para el build
de producción). Con el `.env` de la evaluación no hay que cambiar nada:

```ts
export const environment = {
    HOST: 'http://localhost:8080',
    RETRY: 2,
    AUTH_MODE: 'bearer' as AuthMode,  // debe coincidir con app.auth.mode del backend
    AUTH_ENABLED: true                // debe coincidir con AUTH_ENABLED del backend
};
```

> Si `AUTH_MODE` del frontend y `app.auth.mode` del backend no coinciden, **todas las
> peticiones responden 401**. Lo mismo con `AUTH_ENABLED`: con `true` la aplicación pide
> acceso y aplica los roles; con `false` entra directo al panel. Si arrancas el backend con
> `AUTH_ENABLED=false`, pon también `false` aquí.

Con `AUTH_ENABLED=true` hay que iniciar sesión. En un entorno propio, el primer acceso es con
la cuenta que crea el arranque a partir de `BOOTSTRAP_ADMIN_EMAIL` y
`BOOTSTRAP_ADMIN_PASSWORD`; el resto de cuentas se dan de alta desde la pantalla *Usuarios*.
Para probar sin cuentas, pon `AUTH_ENABLED=false` en el `.env` **y** en
`environment.development.ts`: la aplicación entra directamente al panel.

Build de producción:

```bash
npm run build      # artefactos en dist/
```

---

## 4. Specs y Agentes de IA

Viven en el repositorio para poder ser revisados:

```
backend/.agents/
+-- features/      Specs funcionales (qué construir, antes de construirlo)
+-- subagents/     Definición e instrucciones de los agentes
+-- workflows/     Flujos de trabajo asistidos por IA
```

Las convenciones de arquitectura y código que siguen los agentes están en
[`writer-code`](backend/.agents/subagents/writer-code.md), junto con los errores que no
detecta el compilador.

---

## 5. Seguridad

- Ninguna credencial, token o clave se versiona en el repositorio.
- La configuración sensible se inyecta exclusivamente por variables de entorno.
- Revisa `.gitignore` antes de cada commit.
