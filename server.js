const express = require("express");
const routes = require("./routes");
const { initializeSeatState } = require("./seatManager");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use("/api", routes);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Concurrent Ticket Booking System API",
    endpoints: ["POST /api/book", "GET /api/seats", "GET /api/bookings"],
  });
});

async function startServer() {
  try {
    await initializeSeatState();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
