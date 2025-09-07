import { NextRequest, NextResponse } from 'next/server';
import { CacheService, CacheKeys, CacheTTL } from './redis';
import { authLogger } from './logger';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// Default rate limit configurations
export const RateLimitConfigs = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts. Please try again later.',
  },
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    message: 'Too many API requests. Please slow down.',
  },
  signup: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 signups per hour per IP
    message: 'Too many signup attempts. Please try again later.',
  },
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 password reset attempts per hour
    message: 'Too many password reset attempts. Please try again later.',
  },
};

// Get client IP address
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return 'unknown';
}

// Rate limiting function
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  identifier?: string
): Promise<RateLimitResult> {
  const ip = identifier || getClientIP(request);
  const key = CacheKeys.rateLimitAuth(ip);
  
  try {
    // Get current count
    const current = await CacheService.get<{ count: number; resetTime: number }>(key);
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    let count = 0;
    let resetTime = now + config.windowMs;
    
    if (current && current.resetTime > now) {
      // Within the same window
      count = current.count;
      resetTime = current.resetTime;
    }
    
    // Check if limit exceeded
    if (count >= config.maxRequests) {
      const retryAfter = Math.ceil((resetTime - now) / 1000);
      
      authLogger.warn('Rate limit exceeded', {
        ip,
        count,
        limit: config.maxRequests,
        retryAfter,
        endpoint: request.url
      });
      
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime,
        retryAfter,
      };
    }
    
    // Increment count
    const newCount = count + 1;
    await CacheService.set(key, { count: newCount, resetTime }, Math.ceil(config.windowMs / 1000));
    
    authLogger.debug('Rate limit check passed', {
      ip,
      count: newCount,
      limit: config.maxRequests,
      remaining: config.maxRequests - newCount
    });
    
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - newCount,
      resetTime,
    };
  } catch (error) {
    authLogger.error('Rate limit check failed', error, { ip, endpoint: request.url });
    
    // On error, allow the request (fail open)
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetTime: Date.now() + config.windowMs,
    };
  }
}

// Rate limit middleware wrapper
export function withRateLimit(config: RateLimitConfig) {
  return async (request: NextRequest, handler: () => Promise<NextResponse>) => {
    const result = await rateLimit(request, config);
    
    if (!result.success) {
      return NextResponse.json(
        {
          error: config.message || 'Rate limit exceeded',
          retryAfter: result.retryAfter,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Retry-After': result.retryAfter?.toString() || '60',
          },
        }
      );
    }
    
    // Add rate limit headers to successful responses
    const response = await handler();
    response.headers.set('X-RateLimit-Limit', result.limit.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
    
    return response;
  };
}

// Specific rate limiters for different endpoints
export const authRateLimit = (request: NextRequest, handler: () => Promise<NextResponse>) =>
  withRateLimit(RateLimitConfigs.auth)(request, handler);

export const apiRateLimit = (request: NextRequest, handler: () => Promise<NextResponse>) =>
  withRateLimit(RateLimitConfigs.api)(request, handler);

export const signupRateLimit = (request: NextRequest, handler: () => Promise<NextResponse>) =>
  withRateLimit(RateLimitConfigs.signup)(request, handler);

export const passwordResetRateLimit = (request: NextRequest, handler: () => Promise<NextResponse>) =>
  withRateLimit(RateLimitConfigs.passwordReset)(request, handler);

// Advanced rate limiting with different strategies
export class AdvancedRateLimit {
  // Sliding window rate limiter
  static async slidingWindow(
    request: NextRequest,
    windowMs: number,
    maxRequests: number,
    identifier?: string
  ): Promise<RateLimitResult> {
    const ip = identifier || getClientIP(request);
    const key = `sliding_window:${ip}`;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    try {
      // Get request timestamps
      const timestamps = await CacheService.get<number[]>(key) || [];
      
      // Filter out old timestamps
      const validTimestamps = timestamps.filter(ts => ts > windowStart);
      
      // Check if limit exceeded
      if (validTimestamps.length >= maxRequests) {
        const oldestValidTimestamp = Math.min(...validTimestamps);
        const retryAfter = Math.ceil((oldestValidTimestamp + windowMs - now) / 1000);
        
        return {
          success: false,
          limit: maxRequests,
          remaining: 0,
          resetTime: oldestValidTimestamp + windowMs,
          retryAfter,
        };
      }
      
      // Add current timestamp
      validTimestamps.push(now);
      await CacheService.set(key, validTimestamps, Math.ceil(windowMs / 1000));
      
      return {
        success: true,
        limit: maxRequests,
        remaining: maxRequests - validTimestamps.length,
        resetTime: now + windowMs,
      };
    } catch (error) {
      authLogger.error('Sliding window rate limit failed', error);
      return {
        success: true,
        limit: maxRequests,
        remaining: maxRequests - 1,
        resetTime: now + windowMs,
      };
    }
  }
  
  // Token bucket rate limiter
  static async tokenBucket(
    request: NextRequest,
    capacity: number,
    refillRate: number,
    identifier?: string
  ): Promise<RateLimitResult> {
    const ip = identifier || getClientIP(request);
    const key = `token_bucket:${ip}`;
    const now = Date.now();
    
    try {
      const bucket = await CacheService.get<{ tokens: number; lastRefill: number }>(key) || {
        tokens: capacity,
        lastRefill: now,
      };
      
      // Calculate tokens to add based on time elapsed
      const timePassed = now - bucket.lastRefill;
      const tokensToAdd = Math.floor(timePassed * refillRate / 1000);
      const newTokens = Math.min(capacity, bucket.tokens + tokensToAdd);
      
      if (newTokens < 1) {
        const timeToNextToken = Math.ceil((1 - newTokens) * 1000 / refillRate);
        
        return {
          success: false,
          limit: capacity,
          remaining: 0,
          resetTime: now + timeToNextToken,
          retryAfter: Math.ceil(timeToNextToken / 1000),
        };
      }
      
      // Consume one token
      const updatedBucket = {
        tokens: newTokens - 1,
        lastRefill: now,
      };
      
      await CacheService.set(key, updatedBucket, 3600); // 1 hour TTL
      
      return {
        success: true,
        limit: capacity,
        remaining: updatedBucket.tokens,
        resetTime: now + Math.ceil((capacity - updatedBucket.tokens) * 1000 / refillRate),
      };
    } catch (error) {
      authLogger.error('Token bucket rate limit failed', error);
      return {
        success: true,
        limit: capacity,
        remaining: capacity - 1,
        resetTime: now + 60000,
      };
    }
  }
}

export default rateLimit;