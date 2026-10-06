const { slots } = require("./_horario");

module.exports = function handler(req, res) {
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
  res.status(200).json({ slots: slots() });
};
