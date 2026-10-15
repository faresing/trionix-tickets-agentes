import "dotenv/config";
import mongoose from "mongoose";
import { conectarDB } from "./db.js";
import Ticket from "./models/Ticket.js";
import Agente from "./models/Agente.js";

await conectarDB();
const agentesExistentes = await Agente.countDocuments();
if (agentesExistentes === 0) {
  const agentes = await Agente.create([
    { nombre: "María Torres", email: "maria@trionix.demo", especialidad: "software" },
    { nombre: "Andrés Pérez", email: "andres@trionix.demo", especialidad: "redes" },
    { nombre: "Laura Díaz", email: "laura@trionix.demo", especialidad: "hardware" }
  ]);
  await Ticket.create([
    { cliente: "Empresa Nova", asunto: "No funciona el acceso al sistema", prioridad: "alta", agenteId: agentes[0]._id },
    { cliente: "Carlos Ruiz", asunto: "Problema de conexión a la red", prioridad: "media", agenteId: agentes[1]._id },
    { cliente: "Oficina Central", asunto: "Instalación de actualización", prioridad: "baja" }
  ]);
  console.log("Datos de prueba creados.");
} else {
  console.log("Ya existen agentes; no se insertaron datos de prueba.");
}
await mongoose.disconnect();