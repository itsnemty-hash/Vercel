// Recibe la solicitud del formulario y la reenvía al webhook de Make.
// Al ir de servidor a servidor no hay problemas de CORS y la URL del webhook
// no queda expuesta en el navegador.

const { agendaHour } = require("./_horario");

const MAKE_WEBHOOK_URL =
  process.env.MAKE_WEBHOOK_URL ||
  "https://hook.us2.make.com/lk3jojw1zqm0u7mmxgjx6kpiqejae7wa";

const FIELDS = {
  nombre: 120,
  email: 160,
  whatsapp: 30,
  pais: 40,
  negocio: 160,
  web: 200,
  mensajes: 40,
  agenda: 60,
  tarea: 1500,
  presupuesto: 40,
  dias: 80,
  hora: 120,
};
const REQUIRED = Object.keys(FIELDS);

function clean(value, max) {
  return String(value == null ? "" : value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Método no permitido" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = null; }
  }
  if (!body || typeof body !== "object") {
    return res.status(400).json({ ok: false, error: "Solicitud no válida" });
  }

  // Campo anti-spam: los bots lo rellenan, las personas no lo ven.
  if (clean(body.empresa_web, 200)) {
    return res.status(200).json({ ok: true });
  }

  const data = {};
  for (const [name, max] of Object.entries(FIELDS)) data[name] = clean(body[name], max);

  // El navegador envía el instante elegido; aquí se pasa a la hora de la agenda
  // y se anota la hora local del cliente como referencia.
  const hora = agendaHour(clean(body.hora, 40));
  const horaLocal = clean(body.hora_local, 10);
  const zonaCliente = clean(body.zona, 60);
  data.hora = hora && horaLocal && horaLocal !== hora
    ? `${hora} (cliente: ${horaLocal}${zonaCliente ? ", " + zonaCliente : ""})`
    : hora;

  const missing = REQUIRED.filter((name) => !data[name]);
  if (missing.length || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) {
    return res.status(400).json({ ok: false, error: "Faltan datos", fields: missing });
  }

  try {
    const response = await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error("Make respondió", response.status, text.slice(0, 300));
      return res.status(502).json({ ok: false, error: "No se pudo registrar la solicitud" });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Error al contactar con Make:", err);
    return res.status(502).json({ ok: false, error: "No se pudo registrar la solicitud" });
  }
};
