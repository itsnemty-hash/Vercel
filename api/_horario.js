// Horario de videollamadas. La zona horaria de referencia vive solo en el
// servidor: el navegador recibe instantes en UTC y los muestra en la hora
// local del visitante.

const AGENDA_TZ = process.env.AGENDA_TZ || "America/Santiago";
const HOURS = [11, 12, 13, 14, 15, 16, 17, 18];

// Desfase (minutos) de una zona horaria respecto a UTC en un instante dado.
function tzOffset(date, tz) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(date);
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  return (asUtc - date.getTime()) / 60000;
}

// Instante real de "hoy a las H:00" en la zona de la agenda.
function hourToDate(hour, now = new Date()) {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", {
    timeZone: AGENDA_TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now).split("-");
  const guess = Date.UTC(+y, +m - 1, +d, hour, 0, 0);
  const off = tzOffset(new Date(guess), AGENDA_TZ);
  let date = new Date(guess - off * 60000);
  const off2 = tzOffset(date, AGENDA_TZ);
  if (off2 !== off) date = new Date(guess - off2 * 60000);
  return date;
}

function slots() {
  return HOURS.map((h) => hourToDate(h).toISOString());
}

// "HH:MM" de un instante en la zona de la agenda, o "" si no es válido.
function agendaHour(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: AGENDA_TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(date);
}

module.exports = { slots, agendaHour };
