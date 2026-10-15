import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { conectarDB } from "./db.js";
import Agente from "./models/Agente.js";
import Ticket from "./models/Ticket.js";
import ticketsRouter from "./routes/tickets.js";
import agentesRouter from "./routes/agentes.js";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api", (req, res) => res.json({ mensaje: "API Trionix Tickets funcionando" }));
app.use("/api/tickets", ticketsRouter);
app.use("/api/agentes", agentesRouter);

app.use((req, res) => res.status(404).json({ mensaje: "Ruta no encontrada." }));

app.use((err, req, res, next) => {
  if (err.code === 11000) {
    return res.status(400).json({ mensaje: "Ese correo ya está registrado. Usa uno diferente." });
  }
  if (err.name === "ValidationError") {
    return res.status(400).json({
      mensaje: "Datos no válidos: " + Object.values(err.errors).map((e) => e.message).join(", "),
    });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ mensaje: "El ID no tiene un formato válido." });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ mensaje: "El JSON enviado está mal formado." });
  }
  console.error(err);
  res.status(500).json({ mensaje: "Ocurrió un error interno." });
});

const PORT = process.env.PORT || 3000;
try {
  await conectarDB();
  await Promise.all([Agente.init(), Ticket.init()]); // crea índices (unique de email) también en Atlas
  app.listen(PORT, "0.0.0.0", () => console.log(`Servidor listo en puerto ${PORT}`));
} catch (error) {
  console.error("No se pudo iniciar la aplicación:", error.message);
  process.exit(1);
}