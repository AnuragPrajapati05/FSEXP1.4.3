# Concurrent Ticket Booking System (FSEXP1.4.3)

## Experiment Aim
To create a concurrent ticket booking system with seat locking using Redis, preventing double booking under simultaneous requests.

## Technology Stack
- Node.js 18+
- Express.js
- Redis
- Artillery (load testing)
- Docker / Docker Compose

## System Architecture
- **Express API server** handles booking, seat status, and booking history endpoints.
- **Redis** stores seat states, booking records, and lock keys.
- **Redis lock key** format: `seat_lock:<seat_number>`.
- **Seat capacity** fixed at 100.

Flow:
1. Client requests `POST /api/book`.
2. Server checks seat availability.
3. Server tries Redis lock (`SET seat_lock:<seat> locked NX EX 5`).
4. If lock fails, request is rejected.
5. If lock succeeds, booking is saved.
6. Lock is released.

## Redis Locking Explanation
Each booking request attempts to lock a seat using:
- `NX` to ensure the lock is created only if not already present.
- `EX` to auto-expire stale locks.

This prevents race conditions and double booking when many users attempt the same seat simultaneously.

## API Documentation
Base URL: `http://localhost:3000`

### 1) Book a seat
`POST /api/book`

Request:
```json
{
  "user": "user123",
  "seat": 45
}
```

Success response:
```json
{
  "success": true,
  "bookingId": "uuid",
  "remaining": 99
}
```

Failure responses:
- `409` if seat is locked/booked
- `400` for invalid payload

### 2) Get all seats
`GET /api/seats`

Response:
```json
[
  { "seat": 1, "status": "booked" },
  { "seat": 2, "status": "available" }
]
```

### 3) Get all bookings
`GET /api/bookings`

Response:
```json
{
  "total": 1,
  "remaining": 99,
  "bookings": [
    {
      "bookingId": "uuid",
      "user": "user123",
      "seat": 45,
      "timestamp": "2026-03-05T00:00:00.000Z"
    }
  ]
}
```

## Logging
On startup:
- `Redis connected`
- `Server running on port 3000`

Successful booking example log:
```text
POST /api/book 200
{
  "success": true,
  "bookingId": "1718369248709",
  "remaining": 99
}
```

## How to Run Locally (Without Docker)
1. Ensure Redis is running on `localhost:6379`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start server:
   ```bash
   set REDIS_URL=redis://127.0.0.1:6379
   npm start
   ```
4. Test API:
   - `POST http://localhost:3000/api/book`
   - `GET http://localhost:3000/api/seats`
   - `GET http://localhost:3000/api/bookings`

## Run with Docker Compose
```bash
docker compose up --build
```

## Load Testing with Artillery
1. Start server.
2. Run:
   ```bash
   npm run test:load
   ```

`load-test.yml` simulates 100 concurrent users attempting bookings.

## Deployment (Render / Railway)
You can deploy this project to either platform:

### Render
1. Create a new Web Service from this GitHub repo.
2. Build command: `npm install`
3. Start command: `npm start`
4. Add env var: `REDIS_URL=<your_redis_connection_string>`

### Railway
1. Create a new project from this repo.
2. Provision Redis plugin/service.
3. Set `REDIS_URL` and deploy.

After deployment, your demo API link will look like:
- Render: `https://<service-name>.onrender.com`
- Railway: `https://<service-name>.up.railway.app`

## Git Commands Used
```bash
git clone https://github.com/AnuragPrajapati05/FSEXP1.4.3.git
# add files
# git add .
# git commit -m "Concurrent ticket booking system with Redis locking"
# git push origin main
```

## Deploy on Vercel (CLI)
1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. Login:
   ```bash
   vercel login
   ```
3. Set environment variable in Vercel project settings:
   - `REDIS_URL` = your public Redis URL (for example Upstash Redis URL)
4. Deploy production:
   ```bash
   vercel --prod
   ```

Example deployed endpoints:
- `https://<your-vercel-domain>/api/seats`
- `https://<your-vercel-domain>/api/book`
- `https://<your-vercel-domain>/api/bookings`
