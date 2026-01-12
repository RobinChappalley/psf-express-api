import rateLimiter from "express-rate-limit";

// Apply rate limiting to all requests
const loginLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: "Trop de tentatives",
});

export default loginLimiter;
