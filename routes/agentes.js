import { Router } from "express";
import Joi from "joi";
import mongoose from "mongoose";
import Agente from "../models/Agente.js";
import Ticket from "../models/Ticket.js";

const router = Router();
const idValido = (id) => mongoose.isObjectIdOrHexString(id);

const agenteSchema = Joi.object({
  nombre: Joi.string().trim().min(3).max(100).required(),
  email: Joi.string().trim().email().lowercase().required(),
  especialidad: Joi.string().valid("redes", "software", "hardware", "general").required(),
  activo: Joi.boolean().optional()
});
const actualizarSchema = Joi.object({
  nombre: Joi.string().trim().min(3).max(100),
  email: Joi.string().trim().email().lowercase(),
  especialidad: Joi.string().valid("redes", "software", "hardware", "general"),
  activo: Joi.boolean()
}).min(1);

// Rutas literales ANTES de "/:id"
router.get("/stats", async (req, res, next) => {
  try {
    const datos = await Agente.aggregate([
      { $lookup: { from: "tickets", localField: "_id", foreignField: "agenteId", as: "tickets" } },
      {
        $project: {
          nombre: 1, email: 1, especialidad: 1, activo: 1,
          abiertos: { $size: { $filter: { input: "$tickets", as: "t", cond: { $eq: ["$$t.estado", "abierto"] } } } },
          resueltos: { $size: { $filter: { input: "$tickets", as: "t", cond: { $eq: ["$$t.estado", "resuelto"] } } } }
        }
      }
    ]);
    res.json(datos);
  } catch (e) { next(e); }
});

router.get("/", async (req, res, next) => {
  try {
    const filtro = {};
    if (req.query.especialidad) filtro.especialidad = req.query.especialidad;
    if (req.query.activo !== undefined) filtro.activo = req.query.activo === "true";
    res.json(await Agente.find(filtro).sort({ nombre: 1 }));
  } catch (e) { next(e); }
});

router.get("/:id/tickets", async (req, res, next) => {
  try {
    if (!idValido(req.params.id)) return res.status(400).json({ mensaje: "El ID del agente no es válido." });
    const agente = await Agente.findById(req.params.id);
    if (!agente) return res.status(404).json({ mensaje: "Agente no encontrado." });
    const tickets = await Ticket.find({ agenteId: agente._id }).populate("agenteId", "nombre especialidad");
    res.json(tickets.map((t) => {
      const obj = t.toObject();
      obj.agente = obj.agenteId || null;
      delete obj.agenteId;
      return obj;
    }));
  } catch (e) { next(e); }
});

router.get("/:id", async (req, res, next) => {
  try {
    if (!idValido(req.params.id)) return res.status(400).json({ mensaje: "El ID del agente no es válido." });
    const agente = await Agente.findById(req.params.id);
    if (!agente) return res.status(404).json({ mensaje: "Agente no encontrado." });
    res.json(agente);
  } catch (e) { next(e); }
});

router.post("/", async (req, res, next) => {
  try {
    const { error, value } = agenteSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ mensaje: error.details.map((x) => x.message).join("; ") });
    const agente = await Agente.create({ ...value, activo: value.activo ?? true });
    res.status(201).json(agente);
  } catch (e) { next(e); } // el error 11000 (correo duplicado) lo traduce app.js
});

router.put("/:id", async (req, res, next) => {
  try {
    if (!idValido(req.params.id)) return res.status(400).json({ mensaje: "El ID del agente no es válido." });
    const { error, value } = actualizarSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ mensaje: error.details.map((x) => x.message).join("; ") });
    const agente = await Agente.findByIdAndUpdate(req.params.id, value, { new: true, runValidators: true });
    if (!agente) return res.status(404).json({ mensaje: "Agente no encontrado." });
    res.json(agente);
  } catch (e) { next(e); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    if (!idValido(req.params.id)) return res.status(400).json({ mensaje: "El ID del agente no es válido." });
    const agente = await Agente.findById(req.params.id);
    if (!agente) return res.status(404).json({ mensaje: "Agente no encontrado." });
    const abiertos = await Ticket.countDocuments({ agenteId: agente._id, estado: "abierto" });
    if (abiertos > 0) {
      return res.status(409).json({ mensaje: "No se puede eliminar: el agente tiene tickets abiertos asignados." });
    }
    await Agente.findByIdAndDelete(agente._id);
    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;