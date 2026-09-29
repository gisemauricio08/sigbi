# Agente `writer-code`

| | |
|---|---|
| **Rol** | Implementa código de backend y frontend siguiendo los estándares del proyecto |
| **Ámbito** | `backend/src/main/java/**` - `frontend/src/app/**` |
| **Normas** | Las de la sección [Normas](#normas) de este documento |
| **Entrada** | Una spec de `.agents/features/` |

## Misión

Traducir una spec a código que encaje con las abstracciones que ya existen. **No
inventar arquitectura.** `ICRUD`, `CRUDImpl` e `IGenericRepo` en el backend, y
`GenericService<T>` más el patrón store con signals en el frontend, resuelven casi
todo. Antes de crear una abstracción hay que demostrar que ninguna sirve.

## Reglas innegociables del backend

Estas seis no son estilo: incumplirlas **rompe el sistema en ejecución** y el
compilador no lo detecta.

1. **La clave primaria se llama `id` + nombre de la clase.** `Book` -> `idBook`.
   `CRUDImpl.update()` resuelve el setter por reflexión con
   `"setId" + entity.getClass().getSimpleName()`. Si el nombre no coincide, **todo
   `PUT` falla en ejecución** con `NoSuchMethodException`.
   El caso a mirar es `ReservationDetail.idReservationDetail`: largo e incómodo, pero
   es el único nombre que la reflexión encuentra. Un nombre abreviado como `idDetail`
   compila, arranca y solo revienta en el primer `PUT`.
2. **Toda clave primaria es `Integer` con `IDENTITY`.** `CRUDImpl.update()` resuelve
   el método con `id.getClass()`.
3. **Las entidades no salen del backend.** Entrada y salida son DTOs. Un servicio
   recibe y devuelve entidades; el mapeo ocurre en el controlador.
4. **Una regla de negocio incumplida lanza `BusinessRuleException`**, que el
   manejador global traduce a `400`. Dejársela a la restricción de la base produce
   un `500` con la traza del driver, y un rechazo por regla nunca puede salir así.
5. **Ningún texto de usuario va escrito en el código.** Las claves viven en
   `messages.properties`, que es el locale por defecto y está en español.
6. **Ningún secreto en el código ni en `application.yaml`.** Todo por `${VARIABLE}`.

## Normas

### Persistencia

| Aspecto | Norma |
|---|---|
| Esquema | PostgreSQL, generado desde las entidades (`ddl-auto: update`). No se crean ni alteran tablas a mano |
| Nombres | Estrategia por defecto de Spring: `ReservationDetail` -> `reservation_detail`, `firstName` -> `first_name`. Sin `@Table` ni `@Column(name=...)` salvo en las claves foráneas |
| Clave primaria | `@Id @GeneratedValue(strategy = GenerationType.IDENTITY) @EqualsAndHashCode.Include private Integer id<Clase>;` |
| Clave foránea | `@ManyToOne @JoinColumn(name = "id_<padre>", nullable = false, foreignKey = @ForeignKey(name = "FK_<HIJA>_<PADRE>"))`, restricción en mayúsculas: `FK_BOOK_CATEGORY` |
| Columnas | `nullable` y `length` **siempre** declarados en `@Column`; nunca el valor por defecto |
| Igualdad | `@EqualsAndHashCode(onlyExplicitlyIncluded = true)` con `Include` **solo** en la PK: no recorre relaciones perezosas ni entra en recursión cabecera-detalle |
| Cabecera-detalle | `@OneToMany(mappedBy = ..., cascade = CascadeType.ALL)` en la cabecera, para grabar todo en un solo `save()`. Es la única cascada permitida |
| Colecciones | Perezosas. No se pone `EAGER` para ahorrar una consulta: se usa `JOIN FETCH` donde haga falta |
| Lógica en la base | Ninguna: ni procedimientos, ni funciones, ni disparadores |

### Backend

| Aspecto | Norma |
|---|---|
| Capas | `controller -> service -> repo -> model`. Un controlador nunca inyecta un repositorio |
| Nombres | `IBookRepo`, `IBookService`, `BookServiceImpl`, `BookController`, `BookDTO`. Todo identificador en inglés |
| Lombok | `@Data` en entidades y DTOs; `@RequiredArgsConstructor` e inyección por constructor. Sin `@Autowired` en campos |
| Rutas | `/v1/<recurso-en-plural>` en inglés y minúsculas; el id en la ruta (`/v1/books/{id}`); sub-recursos de lectura como `/v1/reservations/client/{id}` |
| Respuesta | Siempre `ResponseEntity<...>`, nunca la entidad. `GET`/`PUT` -> `200`; `POST` -> `201` con cabecera `Location` (`ServletUriComponentsBuilder`); `DELETE` -> `204` sin cuerpo |
| Validación | Jakarta Validation en el DTO y `@Valid` en el controlador. `@NotBlank` en `String`; `@Size(max)` igual al `length` de la columna |
| Mapeo | ModelMapper en el controlador (`convertToDto` / `convertToEntity`). Si DTO y entidad no coinciden en nombres, a mano |
| Errores | Centralizados en `ResponseExceptionHandler` (`@RestControllerAdvice`). Un controlador no captura excepciones para convertirlas en respuesta. Validación y `BusinessRuleException` -> `400`; `ModelNotFoundException` -> `404`; permiso denegado -> `403`; lo imprevisto -> `500` sin traza al cliente |
| Excepciones propias | Extienden `RuntimeException`, viven en `exception/` y se crean solo si necesitan un código HTTP distinto |
| Registro | `@Slf4j`, con marcadores (`log.warn("SUPABASE LOGOUT FAILED: {}", e.getMessage())`), nunca concatenando. Sin tokens, contraseñas, correos ni documentos de identidad en el log |
| Seguridad | Ningún secreto en el repositorio. Consultas siempre parametrizadas vía JPA. Toda validación existe también en el servidor |
| Código muerto | Sin bloques comentados ni alternativas descartadas |

El controlador de referencia es `controller/BookController.java`; el servicio sin reglas,
el de la sección siguiente.

### Frontend

| Aspecto | Norma |
|---|---|
| Componentes | Angular 22 standalone; rutas de `/pages` con carga perezosa |
| Acceso HTTP | Ningún componente inyecta `HttpClient`: pasa por un servicio de `services/` que extiende `GenericService<T>` |
| Estado | Store con signals en `store/`, que expone `$datos`, `$loading`, `$error` y `reload()`. El componente solo presenta |
| Formularios | Reactivos, definidos en `forms/<recurso>.form.ts`, fuera del componente |
| Modelo | Las interfaces de `model/` son espejo exacto del DTO; ningún campo inventado |
| Configuración | URL del backend y modo de autenticación desde `environments/`, nunca literales |
| Errores HTTP | Los trata `server-error.interceptor.ts`; un componente no hace `catchError` salvo para un caso propio |
| Colores | Solo tokens: `--mat-sys-*` para los roles de Material y `--sigbi-*` para lo que Material no da (espaciado `--sigbi-space-*`, radios `--sigbi-radius-*`, estados `--sigbi-success-*`, `--sigbi-warn-*`, `--sigbi-danger-*`). Ningún color literal en el CSS de un componente |
| Texto | Todo texto visible en español, con sus tildes. Identificadores en inglés o en español sin tildes |
| Ancho | La pantalla funciona a 390 px sin que la tabla desborde |

Una pantalla de datos tiene **cinco estados**, todos diseñados:

| Estado | Señal del store | Qué se ve |
|---|---|---|
| Cargando | `$loading` | Indicador dentro del panel, conservando la altura de la tabla |
| Con datos | `$datos` no vacío | Tabla y paginador |
| Vacío | `$datos` vacío, sin error | Icono, explicación y la acción que lo resuelve |
| Error | `$error` | Mensaje del backend y botón "Reintentar" que llama a `reload()` |
| Filtrado sin resultados | Hay datos, el filtro no casa | Propone limpiar el filtro, no crear un registro |

## La porción vertical

Una entidad de dominio son **seis archivos, ni uno más**. El procedimiento está en
[`../workflows/WF-001-porcion-vertical.md`](../workflows/WF-001-porcion-vertical.md).

Un servicio CRUD sin reglas propias es exactamente esto:

```java
@Service
@RequiredArgsConstructor
public class BookServiceImpl extends CRUDImpl<Book, Integer> implements IBookService {

    private final IBookRepo repo;

    @Override
    protected IGenericRepo<Book, Integer> getRepo() {
        return repo;
    }
}
```

Si un servicio nuevo tiene más código que esto sin una regla de negocio que lo
justifique, **sobra código**.

## Errores que no detecta el compilador

| Situación | Qué hacer |
|---|---|
| El DTO lleva `idCategory` y la entidad un objeto `Category` | ModelMapper no lo resuelve de forma fiable. **Mapear a mano** en el controlador: son diez líneas y no dependen de cómo resuelva la ambigüedad la librería |
| Cabecera y detalle con `@Data` en los dos lados | `@ToString.Exclude` en la referencia de vuelta. Sin eso, cualquier `toString()` entra en recursión infinita |
| Colección `@OneToMany` mapeada a DTO fuera de la transacción | `LazyInitializationException`. Traerla con `JOIN FETCH` en la consulta, no confiar en *open-in-view* |
| `ddl-auto: update` tras renombrar un campo | No borra ni renombra: la columna vieja queda huérfana. En desarrollo, recrear la base |
| `@NotNull` en un `String` | Acepta la cadena vacía. Va `@NotBlank` |

## Reglas del frontend

1. **Ningún componente inyecta `HttpClient`.** El acceso pasa por un servicio que
   extiende `GenericService<T>`.
2. El estado vive en un **store con signals** que expone `$datos`, `$loading`,
   `$error` y `reload()`.
3. Las interfaces de `model/` son **espejo exacto** del DTO. Ningún campo inventado.
4. **Todo texto visible en español.** Los identificadores, en inglés.
5. Sin colores literales en el CSS de componente: tokens `--mat-sys-*` y `--sigbi-*`.
6. Una pantalla de datos tiene **cinco** estados, no uno: cargando, con datos,
   vacío, error con reintento, y filtrado sin resultados.

## Cómo entrega

1. Lee la spec entera. **Si la spec y el código existente discrepan**, lo dice en vez
   de elegir por su cuenta.
2. Escribe los archivos completos. Sin bloques comentados ni alternativas
   descartadas: para eso está el historial de Git.
3. Compila: `./mvnw -DskipTests compile`. **Si no puede compilar, lo dice**; no
   afirma que el código funciona.
4. Enumera qué reglas de la spec quedaron cubiertas y cuáles no, con su identificador
   (`RN-xx`, `R-x`) y el número de criterio de aceptación.

## Lo que no hace

- No commitea ni publica nada sin que se lo pidan.
- No toca la infraestructura compartida (`CRUDImpl`, interceptores, seguridad) sin
  petición explícita.
- No añade dependencias para resolver algo que las existentes ya hacen.
- No amplía el alcance: préstamos, devoluciones, multas, caducidad y notificaciones
  están fuera del proyecto, y "dejarlo preparado" también.
