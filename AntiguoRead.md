Agenda2
Descripción
Agenda2 es una plataforma de gestión de servicios técnicos con autenticación basada en JWT, control de roles y arquitectura monorepo.

Arquitectura
Monorepo
apps/api
apps/web
Levantar Proyecto
Backend:
cd apps/api
pnpm start:dev

DB:
cd apps/api
pnpm prisma studio

Frontend:
cd apps/web
pnpm dev
Stack
Backend
NestJS
TypeScript
Prisma
PostgreSQL
JWT
bcrypt
Frontend
React
Vite
TypeScript
React Router
Instalación
Instalar dependencias
pnpm install
Variables de entorno
Backend
Archivo:

apps/api/.env
Variables requeridas:

DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_IN=
JWT_REFRESH_EXPIRES_IN=
Ejecutar proyecto
Backend
cd apps/api
pnpm start:dev
Frontend
cd apps/web
pnpm dev
Sistema de autenticación
La aplicación utiliza:

Access Token JWT
Refresh Token JWT
Refresh automático frontend
Logout invalidando refresh token
Persistencia de sesión
Flujo Auth
Login
POST /auth/login
Retorna:

{
  "accessToken": "",
  "refreshToken": ""
}
Refresh
POST /auth/refresh
Genera nuevos tokens.

Logout
POST /auth/logout
Invalida el refresh token almacenado.

Usuario autenticado
GET /auth/me
Retorna usuario autenticado actual.

Roles
Roles disponibles:

SUPER_ADMIN
ADMIN
WORKER
CLIENT
Jerarquía:

SUPER_ADMIN > ADMIN > WORKER > CLIENT
Reglas de negocio
Los usuarios registrados entran como CLIENT.
Solo SUPER_ADMIN puede cambiar roles.
Un usuario no puede cambiar su propio rol.
No se puede eliminar el último SUPER_ADMIN.
Logout invalida refresh token.
Passwords se almacenan hasheadas con bcrypt.
Endpoints principales
Auth
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/me
Users
GET    /users
GET    /users/:id
PATCH  /users/:id/role
DELETE /users/:id
PATCH  /users/me
Frontend
Rutas principales
/login
/register
/admin
/worker
/client
Seguridad implementada
JWT authentication
Refresh token rotation
Guards
RBAC
Password hashing
DTO validation
ValidationPipe global
Protected routes frontend
Auto refresh frontend
Estado actual
Backend
Base auth y gestión de usuarios operativa.

Frontend
Sistema de sesión y protección de rutas operativos.

Pendiente
Reservas
Calendario
Servicios
Productos
Chatbot
Pagos
Notificaciones

#Alejandra

Cambios agregados
Se mantuvo la autenticación existente con JWT, refresh token, guards y roles.

Se agregó el módulo de servicios:

Modelo Prisma Service.
CRUD backend protegido por roles.
Página frontend /servicios.
Conexión usando apiFetch().
Se agregó el módulo de productos:

Modelo Prisma Product.
CRUD backend protegido por roles.
Página frontend /productos.
Conexión usando apiFetch().
Se ajustaron rutas protegidas del frontend:

/admin
/users
/servicios
/productos
/worker
/client
Se agregaron links en el navbar para gestión administrativa.

Se usaron DTOs con validaciones para crear y actualizar servicios/product