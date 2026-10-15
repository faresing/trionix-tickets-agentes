import { Router } from "express";
import Joi from "joi";
import mongoose from "mongoose";
import Ticket from "../models/Ticket.js";
import Agente from "../models/Agente.js";

const router = Router();
const idValido = (id) => mongoose.isObjectIdOrHexString(id);
const camposAgente = "nombre especialidad";

const ticketSchema = Joi.object({
  cliente: Joi.string().trim().min(2).max(100).required(),
  asunto: Joi.string().trim().min(5).max(200).required(),
  prioridad: Joi.string().valid("baja", "media", "alta").required(),
  estado: Joi.string().valid("abierto", "resuelto").optional()
});
const actualizarTicketSchema = Joi.object({
  cliente: Joi.string().trim().min(2).max(100),
  asunto: Joi.string().trim().min(5).max(200),
  prioridad: Joi.string().valid("baja", "media", "alta"),
  estado: Joi.string().valid("abierto", "resuelto")
}).min(1);
const comentarioSchema = Joi.object({
  autor: Joi.string().trim().min(2).max(100).required(),
  texto: Joi.string().trim().min(3).required()
});
const asignarSchema = Joi.object({ agenteId: Joi.string().required() });

function formatearTicket(ticket) {
  const obj = ticket.toObject ? ticket.toObject() : ticket;
  obj.agente = obj.agenteId || null;
  delete obj.agenteId;
  return obj;
}

router.get("/", async (req, res, next) => {
  try {
    const filtro = {};
    if (req.query.estado) filtro.estado = req.query.estado;
    if (req.query.prioridad) filtro.prioridad = req.query.prioridad;
    if (req.query.q) {
      const regex = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filtro.$or = [{ asunto: regex }, { cliente: regex }];
    }
    const tickets = await Ticket.find(filtro).populate("agenteId", camposAgente).sort({ createdAt: -1 });
    res.json(tickets.map(formatearTicket));
  } catch (e) { next(e); }
});

router.get("/:id", async (req, res, next) => {
  try {
    if (!idValido(req.params.id)) return res.status(400).json({ mensaje: "El ID del ticket no es válido." });
    const ticket = await Ticket.findById(req.params.id).populate("agenteId", camposAgente);
    if (!ticket) return res.status(404).json({ mensaje: "Ticket no encontrado." });
    res.json(formatearTicket(ticket));
  } catch (e) { next(e); }
});

router.post("/", async (req, res, next) => {
  try {
    const { error, value } = ticketSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ mensaje: error.details.map((x) => x.message).join("; ") });
    const ticket = await Ticket.create({
      cliente: value.cliente,
      asunto: value.asunto,
      prioridad: value.prioridad,
      estado: "abierto",
      comentarios: [],
      agenteId: null
    });
    res.status(201).json(formatearTicket(await ticket.populate("agenteId", camposAgente)));
  } catch (e) { next(e); }
});

router.put("/:id", async (req, res, next) => {
  try {
    if (!idValido(req.params.id)) return res.status(400).json({ mensaje: "El ID del ticket no es válido." });
    const { error, value } = actualizarTicketSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ mensaje: error.details.map((x) => x.message).join("; ") });
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, value, { new: true, runValidators: true })
      .populate("agenteId", camposAgente);
    if (!ticket) return res.status(404).json({ mensaje: "Ticket no encontrado." });
    res.json(formatearTicket(ticket));
  } catch (e) { next(e); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    if (!idValido(req.params.id)) return res.status(400).json({ mensaje: "El ID del ticket no es válido." });
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) return res.status(404).json({ mensaje: "Ticket no encontrado." });
    res.status(204).end();
  } catch (e) { next(e); }
});

router.post("/:id/comentarios", async (req, res, next) => {
  try {
    if (!idValido(req.params.id)) return res.status(400).json({ mensaje: "El ID del ticket no es válido." });
    const { error, value } = comentarioSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ mensaje: error.details.map((x) => x.message).join("; ") });
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { $push: { comentarios: { autor: value.autor, texto: value.texto } } },
      { new: true, runValidators: true }
    ).populate("agenteId", camposAgente);
    if (!ticket) return res.status(404).json({ mensaje: "Ticket no encontrado." });
    res.status(201).json(formatearTicket(ticket));
  } catch (e) { next(e); }
});

router.post("/:id/asignar", async (req, res, next) => {
  try {
    if (!idValido(req.params.id)) return res.status(400).json({ mensaje: "El ID del ticket no es válido." });
    const { error, value } = asignarSchema.validate(req.body);
    if (error) return res.status(400).json({ mensaje: "Debes enviar agenteId." });
    if (!idValido(value.agenteId)) return res.status(400).json({ mensaje: "El ID del agente no es válido." });

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ mensaje: "Ticket no encontrado." });

    const agente = await Agente.findById(value.agenteId);
    if (!agente) return res.status(404).json({ mensaje: "Agente no encontrado." });
    if (!agente.activo) return res.status(400).json({ mensaje: "No se puede asignar un agente inactivo." });

    ticket.agenteId = agente._id;
    await ticket.save();
    await ticket.populate("agenteId", camposAgente);
    res.status(200).json(formatearTicket(ticket));
  } catch (e) { next(e); }
});

export default router;