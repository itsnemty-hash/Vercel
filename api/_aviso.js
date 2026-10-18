// Aviso por correo de cada solicitud nueva. Se envía desde la cuenta de Gmail
// de NEMTY a sí misma con una contraseña de aplicación (GMAIL_APP_PASSWORD).
// Nunca escribe al cliente: el único destinatario es AVISO_TO.

const nodemailer = require("nodemailer");

const GMAIL_USER = process.env.GMAIL_USER || "itsnemty@gmail.com";
const AVISO_TO = process.env.AVISO_TO || "itsnemty@gmail.com";

const LABELS = [
  ["nombre", "Nombre"],
  ["email", "Email"],
  ["whatsapp", "WhatsApp"],
  ["pais", "País"],
  ["negocio", "Negocio"],
  ["web", "Web / Instagram"],
  ["mensajes", "Mensajes al día"],
  ["agenda", "Agenda actual"],
  ["tarea", "Tarea que más tiempo quita"],
  ["presupuesto", "Presupuesto"],
  ["dias", "Días"],
  ["hora", "Hora"],
];

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

function fechaChile() {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: process.env.AGENDA_TZ || "America/Santiago",
    dateStyle: "short", timeStyle: "short",
  }).format(new Date());
}

async function enviarAviso(data) {
  const pass = (process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "");
  if (!pass) return false;

  const wa = "https://wa.me/" + data.whatsapp.replace(/\D/g, "");
  const fecha = fechaChile();
  const filas = LABELS.map(([k, label]) =>
    `<tr><td style="padding:6px 8px;color:#666;vertical-align:top">${label}</td>` +
    `<td style="padding:6px 8px">${k === "email"
      ? `<a href="mailto:${esc(data.email)}">${esc(data.email)}</a>`
      : esc(data[k])}</td></tr>`
  ).join("");

  const html =
    `<div style="font-family:Arial,sans-serif;max-width:560px">` +
    `<h2 style="margin:0 0 12px">Nueva solicitud de auditoría</h2>` +
    `<table style="border-collapse:collapse;width:100%;font-size:14px">${filas}` +
    `<tr><td style="padding:6px 8px;color:#666">Recibida</td><td style="padding:6px 8px">${esc(fecha)}</td></tr></table>` +
    `<p style="margin:18px 0"><a href="${wa}" style="background:#25D366;color:#fff;padding:10px 16px;` +
    `border-radius:6px;text-decoration:none;display:inline-block">Escribir por WhatsApp</a></p></div>`;
  const text = LABELS.map(([k, label]) => `${label}: ${data[k]}`).join("\n") +
    `\nRecibida: ${fecha}\nWhatsApp: ${wa}`;

  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass },
  });
  await transport.sendMail({
    from: `"NEMTY · Web" <${GMAIL_USER}>`,
    to: AVISO_TO,
    subject: `Nueva solicitud de auditoría: ${data.nombre} · ${data.negocio}`,
    text,
    html,
  });
  return true;
}

module.exports = { enviarAviso };
