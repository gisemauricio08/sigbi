# FEAT-002 - Asistente de reserva (frontend)

| | |
|---|---|
| **Estado** | **Implementado.** La spec se escribió antes del código; ver sección 8 |
| **Requerimientos** | Registrar una reserva de uno o más libros para un cliente, desde una pantalla guiada; no permitir confirmarla sin libros |
| **Consume** | [`FEAT-001`](FEAT-001-registro-de-reserva.md) |
| **Escrita** | 2026-09-15 |

## 1. Qué se construye

`ReservationWizardComponent`, en `/pages/reservation-wizard`. Es **la única pantalla
con flujo** del sistema: tres pasos con `mat-stepper`. Todas las demás son una tabla
con un diálogo.

## 2. Los tres pasos

| Paso | Contenido | Condición para avanzar |
|---|---|---|
| 1 - Cliente | Buscador por nombre o cédula, selección única | Hay un cliente seleccionado |
| 2 - Libros | Buscador del catálogo con filtro por categoría. **Solo libros disponibles** | Hay al menos un libro |
| 3 - Confirmación | Resumen: cliente, libros y fecha | - |

## 3. Comportamiento

| # | Regla de interacción | Por qué |
|---|---|---|
| 1 | "Siguiente" está **deshabilitado** hasta que el paso cumple su condición | No se avanza para descubrir el error después |
| 2 | El paso 2 lista solo `available = true` | RN-06. La regla la aplica el backend; el filtro es comodidad |
| 3 | Un libro ya elegido aparece **marcado** y no se añade dos veces | RN-08 |
| 4 | Volver al paso 1 y cambiar de cliente **no borra** los libros elegidos | Perder la selección por corregir un dato es hostil |
| 5 | La fecha del paso 3 **no es editable** | RN-10. Se muestra para saber qué se va a grabar |
| 6 | Al confirmar se envía **una sola petición** | RN-09. No hay grabado parcial por pasos |
| 7 | Si falla, el asistente **conserva la selección** en el paso 3 | Reintentar es volver a pulsar, no rehacer el recorrido |
| 8 | Abandonar con una selección en curso **pide confirmación** | Es el único sitio donde se puede perder trabajo |
| 9 | El éxito lleva **siempre** a `/pages/reservation` | El usuario quiere ver lo que acaba de registrar |

Las `RN-xx` citadas son las reglas del registro de reserva, definidas en
[`FEAT-001`](FEAT-001-registro-de-reserva.md) sección 3.

## 4. Cómo se construye

Patrón componente + store, que es el del código más reciente del repositorio:

| Pieza | Responsabilidad |
|---|---|
| `services/reservation.service.ts` | Extiende `GenericService<Reservation>`, fija la URL |
| `store/reservation-wizard.store.ts` | Estado con signals: cliente elegido, libros elegidos, paso actual |
| `pages/reservation-wizard/` | Presentación. **No inyecta `HttpClient`**: el acceso pasa por el servicio |
| `model/reservation.ts` | Espejo exacto de `ReservationDTO`; ningún campo inventado |

El envío construye el cuerpo de FEAT-001 sección 4: `idClient` y `details` con solo
`idBook`. Nada más.

## 5. Criterios de aceptación

Verificables sobre la aplicación en marcha.

| # | Acción | Esperado |
|---|---|---|
| 1 | "Siguiente" sin cliente | Deshabilitado |
| 2 | Observar la lista del paso 2 | Los libros reservados **no aparecen** |
| 3 | "Siguiente" sin libros | Deshabilitado |
| 4 | Elegir el mismo libro dos veces | Aparece marcado; no se duplica |
| 5 | Volver al paso 1, cambiar cliente, avanzar | **Los libros siguen seleccionados** |
| 6 | Intentar editar la fecha | No es editable |
| 7 | Confirmar | Va al listado con la reserva nueva destacada |
| 8 | Provocar un fallo al confirmar | Mensaje del backend, selección intacta |

## 6. Estados de pantalla

Los cinco estados de toda pantalla de datos aplican a las listas de los pasos 1 y 2: cargando, con
datos, vacío, error con reintento, y **filtrado sin resultados** -que es distinto de
vacío: uno pide crear un registro, el otro pide limpiar el filtro-.

## 7. Lo que esta pantalla no hace

- **No crea clientes.** Si la persona no está en el padrón, se registra en
  `/pages/client` primero. El asistente no es un formulario de alta encubierto.
- **No edita reservas.** Una reserva se registra o se elimina; no se modifica.
  El modelo no tiene nada que modificar salvo los detalles, y cambiarlos equivale
  a rehacerla.

---

## 8. Estado de la implementación

> Añadido el 2026-09-15, después de implementar. Lo de arriba es el texto original, tal
> como se escribió antes de existir el código.

`ReservationWizardComponent` en `frontend/src/app/pages/reservation-wizard/`, con el
patrón componente + store de sección 4.

### Lo que esta spec sirvió para encontrar

La primera implementación cumplía el flujo de tres pasos pero **se saltaba cuatro puntos
de esta spec**. Se detectaron cotejando el código contra este documento, y se corrigieron:

| Punto | Qué faltaba |
|---|---|
| Paso 2 de sección 2 | El buscador estaba, pero **no el filtro por categoría** |
| Regla 7 | Al fallar el guardado devolvía al paso 2; la spec pide quedarse en el 3, con la selección intacta, para que reintentar sea volver a pulsar |
| Regla 8 | Salir con una selección empezada **no pedía confirmación** |
| Criterio 7 | El listado no **destacaba** la reserva recién registrada |

Es el argumento a favor de escribir la spec primero: sin ella los cuatro habrían pasado
por buenos, porque la pantalla "funcionaba".

### Verificación

Los ocho criterios de sección 5 se ejecutaron sobre la aplicación el 2026-09-15:

- Paso 2 listando **18 libros** de 24, que son los disponibles (criterio 2).
- Filtro por Ciencia dejando 3 de esos 18.
- "Continuar" deshabilitado sin cliente y sin libros (criterios 1 y 3).
- La confirmación al salir, nombrando lo que se pierde (regla 8).
- Registro correcto, con el listado abriéndose en `?nueva=<id>` y esa fila resaltada
  (criterio 7).

La regla 4 -cambiar de cliente no borra los libros elegidos- se cumple por construcción:
cliente y libros son dos signals independientes del store.
