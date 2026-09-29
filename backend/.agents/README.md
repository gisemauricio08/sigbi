# `.agents/` - Flujo de trabajo asistido por IA

Artefactos del desarrollo asistido por IA de SIGBI, versionados para que puedan
revisarse junto con el código que produjeron.

| Carpeta | Contenido |
|---|---|
| `features/` | **Specs**: qué construir, escrito *antes* de construirlo |
| `subagents/` | **Agentes**: instrucciones de cada rol especializado |
| `workflows/` | **Flujos**: secuencias de trabajo repetibles |

## Qué hay

| Artefacto | Estado |
|---|---|
| [`features/FEAT-001-registro-de-reserva.md`](features/FEAT-001-registro-de-reserva.md) | **Implementado y verificado**, backend y frontend |
| [`features/FEAT-002-asistente-de-reserva.md`](features/FEAT-002-asistente-de-reserva.md) | **Implementado y verificado.** La spec detectó cuatro puntos que faltaban |
| [`features/FEAT-003-usuarios-y-roles.md`](features/FEAT-003-usuarios-y-roles.md) | **Implementado y verificado** (API 25/25). Pendiente la vista `ADMIN` en la interfaz |
| [`subagents/writer-code.md`](subagents/writer-code.md) | Activo |
| [`subagents/reviewer-standards.md`](subagents/reviewer-standards.md) | Activo |
| [`workflows/WF-001-porcion-vertical.md`](workflows/WF-001-porcion-vertical.md) | Aplicado a las cinco entidades del dominio |

## Para qué sirvió

No son documentos de adorno. FEAT-002 se escribió antes que su pantalla, y al cotejar el
código contra ella aparecieron **cuatro requisitos que la implementación se había
saltado** -el filtro por categoría del paso 2, el comportamiento al fallar el guardado,
la confirmación al abandonar y el destacado de la reserva nueva-. La pantalla "funcionaba"
sin ellos; sin la spec por delante, habrían pasado por buenos.

## Cómo encaja con el resto

Cada pieza responde a una pregunta distinta y se apoya en la anterior:

```
features/FEAT-xxx  (qué construir ahora, con reglas y criterios de aceptación)
        |
        v
subagents/         (quién lo construye y con qué normas)
        |
        v
workflows/         (en qué orden se construye)
        |
        v
código             (verificado contra los criterios de la spec)
```

Una spec **no se reescribe para encajar con el código**. Si al implementar aparece una
divergencia, se decide cuál de los dos está mal: si es el código, se corrige; si es la
spec, se anota en su sección de estado de la implementación, con la fecha y el motivo.

## Idioma

Estos documentos van en **español**, porque son para leerse. Los identificadores que
aparecen citados -clases, endpoints, columnas- van en inglés, que es la convención del
código.
