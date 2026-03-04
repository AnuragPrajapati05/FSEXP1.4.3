const express = require("express");
const { createBooking, listSeats, listBookings } = require("./bookingController");

const router = express.Router();

router.post("/book", createBooking);
router.get("/seats", listSeats);
router.get("/bookings", listBookings);

module.exports = router;
