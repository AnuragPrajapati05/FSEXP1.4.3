class InMemoryRedis {
  constructor() {
    this.kv = new Map();
    this.sets = new Map();
    this.hashes = new Map();
    this.ttlTimers = new Map();
  }

  on() {
    // Compatibility no-op for ioredis event listeners.
  }

  async get(key) {
    const value = this.kv.get(key);
    return value === undefined ? null : value;
  }

  async set(key, value, mode, exMode, exSeconds) {
    if (mode === "NX" && this.kv.has(key)) {
      return null;
    }

    this.kv.set(key, String(value));

    if (exMode === "EX" && Number.isInteger(Number(exSeconds)) && Number(exSeconds) > 0) {
      if (this.ttlTimers.has(key)) {
        clearTimeout(this.ttlTimers.get(key));
      }

      const timer = setTimeout(() => {
        this.kv.delete(key);
        this.ttlTimers.delete(key);
      }, Number(exSeconds) * 1000);

      this.ttlTimers.set(key, timer);
    }

    return "OK";
  }

  async del(key) {
    const existed = this.kv.delete(key);
    if (this.ttlTimers.has(key)) {
      clearTimeout(this.ttlTimers.get(key));
      this.ttlTimers.delete(key);
    }
    return existed ? 1 : 0;
  }

  async sadd(key, member) {
    if (!this.sets.has(key)) {
      this.sets.set(key, new Set());
    }
    this.sets.get(key).add(String(member));
    return 1;
  }

  async smembers(key) {
    return Array.from(this.sets.get(key) || []);
  }

  async hset(key, field, value) {
    if (!this.hashes.has(key)) {
      this.hashes.set(key, new Map());
    }
    this.hashes.get(key).set(String(field), String(value));
    return 1;
  }

  async hgetall(key) {
    const map = this.hashes.get(key) || new Map();
    const output = {};
    for (const [k, v] of map.entries()) {
      output[k] = v;
    }
    return output;
  }

  async decr(key) {
    const current = Number(this.kv.get(key) || "0");
    const next = current - 1;
    this.kv.set(key, String(next));
    return next;
  }

  multi() {
    const operations = [];
    const runAndWrap = (fn) => {
      operations.push(fn);
      return this;
    };

    return {
      set: (key, value, mode, exMode, exSeconds) => runAndWrap(() => this.set(key, value, mode, exMode, exSeconds)),
      sadd: (key, member) => runAndWrap(() => this.sadd(key, member)),
      hset: (key, field, value) => runAndWrap(() => this.hset(key, field, value)),
      decr: (key) => runAndWrap(() => this.decr(key)),
      exec: async () => {
        const results = [];
        for (const op of operations) {
          const value = await op();
          results.push([null, value]);
        }
        return results;
      },
    };
  }
}

let redisClient;

if (process.env.REDIS_URL) {
  const Redis = require("ioredis");
  redisClient = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
  });

  redisClient.on("connect", () => {
    console.log("Redis connected");
  });

  redisClient.on("error", (error) => {
    console.error("Redis error:", error.message);
  });
} else {
  redisClient = new InMemoryRedis();
  console.warn("REDIS_URL not set. Using in-memory store fallback (non-persistent).");
}

module.exports = redisClient;
