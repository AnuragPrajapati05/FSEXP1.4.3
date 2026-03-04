const redisClient = require("./redisClient");

const TOTAL_SEATS = 100;
const LOCK_TTL_SECONDS = 5;

function seatKey(seatNumber) {
  return `seat:${seatNumber}`;
}

function lockKey(seatNumber) {
  return `seat_lock:${seatNumber}`;
}

function normalizeSeat(seatInput) {
  const seatNumber = Number(seatInput);

  if (!Number.isInteger(seatNumber) || seatNumber < 1 || seatNumber > TOTAL_SEATS) {
    return null;
  }

  return seatNumber;
}

async function isSeatBooked(seatNumber) {
  const value = await redisClient.get(seatKey(seatNumber));
  return value === "booked";
}

async function acquireSeatLock(seatNumber) {
  const result = await redisClient.set(lockKey(seatNumber), "locked", "NX", "EX", LOCK_TTL_SECONDS);
  return result === "OK";
}

async function releaseSeatLock(seatNumber) {
  await redisClient.del(lockKey(seatNumber));
}

async function bookSeat(seatNumber, bookingId) {
  const tx = redisClient.multi();
  tx.set(seatKey(seatNumber), "booked");
  tx.sadd("booked_seats", String(seatNumber));
  tx.hset("booking_by_seat", String(seatNumber), bookingId);
  tx.decr("remaining_seats");
  const results = await tx.exec();
  return Number(results[3][1]);
}

async function initializeSeatState() {
  const initialized = await redisClient.get("seats_initialized");
  if (!initialized) {
    const tx = redisClient.multi();
    tx.set("remaining_seats", TOTAL_SEATS);
    tx.set("seats_initialized", "1");
    await tx.exec();
  }
}

async function getRemainingSeats() {
  const remaining = await redisClient.get("remaining_seats");
  return remaining ? Number(remaining) : TOTAL_SEATS;
}

async function getAllSeatsStatus() {
  const booked = await redisClient.smembers("booked_seats");
  const bookedSet = new Set(booked.map((item) => Number(item)));

  const seats = [];
  for (let seat = 1; seat <= TOTAL_SEATS; seat += 1) {
    seats.push({
      seat,
      status: bookedSet.has(seat) ? "booked" : "available",
    });
  }

  return seats;
}

module.exports = {
  TOTAL_SEATS,
  normalizeSeat,
  isSeatBooked,
  acquireSeatLock,
  releaseSeatLock,
  bookSeat,
  initializeSeatState,
  getRemainingSeats,
  getAllSeatsStatus,
};
