const express = require("express");
const routes = require("./routes");

const app = express();

app.use(express.json());
app.use("/api", routes);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Concurrent Ticket Booking System API",
    endpoints: ["POST /api/book", "GET /api/seats", "GET /api/bookings"],
  });
});

module.exports = app;
