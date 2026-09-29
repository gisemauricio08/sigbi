# WF-001 - Porción vertical de una entidad

| | |
|---|---|
| **Cuándo** | Al añadir una entidad de dominio al backend |
| **Agente** | [`writer-code`](../subagents/writer-code.md), revisado por [`reviewer-standards`](../subagents/reviewer-standards.md) |
| **Aplicado a** | `Category`, `Book`, `Client`, `Reservation`, `ReservationDetail` |

## Principio

**Vertical antes que horizontal.** No se construyen las cinco entidades y después
los cinco controladores: se construye **una entera** y se comprueba. La segunda
cuesta la mitad porque el camino ya está abierto y los errores de convención ya
salieron.

Si la convención de la clave primaria está mal, conviene descubrirlo el día 1 con
una entidad, no el día 4 con cinco.

## Los seis archivos, en orden

| # | Archivo | Contenido |
|---|---|---|
| 1 | `model/X.java` | Entidad JPA. `nullable` y `length` **siempre explícitos** |
| 2 | `repo/IXRepo.java` | `extends IGenericRepo<X, Integer>`. Vacío si no hay consultas propias |
| 3 | `service/IXService.java` | `extends ICRUD<X, Integer>`. Los métodos propios se declaran **aquí** primero |
| 4 | `service/impl/XServiceImpl.java` | `extends CRUDImpl`. Solo `getRepo()` si no hay reglas |
| 5 | `dto/XDTO.java` | Contrato validado. Sin anotaciones JPA |
| 6 | `controller/XController.java` | `@RequestMapping("/v1/xs")` |

El orden no es casual: cada archivo depende del anterior, así que escribirlos al
revés obliga a volver atrás.

## Paso a paso

1. **Leer la spec** de `features/` entera: reglas, contrato y criterios. El modelo de
   datos no se improvisa; si la spec no lo fija, se pregunta antes de escribir.
2. **Entidad.** Revisar columna por columna: tipo, `length`, `nullable` y la clave
   foránea con su restricción nombrada `FK_<HIJA>_<PADRE>`. La PK es
   `Integer id<Clase>` con `IDENTITY`. Referencia en el repositorio: `model/Book.java`
   (FK a `Category`) y `model/Reservation.java` (cabecera con detalles).
3. **Repositorio.** Consultas derivadas por nombre de método. `@Query` solo cuando
   el nombre derivado resultaría ilegible - un `GROUP BY`, por ejemplo - o cuando
   hace falta `JOIN FETCH`.
4. **Servicio.** Aquí y solo aquí viven las reglas. Cada una, con su identificador
   `RN-xx` en un comentario, para que se pueda rastrear desde la spec o desde el
   catálogo de reglas de abajo. Una regla incumplida lanza `BusinessRuleException`.
   Referencia: `service/impl/CategoryServiceImpl.java` (un `delete` que valida una
   restricción) y `service/impl/ReservationServiceImpl.java` (reglas de alta y baja).
5. **DTO.** Un DTO por recurso, reutilizado en entrada y salida. `@NotBlank` en
   los `String` obligatorios y `@Size(max)` coincidiendo con el `length` de la
   columna: un texto largo debe dar **400, no 500**.
6. **Controlador.** Cinco métodos con esta forma, como en `controller/BookController.java`:
   `findAll` y `findById` devuelven `ResponseEntity.ok(dto)`; `save` recibe
   `@Valid @RequestBody`, graba y responde `ResponseEntity.created(location)` con la
   `Location` construida por `ServletUriComponentsBuilder`; `update` responde `200` con
   el DTO; `delete` responde `ResponseEntity.noContent()`. El mapeo va en dos métodos
   privados `convertToDto` / `convertToEntity` con ModelMapper; si el DTO y la entidad
   no coinciden en nombres, se mapea a mano. El controlador no decide reglas, no toca
   el repositorio y no captura excepciones.
7. **Compilar:** `./mvnw -DskipTests compile`.
8. **Verificar la regla contra la API**, no solo desde la interfaz. Una validación
   que solo vive en el formulario no es una regla: es una sugerencia.

## Criterio de terminado

| # | Criterio |
|---|---|
| 1 | Compila sin advertencias nuevas |
| 2 | Los cinco endpoints responden: `GET` lista y `GET /{id}` -> `200`; `POST` -> `201` con `Location`; `PUT /{id}` -> `200`; `DELETE /{id}` -> `204`. Id inexistente -> `404`; validación o regla incumplida -> `400` |
| 3 | Cada regla se verifica **contra la API** |
| 4 | Ningún error devuelve traza de Java |
| 5 | Ningún texto visible en inglés |
| 6 | Cada regla implementada cita su `RN-xx` en el código |

## Precedente

Las cinco entidades del dominio se construyeron con este flujo el 2026-09-15.
`Category` y `Book` primero -para validar la convención de la clave primaria con
una antes de replicarla-, y después `Client`, `Reservation` y `ReservationDetail`.

El resultado: 20 endpoints y las reglas RN-01 a RN-14 cubiertas. La única con
lógica propia es la reserva; las otras cuatro son `getRepo()` más un `delete` que
valida una restricción.

### Catálogo de reglas del dominio

**RN** es *regla de negocio*; el número la identifica en todo el proyecto, código incluido.
Las de la reserva (RN-03 a RN-10 y RN-13) están definidas en
[`FEAT-001`](../features/FEAT-001-registro-de-reserva.md), sección 3. Las demás:

| ID | Regla | Dónde vive |
|---|---|---|
| RN-01 | Un libro pertenece a exactamente una categoría, que debe existir | FK no nulable `book.id_category` + `BookServiceImpl` |
| RN-02 | No hay dos libros con el mismo ISBN | Columna `UNIQUE` + validación en `BookServiceImpl` |
| RN-11 | No se elimina una categoría que tiene libros | `CategoryServiceImpl.delete()` |
| RN-12 | No se elimina un libro ni un cliente con reservas registradas | `BookServiceImpl.delete()`, `ClientServiceImpl.delete()` |
| RN-14 | Una categoría desactivada no se ofrece al clasificar libros nuevos, pero los ya clasificados la conservan | `Category.status` |
