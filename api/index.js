const app = require("../app");
const { initializeSeatState } = require("../seatManager");

let initialized = false;

module.exports = async (req, res) => {
  if (!initialized) {
    await initializeSeatState();
    initialized = true;
  }

  return app(req, res);
};
