# Trionix Tickets — Sistema de soporte con agentes

Aplicación académica de gestión de tickets de soporte desarrollada con Node.js, Express, Joi, MongoDB y Mongoose. Incluye interfaz HTML/CSS/JavaScript, comentarios embebidos y asignación de agentes mediante referencias ObjectId.

## Requisitos
- Node.js LTS
- Cuenta de MongoDB Atlas o instancia MongoDB accesible

## Instalación local
1. Clonar el repositorio y entrar a la carpeta.
2. Instalar dependencias: `npm install`
3. Copiar `.env.example` como `.env` y configurar `MONGODB_URI`.
4. Ejecutar: `npm start`
5. Abrir `http://localhost:3000`

Opcional: `npm run seed` crea datos de demostración si aún no hay agentes.

## Variables de entorno
- `PORT`: puerto HTTP (por defecto 3000).
- `MONGODB_URI`: cadena de conexión a MongoDB Atlas. No compartir su valor real.

## Endpoints principales
### Tickets
- `GET /api/tickets` admite `?estado=`, `?prioridad=` y `?q=`.
- `GET /api/tickets/:id`
- `POST /api/tickets`
- `PUT /api/tickets/:id`
- `DELETE /api/tickets/:id`
- `POST /api/tickets/:id/comentarios`
- `POST /api/tickets/:id/asignar`

### Agentes
- `GET /api/agentes` admite `?especialidad=` y `?activo=`.
- `GET /api/agentes/:id`
- `POST /api/agentes`
- `PUT /api/agentes/:id`
- `DELETE /api/agentes/:id`
- `GET /api/agentes/:id/tickets`
- `GET /api/agentes/stats`

Las respuestas de tickets usan el campo `agente` con los datos básicos resueltos mediante `populate()`.

## Despliegue
Desplegar como Web Service de Node en Render (Build Command: `npm install`, Start Command: `npm start`) y configurar `MONGODB_URI` en Environment. La URL pública debe añadirse aquí después del despliegue.

**URL pública:** pendiente de despliegue.

## Bonus implementados
- Búsqueda de tickets por texto con `?q=`.
- Estadísticas por agente con `$lookup`.
- Índice sobre `tickets.agenteId`.
