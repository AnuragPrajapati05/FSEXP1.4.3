const { v4: uuidv4 } = require("uuid");
const redisClient = require("./redisClient");
const {
  normalizeSeat,
  isSeatBooked,
  acquireSeatLock,
  releaseSeatLock,
  bookSeat,
  getRemainingSeats,
  getAllSeatsStatus,
} = require("./seatManager");

async function createBooking(req, res) {
  const { user, seat } = req.body || {};
  const seatNumber = normalizeSeat(seat);

  if (!user || typeof user !== "string" || !seatNumber) {
    return res.status(400).json({
      success: false,
      message: "Invalid payload. Expected { user: string, seat: 1..100 }",
    });
  }

  const bookingId = uuidv4();
  let locked = false;

  try {
    const alreadyBooked = await isSeatBooked(seatNumber);
    if (alreadyBooked) {
      return res.status(409).json({
        success: false,
        message: `Seat ${seatNumber} is already booked`,
      });
    }

    locked = await acquireSeatLock(seatNumber);
    if (!locked) {
      return res.status(409).json({
        success: false,
        message: `Seat ${seatNumber} is locked by another booking request`,
      });
    }

    const bookedAfterLock = await isSeatBooked(seatNumber);
    if (bookedAfterLock) {
      return res.status(409).json({
        success: false,
        message: `Seat ${seatNumber} is already booked`,
      });
    }

    const remaining = await bookSeat(seatNumber, bookingId);

    await redisClient.hset(
      "bookings",
      bookingId,
      JSON.stringify({
        bookingId,
        user,
        seat: seatNumber,
        timestamp: new Date().toISOString(),
      })
    );

    const payload = {
      success: true,
      bookingId,
      remaining,
    };

    console.log("POST /api/book 200");
    console.log(JSON.stringify(payload, null, 2));

    return res.status(200).json(payload);
  } catch (error) {
    console.error("Booking error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  } finally {
    if (locked) {
      await releaseSeatLock(seatNumber);
    }
  }
}

async function listSeats(req, res) {
  try {
    const seats = await getAllSeatsStatus();
    return res.status(200).json(seats);
  } catch (error) {
    console.error("Seat list error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function listBookings(req, res) {
  try {
    const bookingsRaw = await redisClient.hgetall("bookings");
    const bookings = Object.values(bookingsRaw).map((item) => JSON.parse(item));
    const remaining = await getRemainingSeats();
    return res.status(200).json({
      total: bookings.length,
      remaining,
      bookings,
    });
  } catch (error) {
    console.error("Booking list error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = {
  createBooking,
  listSeats,
  listBookings,
};
