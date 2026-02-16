import { RateLimiterMemory } from "rate-limiter-flexible";

// Strict limiter for registration (5 req / 15 min)
export const registerLimiter = new RateLimiterMemory({
  points: 5,
  duration: 900, // 15 minutes
});

// Auth limiter for login (10 req / 1 min)
export const authLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60,
});

// AI endpoint limiter (20 req / 1 min)
export const classifyLimiter = new RateLimiterMemory({
  points: 20,
  duration: 60,
});

// General API limiter (60 req / 1 min)
export const apiLimiter = new RateLimiterMemory({
  points: 60,
  duration: 60,
});

export type RateLimiter = RateLimiterMemory;
