// Simple in-memory failed-attempt limiter for the admin login.
//
// Scope/limitations (intentional for a low-traffic school tournament):
//  - State lives in module memory. On Netlify each serverless instance keeps its
//    own counters and they reset on cold start, so this is a soft throttle, not a
//    hard global guarantee. It is plenty to stop a student scripting thousands of
//    guesses against a single shared password.
//  - Only FAILED attempts count toward the limit; a correct password clears the
//    record, so it never gets in the way of legitimate admin use.

type Attempt = { count: number; firstAttemptAt: number; blockedUntil: number };

const MAX_ATTEMPTS = 5; // failures allowed inside the window before a block kicks in
const WINDOW_MS = 15 * 60 * 1000; // rolling window the failures are counted in
const BLOCK_MS = 15 * 60 * 1000; // how long the lockout lasts once tripped

const attempts = new Map<string, Attempt>();

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export function clientKey(request: Request): string {
  // Netlify/most proxies set x-forwarded-for (client is the first entry).
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]!.trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

// Call BEFORE checking the password. Returns whether this caller may attempt now.
export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const record = attempts.get(key);

  if (record?.blockedUntil && now < record.blockedUntil) {
    return { allowed: false, retryAfterSeconds: Math.ceil((record.blockedUntil - now) / 1000) };
  }

  return { allowed: true };
}

// Call AFTER a failed password check.
export function registerFailure(key: string): void {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || now - record.firstAttemptAt > WINDOW_MS || (record.blockedUntil && now >= record.blockedUntil)) {
    attempts.set(key, { count: 1, firstAttemptAt: now, blockedUntil: 0 });
    return;
  }

  record.count += 1;
  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_MS;
  }
}

// Call AFTER a successful password check to wipe the caller's failure history.
export function registerSuccess(key: string): void {
  attempts.delete(key);
}
