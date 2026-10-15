# Trionix Tickets: Sistema de soporte con agentes

**Estudiante:** Fares Acosta
**Asignatura:** Electiva Profesional Web Avanzada
**Actividad:** Parcial Segundo Corte
**Docente:** Rafael Pérez Meriño

Aplicación web de gestión de tickets de soporte técnico para la empresa ficticia Trionix Labs. Permite registrar los tickets que reportan los clientes, llevar un registro de los agentes de soporte y asignar un agente a cada ticket, todo desde una interfaz que funciona sin recargar la página.

## Enlaces

- **Aplicación desplegada:** https://trionix-tickets-agentes-y2hi.onrender.com
- **Repositorio:** https://github.com/faresing/trionix-tickets-agentes

> La aplicación está en el plan gratuito de Render. Si estaba inactiva, la primera carga puede tardar cerca de 50 segundos.

## Qué hace el proyecto

- Crea, lista, actualiza y elimina tickets, con filtros por estado y prioridad y búsqueda por texto.
- Permite agregar comentarios a cada ticket (embebidos en el propio documento).
- Crea, lista, actualiza y elimina agentes de soporte, con especialidad y estado activo o inactivo.
- Asigna un agente a un ticket, validando que ambos existan y que el agente esté activo.
- Muestra en cada ticket el agente asignado ya resuelto (nombre y especialidad), sin peticiones adicionales desde el frontend.
- Muestra los errores de la API (400, 404, 409) como mensajes legibles en pantalla.

## Tecnologías

- **Servidor:** Node.js + Express 4
- **Validación de entrada:** Joi
- **Base de datos:** MongoDB Atlas + Mongoose (colecciones `tickets` y `agentes`, relacionadas por `ObjectId`)
- **Frontend:** HTML, CSS y JavaScript plano, servido con `express.static` y consumiendo la API con `fetch`
- **Despliegue:** Render, con MongoDB Atlas como base de datos en producción

## Capturas de evidencia

### Aplicación funcionando en producción
![Aplicación en producción] <img width="1338" height="609" alt="1-app-produccion png" src="https://github.com/user-attachments/assets/b23c5235-3e8c-4d52-94ca-7b144d90f716" />


### Colección `agentes` en MongoDB Atlas
![Colección agentes en Atlas]
<img width="1304" height="357" alt="2-atlas-agentes png" src="https://github.com/user-attachments/assets/3c9a2b3c-98d8-4e9c-b10c-38ab9e91ab2a" />


### Colección `tickets` en MongoDB Atlas (con `agenteId` asignado)
![Colección tickets en Atlas]
<img width="1342" height="559" alt="Captura3" src="https://github.com/user-attachments/assets/8abbe2ee-4bcc-4950-8761-e5c0e930a366" />



### Respuesta de la API con el agente resuelto
![API con agente resuelto]
<img width="1366" height="265" alt="4-api-agente-resuelto png" src="https://github.com/user-attachments/assets/3dcbc206-fcb6-49d5-85ab-40d649641b8a" />


## Instalación local

1. Clonar el repositorio y entrar a la carpeta del proyecto.
2. Instalar dependencias: `npm install`
3. Copiar `.env.example` como `.env` y configurar `MONGODB_URI`.
4. Iniciar el servidor: `npm start`
5. Abrir `http://localhost:3000`

Opcional: `npm run seed` crea datos de demostración si todavía no hay agentes.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `MONGODB_URI` | Cadena de conexión a MongoDB Atlas (obligatoria). No compartir su valor real. |
| `PORT` | Puerto HTTP (opcional; por defecto 3000, Render lo asigna solo). |

Ninguna credencial vive en el código ni en el repositorio: `.env` está en `.gitignore`.

## Endpoints

### Tickets

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/tickets` | Lista tickets (`?estado=`, `?prioridad=`, `?q=`) |
| GET | `/api/tickets/:id` | Un ticket con el agente resuelto |
| POST | `/api/tickets` | Crea un ticket (siempre nace `abierto`) |
| PUT | `/api/tickets/:id` | Actualiza un ticket |
| DELETE | `/api/tickets/:id` | Elimina un ticket |
| POST | `/api/tickets/:id/comentarios` | Agrega un comentario embebido |
| POST | `/api/tickets/:id/asignar` | Asigna un agente con `{ "agenteId": "<id>" }` |

### Agentes

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/agentes` | Lista agentes (`?especialidad=`, `?activo=`) |
| GET | `/api/agentes/stats` | Tickets abiertos y resueltos por agente |
| GET | `/api/agentes/:id` | Un agente por id |
| GET | `/api/agentes/:id/tickets` | Tickets asignados a ese agente |
| POST | `/api/agentes` | Crea un agente |
| PUT | `/api/agentes/:id` | Actualiza un agente |
| DELETE | `/api/agentes/:id` | Elimina un agente (409 si tiene tickets abiertos) |

Las respuestas de tickets incluyen el campo `agente` (con `nombre` y `especialidad`, o `null` si no hay nadie asignado), resuelto con `populate()`.

## Manejo de errores

- **400:** datos inválidos (Joi), id sin formato de ObjectId, agente inactivo al asignar, o correo duplicado (el error `11000` de MongoDB se traduce a un mensaje legible).
- **404:** ticket o agente inexistente.
- **409:** intento de eliminar un agente con tickets abiertos asignados.

## Despliegue

La aplicación corre como Web Service de Node en Render (Build Command: `npm install`, Start Command: `npm start`). La variable `MONGODB_URI` se configura en el panel de Environment de Render, nunca en el repositorio. El índice `unique` de `agentes.email` se crea al arrancar la aplicación con `Model.init()`, por lo que también queda creado en la base de producción.

## Bonus implementados

- **Estadísticas por agente:** `GET /api/agentes/stats` cuenta tickets abiertos y resueltos por agente usando una agregación con `$lookup`.
- **Búsqueda de tickets:** `GET /api/tickets?q=texto` busca con `$regex` sobre asunto y cliente.
- **Índice sobre `tickets.agenteId`:** acelera `GET /api/agentes/:id/tickets`, el conteo de tickets abiertos al eliminar un agente y el `$lookup` de `/stats`, porque todas esas consultas filtran por `agenteId`.
