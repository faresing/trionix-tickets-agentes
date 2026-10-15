const $ = (s) => document.querySelector(s);
let agentes = [];

const esc = (t) =>
  String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function aviso(texto, tipo = "error") {
  const m = $("#msg");
  m.textContent = texto;
  m.className = "msg " + tipo;
  m.hidden = false;
  clearTimeout(aviso.t);
  aviso.t = setTimeout(() => (m.hidden = true), 5000);
}

async function api(url, opciones = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...opciones,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.mensaje || data.error || `Error ${res.status}`);
  return data;
}

async function cargarAgentes() {
  agentes = await api("/api/agentes");
  $("#lista-agentes").innerHTML =
    agentes
      .map(
        (a) =>
          `<li class="${a.activo ? "" : "inactivo"}">${esc(a.nombre)} — ${esc(a.especialidad)}${a.activo ? "" : " (inactivo)"}</li>`
      )
      .join("") || "<li>Sin agentes</li>";
}

async function cargarTickets() {
  const params = new URLSearchParams();
  if ($("#f-estado").value) params.set("estado", $("#f-estado").value);
  if ($("#f-prioridad").value) params.set("prioridad", $("#f-prioridad").value);
  const tickets = await api("/api/tickets?" + params);
  $("#lista-tickets").innerHTML = tickets.map(tarjeta).join("") || "<p>No hay tickets.</p>";
}

function tarjeta(t) {
  const opciones = agentes
    .filter((a) => a.activo)
    .map(
      (a) =>
        `<option value="${a._id}" ${t.agente?._id === a._id ? "selected" : ""}>${esc(a.nombre)} (${esc(a.especialidad)})</option>`
    )
    .join("");
  const comentarios = (t.comentarios || [])
    .map((c) => `<li><b>${esc(c.autor)}:</b> ${esc(c.texto)}</li>`)
    .join("");
  return `
  <div class="ticket" data-id="${t._id}" data-cliente="${esc(t.cliente)}" data-asunto="${esc(t.asunto)}" data-prioridad="${t.prioridad}">
    <h3>${esc(t.asunto)}</h3>
    <div>
      <span class="badge ${t.prioridad}">${t.prioridad}</span>
      <span class="badge ${t.estado}">${t.estado}</span>
      · Cliente: ${esc(t.cliente)}
      · Agente: <b>${t.agente ? esc(t.agente.nombre) : "Sin asignar"}</b>
    </div>
    ${comentarios ? `<ul class="comentarios">${comentarios}</ul>` : ""}
    <div class="acciones">
      <select class="sel-agente"><option value="">Asignar agente…</option>${opciones}</select>
      <button data-accion="asignar">Asignar</button>
      ${t.estado === "abierto" ? '<button class="verde" data-accion="resolver">Resolver</button>' : ""}
      <button class="rojo" data-accion="eliminar">Eliminar</button>
    </div>
    <div class="form-com">
      <input class="c-autor" placeholder="Autor" />
      <input class="c-texto" placeholder="Comentario" />
      <button data-accion="comentar">+</button>
    </div>
  </div>`;
}

$("#lista-tickets").addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-accion]");
  if (!btn) return;
  const card = btn.closest(".ticket");
  const id = card.dataset.id;
  try {
    switch (btn.dataset.accion) {
      case "asignar": {
        const agenteId = card.querySelector(".sel-agente").value;
        if (!agenteId) return aviso("Selecciona un agente primero.");
        await api(`/api/tickets/${id}/asignar`, { method: "POST", body: JSON.stringify({ agenteId }) });
        aviso("Agente asignado.", "ok");
        break;
      }
      case "resolver":
        await api(`/api/tickets/${id}`, {
          method: "PUT",
          body: JSON.stringify({
            cliente: card.dataset.cliente,
            asunto: card.dataset.asunto,
            prioridad: card.dataset.prioridad,
            estado: "resuelto",
          }),
        });
        aviso("Ticket resuelto.", "ok");
        break;
      case "eliminar":
        if (!confirm("¿Eliminar este ticket?")) return;
        await api(`/api/tickets/${id}`, { method: "DELETE" });
        aviso("Ticket eliminado.", "ok");
        break;
      case "comentar":
        await api(`/api/tickets/${id}/comentarios`, {
          method: "POST",
          body: JSON.stringify({
            autor: card.querySelector(".c-autor").value,
            texto: card.querySelector(".c-texto").value,
          }),
        });
        aviso("Comentario agregado.", "ok");
        break;
    }
    await cargarTickets();
  } catch (err) {
    aviso(err.message);
  }
});

$("#form-ticket").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await api("/api/tickets", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
    e.target.reset();
    aviso("Ticket creado.", "ok");
    await cargarTickets();
  } catch (err) {
    aviso(err.message);
  }
});

$("#form-agente").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await api("/api/agentes", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
    e.target.reset();
    aviso("Agente creado.", "ok");
    await cargarAgentes();
    await cargarTickets();
  } catch (err) {
    aviso(err.message);
  }
});

$("#f-estado").addEventListener("change", () => cargarTickets().catch((e) => aviso(e.message)));
$("#f-prioridad").addEventListener("change", () => cargarTickets().catch((e) => aviso(e.message)));

(async () => {
  try {
    await cargarAgentes();
    await cargarTickets();
  } catch (err) {
    aviso(err.message);
  }
})();