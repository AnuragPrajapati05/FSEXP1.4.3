const Redis = require("ioredis");

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

redisClient.on("connect", () => {
  console.log("Redis connected");
});

redisClient.on("error", (error) => {
  console.error("Redis error:", error.message);
});

module.exports = redisClient;

