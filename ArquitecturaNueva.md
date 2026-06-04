# Architecture Documentation

## Proyecto

Sistema de gestión para taller técnico con:

* Gestión de usuarios y roles.
* Agenda y reservas.
* Gestión de equipos de clientes.
* Órdenes de trabajo.
* Servicios y productos.

---

# Stack Tecnológico

## Backend

* NestJS
* TypeScript
* Prisma ORM
* PostgreSQL (Aiven)
* JWT Authentication
* Refresh Tokens

## Frontend

* React
* TypeScript
* Vite

## Base de Datos

* PostgreSQL
* Prisma Schema

---

# Arquitectura General

El sistema está dividido en módulos independientes.

La autenticación y autorización se encuentran separadas del negocio.

Los módulos de negocio consumen la información del usuario autenticado mediante JWT y RolesGuard.

---

# Roles

Roles disponibles:

* CLIENT
* WORKER
* ADMIN
* SUPER_ADMIN

## CLIENT

Puede:

* Crear reservas.
* Ver sus reservas.
* Registrar equipos propios.
* Gestionar fotografías de sus equipos.
* Consultar órdenes relacionadas a sus equipos.

## WORKER

Puede:

* Gestionar disponibilidad.
* Ver reservas asignadas.
* Confirmar o actualizar estados de reservas.
* Crear equipos.
* Gestionar órdenes de trabajo.

## ADMIN

Puede:

* Gestionar usuarios.
* Gestionar servicios.
* Gestionar productos.
* Acceder a información global.

## SUPER_ADMIN

Posee los mismos permisos administrativos con privilegios superiores.

---

# Autenticación

El sistema utiliza:

* JWT Access Token
* Refresh Token

Componentes principales:

* JwtAuthGuard
* RolesGuard
* RouteGuard (Frontend)

La sesión se almacena en:

```txt
localStorage
```

mediante:

```txt
auth.store.ts
```

---

# FASE 1

## Servicios

Modelo:

```txt
Service
```

Campos principales:

```txt
id
name
description
price
isActive
```

Objetivo:

Representar servicios ofrecidos por el taller.

Ejemplos:

* Cambio de pantalla
* Cambio de batería
* Diagnóstico

---

## Productos

Modelo:

```txt
Product
```

Campos principales:

```txt
id
name
description
price
stock
isActive
```

Objetivo:

Representar productos e insumos administrados por el taller.

---

## Disponibilidad

Modelo:

```txt
WorkerAvailability
```

Campos:

```txt
workerId
dayOfWeek
startTime
endTime
slotMinutes
isActive
```

Objetivo:

Definir los bloques de horario disponibles para cada trabajador.

Ejemplo:

```txt
Lunes
09:00 - 18:00
Slots de 60 minutos
```

---

## Reservas

Modelo:

```txt
Reservation
```

Relaciones:

```txt
Client -> User
Worker -> User
Service -> Service
```

Campos principales:

```txt
scheduledAt
contactPhone
clientNotes
depositAmount
status
```

Restricción:

```txt
@@unique(workerId, scheduledAt)
```

Impide doble reserva para un mismo trabajador en el mismo horario.

---

## Estados de Reserva

```txt
PENDING
CONFIRMED
ATTENDED
CANCELLED
NO_SHOW
```

Equivalente visual:

```txt
PENDIENTE
CONFIRMADA
ATENDIDA
CANCELADA
NO ASISTIÓ
```

Flujo normal:

```txt
PENDING
↓
CONFIRMED
↓
ATTENDED
```

Flujos alternativos:

```txt
PENDING
↓
CANCELLED
```

o

```txt
CONFIRMED
↓
NO_SHOW
```

---

# FASE 2

## Equipos

Modelo:

```txt
Device
```

Campos principales:

```txt
clientId
brand
model
serialNumber
deviceType
description
```

Relación:

```txt
User
 ↓
Device[]
```

Un cliente puede tener múltiples equipos.

Ejemplo:

```txt
Cliente
├─ Notebook
├─ Celular
└─ Consola
```

---

## Fotografías

Modelo:

```txt
DevicePhoto
```

Relación:

```txt
Device
 ↓
DevicePhoto[]
```

Objetivo:

Registrar evidencia visual del estado del equipo.

---

## Órdenes de Trabajo

Modelo:

```txt
WorkOrder
```

Relaciones:

```txt
Device
Worker
Reservation (opcional)
```

Campos principales:

```txt
problemDescription
diagnosis
laborCost
status
```

Una orden pertenece siempre a un equipo.

Puede existir:

```txt
Con reserva
```

o

```txt
Sin reserva
```

---

## Estados de Orden de Trabajo

```txt
RECEIVED
DIAGNOSIS
WAITING_PARTS
IN_REPAIR
READY
DELIVERED
CANCELLED
```

Equivalente visual:

```txt
RECIBIDO
DIAGNÓSTICO
ESPERANDO PIEZAS
EN REPARACIÓN
LISTO
ENTREGADO
CANCELADO
```

Flujo normal:

```txt
RECEIVED
↓
DIAGNOSIS
↓
WAITING_PARTS
↓
IN_REPAIR
↓
READY
↓
DELIVERED
```

---

# Relaciones Principales

```txt
User
│
├── Reservation (Cliente)
│
├── Reservation (Trabajador)
│
├── WorkerAvailability
│
├── Device
│
└── WorkOrder
```

```txt
Service
│
└── Reservation
```

```txt
Reservation
│
└── WorkOrder (opcional)
```

```txt
Device
│
├── DevicePhoto
│
└── WorkOrder
```

---

# Flujo de Negocio Actual

Cliente

↓

Reserva

↓

Trabajador asignado

↓

Recepción del equipo

↓

Registro de fotografías

↓

Creación de Orden de Trabajo

↓

Diagnóstico

↓

Reparación

↓

Entrega

---

# Convenciones

## Backend

Cada módulo contiene:

```txt
controller
service
dto
module
```

Los DTOs contienen validaciones.

---

## Frontend

Separación por:

```txt
pages
services
components
store
router
layouts
```

---

## Roles

Nunca realizar validaciones de rol directamente en páginas.

Utilizar:

```txt
RouteGuard
RolesGuard
```

---

# Funcionalidades No Implementadas

Las siguientes características NO existen actualmente:

## Inventario Avanzado

No existe:

```txt
StockMovement
Inventory
```

---

## Consumo Automático de Productos

Actualmente los productos no se descuentan automáticamente desde órdenes de trabajo.

---

## Pagos

No existe sistema de pagos integrado.

Solo se registra el abono de reserva.

---

## Notificaciones

No existen:

```txt
Email
WhatsApp
SMS
Push Notifications
```

---

## Seguimiento Cliente

No existe portal de seguimiento de reparación en tiempo real.

---

# Estado Actual

Fase 1: Completa y validada.

Fase 2: Completa y validada.