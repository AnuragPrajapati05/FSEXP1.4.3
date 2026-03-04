const app = require("./app");
const { initializeSeatState } = require("./seatManager");

const PORT = Number(process.env.PORT) || 3000;

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
