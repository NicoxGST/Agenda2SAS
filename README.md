# Agenda2 — Documento Técnico-Funcional

> Versión: 1.0 · Fecha: 2026-06-17  
> Audiencia: desarrolladores nuevos, product owners, QA

---

## Índice

1. [Visión general del sistema](#1-visión-general-del-sistema)
2. [Roles del sistema](#2-roles-del-sistema)
3. [Flujo completo de Reservas](#3-flujo-completo-de-reservas)
4. [Conversión Reserva → Orden de Trabajo](#4-conversión-reserva--orden-de-trabajo)
5. [Flujo completo de Órdenes de Trabajo](#5-flujo-completo-de-órdenes-de-trabajo)
6. [Reestructuración del Portal Cliente](#6-reestructuración-del-portal-cliente)
7. [Reestructuración del Portal Técnico](#7-reestructuración-del-portal-técnico)
8. [Reestructuración del Portal Admin](#8-reestructuración-del-portal-admin)
9. [Dashboard Administrativo](#9-dashboard-administrativo)
10. [**Principio arquitectónico principal: Separación entre Reservas y Órdenes de Trabajo**](#10-principio-arquitectónico-principal)

---

## 1. Visión general del sistema

**Agenda2** es un sistema de gestión de taller de reparaciones que cubre el ciclo completo de atención al cliente:

| Etapa | Concepto | Descripción |
|---|---|---|
| 1 | **Reserva** | El cliente agenda una cita para traer su equipo al taller |
| 2 | **Recepción** | El técnico o admin recibe físicamente el equipo y abre una OT |
| 3 | **Orden de Trabajo** | Documenta la reparación: diagnóstico, piezas, costo de mano de obra |
| 4 | **Seguimiento** | El estado de la OT avanza hasta la entrega del equipo reparado |

El sistema distingue de forma estricta entre una **cita** (Reserva) y una **reparación** (Orden de Trabajo). Estas dos entidades tienen ciclos de vida independientes y no deben mezclarse. Ver [sección 10](#10-principio-arquitectónico-principal).

### Stack técnico

- **Monorepo**: Turborepo + pnpm
- **Backend**: `apps/api` — NestJS 11, Prisma ORM, PostgreSQL, JWT
- **Frontend**: `apps/web` — React 19, Vite, TypeScript (strict)

---

## 2. Roles del sistema

El sistema usa un modelo de roles jerárquico. Cada rol hereda los permisos del rol inferior gracias al guard `RolesGuard`, que evalúa `userLevel >= requiredLevel`.

| Rol | Nivel | Descripción |
|---|---|---|
| `CLIENT` | 1 | Usuario final. Crea reservas, consulta sus dispositivos y reparaciones. |
| `WORKER` | 2 | Técnico del taller. Gestiona su agenda, atiende reservas, gestiona OTs. |
| `ADMIN` | 3 | Operador del negocio. Visión global de reservas, OTs, técnicos y economía. Puede hacer todo lo que hace un WORKER. |
| `SUPER_ADMIN` | 4 | Administrador de sistema. Puede crear usuarios de cualquier rol. Acceso total. |

### Permisos por entidad

| Acción | CLIENT | WORKER | ADMIN | SUPER_ADMIN |
|---|:---:|:---:|:---:|:---:|
| Crear reserva propia | ✅ | — | — | — |
| Ver reservas propias | ✅ | — | — | — |
| Ver reservas asignadas | — | ✅ | ✅ | ✅ |
| Ver todas las reservas | — | — | ✅ | ✅ |
| Confirmar / Cancelar reserva | — | ✅ | ✅ | ✅ |
| Marcar No Show | — | ✅ | ✅ | ✅ |
| Atender reserva (crear OT) | — | ✅ | ✅ | ✅ |
| Ver sus OTs asignadas | — | ✅ | ✅ | ✅ |
| Ver todas las OTs | — | — | ✅ | ✅ |
| Crear OT manualmente | — | ✅ | ✅ | ✅ |
| Avanzar estado de OT | — | ✅ | ✅ | ✅ |
| Crear dispositivo | — | ✅ | ✅ | ✅ |
| Buscar clientes | — | ✅ | ✅ | ✅ |
| Gestionar usuarios | — | — | ✅ | ✅ |
| Crear usuarios ADMIN/SUPER_ADMIN | — | — | — | ✅ |

> **Nota técnica**: La jerarquía es lineal. `@Roles(Role.WORKER)` en un endpoint significa que cualquier usuario con nivel ≥ 2 puede acceder, incluyendo ADMIN y SUPER_ADMIN.

---

## 3. Flujo completo de Reservas

Una Reserva representa una **cita agendada**. No implica que el equipo haya llegado ni que haya reparación iniciada.

### Estados

```
PENDING ──→ CONFIRMED ──→ ATTENDED
    │              │
    └──→ CANCELLED  └──→ CANCELLED
                         └──→ NO_SHOW
```

| Estado | Código | Descripción | Quién lo asigna |
|---|---|---|---|
| Pendiente | `PENDING` | Estado inicial al crear la reserva. Espera confirmación del taller. | Sistema (automático al crear) |
| Confirmada | `CONFIRMED` | El taller confirmó la cita con el cliente. | WORKER / ADMIN |
| Atendida | `ATTENDED` | El cliente llegó, el equipo fue recibido. La reserva origina una OT. | WORKER / ADMIN |
| Cancelada | `CANCELLED` | La cita fue cancelada antes de realizarse. | WORKER / ADMIN |
| No asistió | `NO_SHOW` | El cliente no se presentó. | WORKER / ADMIN |

### Reglas de negocio

- Solo se puede **atender** (`ATTENDED`) una reserva que esté en `PENDING` o `CONFIRMED`. El backend rechaza cualquier otro caso.
- Una reserva `ATTENDED` **no desaparece** de la base de datos; queda como registro histórico y la OT mantiene la referencia `reservationId`.
- Una reserva `ATTENDED` **desaparece del flujo operativo** activo: ya no aparece en las listas de trabajo pendiente del técnico ni del admin.

### Endpoint principal

```
POST /reservations          → Crear reserva (CLIENT)
GET  /reservations          → Listar todas (ADMIN+)
GET  /reservations/my       → Mis reservas (CLIENT)
GET  /reservations/worker/my → Mis reservas asignadas (WORKER+)
PATCH /reservations/:id     → Actualizar datos (WORKER+)
PATCH /reservations/:id/status → Cambiar estado (WORKER+)
POST  /reservations/:id/attend → Atender y crear OT (WORKER+)
DELETE /reservations/:id    → Eliminar (ADMIN+)
```

---

## 4. Conversión Reserva → Orden de Trabajo

Este es el momento central del sistema: cuando una cita se convierte en una reparación real.

### Flujo completo

```
 CLIENTE agenda reserva
          │
          ▼
 Reserva [PENDING]
          │
          │  WORKER/ADMIN confirma
          ▼
 Reserva [CONFIRMED]
          │
          │  Cliente llega con el equipo
          │  WORKER/ADMIN ejecuta POST /reservations/:id/attend
          ▼
 ┌─────────────────────────────────────────┐
 │         TRANSACCIÓN ATÓMICA             │
 │                                         │
 │  1. Reserva → status = ATTENDED         │
 │                                         │
 │  2a. Si el cliente trae equipo nuevo:   │
 │      → Se crea Device (brand, model...) │
 │                                         │
 │  2b. Si el cliente trae equipo previo:  │
 │      → Se reutiliza deviceId existente  │
 │                                         │
 │  3. Se crea WorkOrder con:              │
 │     · deviceId                          │
 │     · workerId = técnico asignado       │
 │     · reservationId = id de la reserva  │
 │     · status = RECEIVED                 │
 └─────────────────────────────────────────┘
          │
          ▼
 Reserva sale del flujo operativo activo
          │
          ▼
 WorkOrder [RECEIVED] ← entra al flujo de reparación
```

### Detalles técnicos del endpoint `attend`

`POST /reservations/:id/attend` acepta:

```typescript
{
  // Opción A: equipo ya existente
  deviceId: number;

  // Opción B: equipo nuevo (se crea en la misma transacción)
  brand: string;
  model: string;
  deviceType: string;
  serialNumber?: string;
  deviceDescription?: string;

  // Siempre requerido:
  problemDescription: string;
  laborCost?: number;  // default 0
}
```

La operación completa ocurre en una **transacción Prisma** (`$transaction`): si cualquier paso falla, ningún cambio persiste.

### Creación manual de OT (sin reserva previa)

El ADMIN puede recibir un equipo directamente sin reserva previa usando `WorkOrdersPage`:

1. **Modo "Dispositivo existente"**: selecciona dispositivo ya registrado → `POST /work-orders`
2. **Modo "Dispositivo nuevo"**: busca cliente (`GET /devices/clients?search=`), completa datos del equipo → `POST /devices` → `POST /work-orders`

En este caso la OT no tiene `reservationId` (campo nullable).

---

## 5. Flujo completo de Órdenes de Trabajo

Una Orden de Trabajo (OT) representa **una reparación**. Tiene ciclo de vida propio e independiente de la reserva que la originó.

### Estados

```
RECEIVED → DIAGNOSIS → WAITING_PARTS → IN_REPAIR → READY → DELIVERED
    │           │              │            │          │
    └───────────┴──────────────┴────────────┴──────────┴──→ CANCELLED
```

| Estado | Código | Significado operativo |
|---|---|---|
| Recibido | `RECEIVED` | El equipo fue recibido físicamente. Pendiente de diagnóstico. |
| Diagnóstico | `DIAGNOSIS` | El técnico está evaluando el problema. |
| Esperando piezas | `WAITING_PARTS` | Se requieren repuestos que aún no han llegado. |
| En reparación | `IN_REPAIR` | El técnico está ejecutando la reparación. |
| Listo | `READY` | La reparación está completa. Equipo listo para retiro. |
| Entregado | `DELIVERED` | El cliente retiró el equipo. Estado final positivo. |
| Cancelado | `CANCELLED` | La reparación fue cancelada. Estado final negativo. |

### Agrupaciones funcionales

| Grupo | Estados incluidos | Uso |
|---|---|---|
| `IN_PROCESS` | RECEIVED, DIAGNOSIS, WAITING_PARTS, IN_REPAIR | Trabajo activo en curso |
| `ACTIVE` | RECEIVED, DIAGNOSIS, WAITING_PARTS, IN_REPAIR, READY | Pendiente de resolución (incluye listos sin entregar) |

Estas agrupaciones se usan para calcular KPIs del dashboard y para la vista de carga de técnicos.

### Atributos clave de una OT

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | number | Identificador único de la OT |
| `deviceId` | number | Equipo asociado (obligatorio) |
| `workerId` | number | Técnico responsable |
| `reservationId` | number \| null | Referencia a la reserva de origen (null si OT manual) |
| `problemDescription` | string | Descripción del problema reportado por el cliente |
| `diagnosis` | string \| null | Diagnóstico técnico (se completa durante la reparación) |
| `laborCost` | number | Costo de mano de obra en CLP |
| `status` | WorkOrderStatus | Estado actual |
| `createdAt` | string (ISO) | Fecha y hora de creación |

### Endpoints

```
GET    /work-orders              → Listar OTs (CLIENT ve solo las suyas, WORKER+ ve según rol)
GET    /work-orders/:id          → Detalle completo de una OT
GET    /work-orders/:id/history  → Historial de cambios de estado
POST   /work-orders              → Crear OT manualmente (WORKER+)
PATCH  /work-orders/:id          → Actualizar datos (diagnóstico, costo) (WORKER+)
PATCH  /work-orders/:id/status   → Avanzar estado (WORKER+)
```

---

## 6. Reestructuración del Portal Cliente

### Antes

El portal cliente tenía dos secciones confusas que mezclaban reservas y reparaciones:

- **Mis Reservas** — citas agendadas
- **Mis Reparaciones** — estado de equipos

### Ahora

El portal cliente se reorganizó en tres secciones con responsabilidades claras:

| Sección | Ruta | Contenido |
|---|---|---|
| **Mi Panel** | `/client` | Vista unificada: próximas atenciones + reparaciones activas |
| **Servicios** | `/servicios` | Catálogo de servicios disponibles (público) |
| **Productos** | `/productos` | Catálogo de productos (público) |

### Lógica del Panel (`/client`)

**Próximas atenciones** — reservas del cliente con estado:
- `PENDING` (pendiente de confirmación)
- `CONFIRMED` (confirmada, debe presentarse)

**Reparaciones** — WorkOrders del cliente (acceso vía `GET /work-orders`, filtrado por `clientId` en backend para roles CLIENT).

Las reservas `ATTENDED`, `CANCELLED` y `NO_SHOW` no aparecen en "Próximas atenciones" porque ya no requieren acción del cliente.

---

## 7. Reestructuración del Portal Técnico

### Menú de navegación

| Ítem | Ruta | Descripción |
|---|---|---|
| **Mi Agenda** | `/worker` | Vista de disponibilidad y agenda del técnico |
| **Reservas** | `/worker/reservations` | Reservas asignadas al técnico |
| **Órdenes** | `/worker/jobs` | Órdenes de Trabajo asignadas al técnico |

El mismo menú aplica a `WORKER` y `ADMIN` (ADMIN tiene además "Panel Admin").

### Distinción fundamental: Reserva ≠ Orden de Trabajo

```
RESERVA                         ORDEN DE TRABAJO
──────────────────────          ──────────────────────────────
Es una CITA                     Es una REPARACIÓN
El cliente NO ha llegado        El equipo está físicamente en el taller
Puede cancelarse                Tiene historial técnico
No tiene diagnóstico            Tiene diagnóstico, costo, fotos
Aparece en /worker/reservations Aparece en /worker/jobs
```

**El momento exacto de transición**: cuando el WORKER ejecuta "Atender" sobre una reserva (`POST /reservations/:id/attend`), la reserva pasa a `ATTENDED` y nace una OT con estado `RECEIVED`. A partir de ese instante, el equipo es gestionado exclusivamente como OT.

Una reserva atendida **nunca** vuelve al flujo operativo de reservas.

---

## 8. Reestructuración del Portal Admin

El ADMIN es un **operador del negocio**, no un observador pasivo. Tiene capacidad de intervenir en todas las etapas del ciclo.

### Capacidades operativas del ADMIN

#### Sobre Reservas

| Acción | Endpoint |
|---|---|
| Ver todas las reservas del sistema | `GET /reservations` |
| Confirmar una reserva | `PATCH /reservations/:id/status` → `CONFIRMED` |
| Cancelar una reserva | `PATCH /reservations/:id/status` → `CANCELLED` |
| Marcar No Show | `PATCH /reservations/:id/status` → `NO_SHOW` |
| Atender una reserva (convertir en OT) | `POST /reservations/:id/attend` |
| Eliminar una reserva | `DELETE /reservations/:id` |

#### Sobre Órdenes de Trabajo

| Acción | Endpoint |
|---|---|
| Ver todas las OTs del sistema | `GET /work-orders` |
| Crear OT manualmente (con o sin reserva previa) | `POST /work-orders` |
| Asignar técnico al crear OT | Campo `workerId` en `POST /work-orders` |
| Reasignar técnico | `PATCH /work-orders/:id` (campo `workerId`) |
| Avanzar estado de reparación | `PATCH /work-orders/:id/status` |
| Actualizar diagnóstico y costos | `PATCH /work-orders/:id` |

#### Sobre Dispositivos

| Acción | Endpoint |
|---|---|
| Registrar nuevo dispositivo | `POST /devices` |
| Buscar clientes por nombre | `GET /devices/clients?search=` |
| Ver dispositivos de un cliente | `GET /devices?clientId=` |

### Flujo de recepción manual (sin reserva previa)

El ADMIN puede recibir un equipo que llega sin cita:

```
WorkOrdersPage
    │
    ├─ Modo "Dispositivo existente"
    │       └─ Selecciona dispositivo del dropdown
    │          └─ POST /work-orders
    │
    └─ Modo "Dispositivo nuevo"
            ├─ Busca cliente por nombre (GET /devices/clients?search=)
            │  └─ Si no existe → debe registrarse primero (no se puede crear clientes aquí)
            ├─ Completa: marca, modelo, tipo, serie (opcional)
            ├─ POST /devices → obtiene deviceId
            └─ POST /work-orders con el nuevo deviceId
```

---

## 9. Dashboard Administrativo

El dashboard está en `/admin` y es accesible para `ADMIN` y `SUPER_ADMIN`. Carga datos de tres endpoints en paralelo usando `Promise.allSettled`.

### Fuentes de datos

| Datos | Endpoint | Service |
|---|---|---|
| Reservas | `GET /reservations` | `getAllReservations()` |
| Órdenes de trabajo | `GET /work-orders` | `getWorkOrders()` |
| Técnicos | `GET /availability/workers` | `getWorkers()` |

Todos los KPIs se calculan **en el frontend** con `useMemo`. No hay endpoints nuevos.

### Sección: Reservas

| KPI | Cálculo |
|---|---|
| **Reservas hoy** | `reservations` donde `scheduledAt.slice(0,10) === today` (fecha local, no UTC) |
| **Pendientes** | `reservations` donde `status === "PENDING"` |
| **Confirmadas** | `reservations` donde `status === "CONFIRMED"` |

### Sección: Órdenes de trabajo

| KPI | Cálculo |
|---|---|
| **Órdenes activas** | `workOrders` donde `status ∈ ACTIVE` (RECEIVED, DIAGNOSIS, WAITING_PARTS, IN_REPAIR, READY) |
| **En proceso** | `workOrders` donde `status ∈ IN_PROCESS` (RECEIVED, DIAGNOSIS, WAITING_PARTS, IN_REPAIR) |
| **Listas para entrega** | `workOrders` donde `status === "READY"` |
| **Entregadas este mes** | `workOrders` donde `status === "DELIVERED"` y `createdAt >= primer día del mes actual` |

> "Órdenes activas" incluye "Listas para entrega". "En proceso" excluye `READY`. Esta distinción es intencional: permite ver tanto la carga de trabajo técnico (IN_PROCESS) como la carga total pendiente de resolución (ACTIVE).

### Sección: Indicadores económicos

| KPI | Cálculo |
|---|---|
| **Mano de obra pendiente** | Suma de `laborCost` para `workOrders` donde `status ∈ ACTIVE` |
| **Facturado este mes** | Suma de `laborCost` para `workOrders` donde `status === "DELIVERED"` y `createdAt >= primer día del mes actual` |

Valores formateados como moneda CLP con `Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" })`.

### Tabla: Carga de técnicos

Lista todos los técnicos (`getWorkers()`) con el conteo de OTs activas (`ACTIVE`) asignadas a cada uno, ordenados de mayor a menor carga.

```
Técnico          | Órdenes activas
─────────────────|────────────────
Juan Pérez       | 4
María González   | 2
Pedro Soto       | 0
```

Los técnicos sin OTs activas aparecen igualmente en la lista (valor 0, pill gris).

### Tabla: Últimas 10 órdenes

Muestra las 10 OTs más recientes ordenadas por `id` descendente.

| Columna | Fuente |
|---|---|
| OT | `#${wo.id}` |
| Cliente | `wo.device.client.name` |
| Equipo | `${wo.device.brand} ${wo.device.model}` |
| Estado | `WORK_ORDER_STATUS_LABELS[wo.status]` (pill con color por estado) |
| Técnico | `wo.worker.name` |
| Ver detalle | Navega a `/work-orders/${wo.id}` |

### Colores de estado (pills)

| Estado | Clase CSS |
|---|---|
| RECEIVED | `pill-blue` |
| DIAGNOSIS | `pill-orange` |
| WAITING_PARTS | `pill-orange` |
| IN_REPAIR | `pill-blue` |
| READY | `pill-success` |
| DELIVERED | `pill-success` |
| CANCELLED | `pill-muted` |

---

## 10. Principio arquitectónico principal

---

> ### ⚠️ Regla de negocio fundamental
>
> ## Separación estricta entre Reservas y Órdenes de Trabajo
>
> **Esta es la regla de diseño más importante del sistema. Toda decisión de implementación debe respetarla.**

---

### Qué es cada concepto

| | Reserva | Orden de Trabajo |
|---|---|---|
| **Representa** | Una cita agendada | Una reparación en curso o completada |
| **El equipo está en el taller** | No necesariamente | Siempre |
| **Tiene diagnóstico técnico** | No | Sí |
| **Tiene costo de mano de obra** | No | Sí |
| **Tiene fotos del equipo** | No | Sí |
| **El cliente puede crearla** | Sí | No |
| **Puede avanzar estados técnicos** | No | Sí |
| **Tiene historial de cambios** | No | Sí |
| **Estado final positivo** | ATTENDED | DELIVERED |
| **Estado final negativo** | CANCELLED / NO_SHOW | CANCELLED |

### Por qué esta separación es crítica

1. **Modelos de negocio diferentes**: Una reserva es un compromiso de agenda. Una OT es un contrato de trabajo técnico. Mezclarlos impediría tener ambos flujos correctamente.

2. **Ciclos de vida independientes**: Una OT puede crearse sin reserva previa (recepción directa). Una reserva puede terminar sin OT (NO_SHOW, CANCELLED).

3. **Responsabilidades distintas**: Las reservas son coordinadas por el cliente y confirmadas por el taller. Las OTs son gestionadas exclusivamente por técnicos y admins.

4. **Trazabilidad**: La referencia `reservationId` en la OT es opcional y solo sirve como enlace histórico. Nunca se usa para operar la OT.

### Lo que NUNCA debe hacerse

- ❌ Mostrar reservas en la lista de OTs o viceversa
- ❌ Usar el estado de una reserva para determinar el progreso de una reparación
- ❌ Crear una OT sin un `deviceId` (el equipo debe estar registrado)
- ❌ Permitir que el cliente gestione directamente el estado de una OT
- ❌ Saltarse el paso `POST /devices` cuando el equipo no existe aún

### El momento de transición

```
                    POST /reservations/:id/attend
                              │
          ┌───────────────────┴───────────────────┐
          ▼                                       ▼
  Reserva → ATTENDED                    WorkOrder → RECEIVED
  (sale del flujo activo)               (entra al flujo de reparación)
```

Este endpoint es el único puente entre los dos mundos. Ejecuta una transacción atómica que garantiza consistencia: si la OT no puede crearse, la reserva no cambia de estado.

---

*Documento generado el 2026-06-17. Mantener actualizado ante cambios de modelo de negocio o reestructuración de endpoints.*
