import { createHash, createHmac } from 'crypto';

const SECRET = process.env.BOOKING_TOKEN_SECRET || 'default-secret-change-in-production';

/**
 * Generate a secure token for booking actions (confirm/cancel)
 * Token format: bookingId.expiry.signature
 */
export function generateBookingToken(bookingId: string): string {
  // Token expires in 7 days
  const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload = `${bookingId}.${expiry}`;
  const signature = createHmac('sha256', SECRET).update(payload).digest('hex');
  
  return `${payload}.${signature}`;
}

/**
 * Verify and decode a booking token
 * Returns booking ID if valid, null otherwise
 */
export function verifyBookingToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [bookingId, expiryStr, signature] = parts;
    const expiry = parseInt(expiryStr, 10);

    // Check expiry
    if (Date.now() > expiry) {
      return null;
    }

    // Verify signature
    const payload = `${bookingId}.${expiryStr}`;
    const expectedSignature = createHmac('sha256', SECRET)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      return null;
    }

    return bookingId;
  } catch (error) {
    return null;
  }
}
