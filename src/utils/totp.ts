import * as OTPAuth from 'otpauth';
import jsQR from 'jsqr';
import { AuthenticatorToken, GeneratedCodeInfo } from '../types/authenticator';

/**
 * Sanitizes base32 secret by stripping spaces, hyphens, and converting to uppercase.
 */
export function sanitizeSecret(secret: string): string {
  return secret.replace(/[\s\-_]/g, '').toUpperCase();
}

/**
 * Validates whether a secret key is a valid Base32 string.
 */
export function isValidBase32(secret: string): boolean {
  const clean = sanitizeSecret(secret);
  if (!clean || clean.length < 8) return false;
  // RFC 4648 Base32 alphabet: A-Z, 2-7
  return /^[A-Z2-7]+=*$/.test(clean);
}

/**
 * Generates the current TOTP code and countdown info for a token.
 */
export function generateTotpCode(token: AuthenticatorToken): GeneratedCodeInfo {
  const period = token.period || 30;
  const digits = token.digits || 6;
  const cleanSecret = sanitizeSecret(token.secret);

  const epoch = Math.floor(Date.now() / 1000);
  const secondsRemaining = period - (epoch % period);
  const percentageRemaining = Math.max(0, Math.min(100, (secondsRemaining / period) * 100));

  try {
    const totp = new OTPAuth.TOTP({
      issuer: token.issuer || 'Orion',
      label: token.account || 'Account',
      algorithm: token.algorithm || 'SHA1',
      digits,
      period,
      secret: OTPAuth.Secret.fromBase32(cleanSecret),
    });

    const code = totp.generate();
    // Next code in the subsequent time step
    const nextCode = totp.generate({ timestamp: Date.now() + period * 1000 });

    // Format code: e.g. "123 456" or "1234 5678"
    let formattedCode = code;
    if (code.length === 6) {
      formattedCode = `${code.slice(0, 3)} ${code.slice(3)}`;
    } else if (code.length === 8) {
      formattedCode = `${code.slice(0, 4)} ${code.slice(4)}`;
    }

    return {
      token,
      code,
      formattedCode,
      secondsRemaining,
      period,
      nextCode,
      percentageRemaining,
    };
  } catch (error) {
    console.warn(`Error generating TOTP for ${token.issuer}:`, error);
    const fallback = '------';
    return {
      token,
      code: fallback,
      formattedCode: '--- ---',
      secondsRemaining,
      period,
      percentageRemaining,
    };
  }
}

/**
 * Parses an otpauth://totp/ URL into token properties.
 */
export function parseOtpAuthUri(uri: string): Partial<AuthenticatorToken> | null {
  try {
    const parsed = OTPAuth.URI.parse(uri);
    if (!parsed || !(parsed instanceof OTPAuth.TOTP)) {
      return null;
    }

    return {
      issuer: parsed.issuer || 'Servicio',
      account: parsed.label || '',
      secret: parsed.secret.base32,
      algorithm: (parsed.algorithm as any) || 'SHA1',
      digits: parsed.digits || 6,
      period: parsed.period || 30,
    };
  } catch (error) {
    // Fallback regex parser for non-standard URIs
    try {
      if (uri.startsWith('otpauth://totp/')) {
        const url = new URL(uri);
        const secret = url.searchParams.get('secret');
        if (!secret) return null;

        const pathParts = decodeURIComponent(url.pathname.replace(/^\/totp\//, '')).split(':');
        let issuer = url.searchParams.get('issuer') || '';
        let account = '';

        if (pathParts.length > 1) {
          if (!issuer) issuer = pathParts[0];
          account = pathParts[1];
        } else {
          account = pathParts[0];
        }

        return {
          issuer: issuer || 'Servicio',
          account: account || 'Cuenta',
          secret: sanitizeSecret(secret),
          digits: parseInt(url.searchParams.get('digits') || '6', 10) || 6,
          period: parseInt(url.searchParams.get('period') || '30', 10) || 30,
          algorithm: (url.searchParams.get('algorithm')?.toUpperCase() as any) || 'SHA1',
        };
      }
    } catch {}
    return null;
  }
}

/**
 * Scans an HTML Image or Canvas element for a QR code using jsQR.
 */
export function scanQrCodeFromImage(imgElement: HTMLImageElement): string | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = imgElement.naturalWidth || imgElement.width;
    canvas.height = imgElement.naturalHeight || imgElement.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });

    return code ? code.data : null;
  } catch (error) {
    console.error('Error scanning QR code from image:', error);
    return null;
  }
}

/**
 * Scans a video stream frame for a QR code using jsQR.
 */
export function scanQrCodeFromVideo(videoElement: HTMLVideoElement): string | null {
  try {
    if (videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) return null;
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    return code ? code.data : null;
  } catch {
    return null;
  }
}

/**
 * Generates a random secure base32 secret for testing or generating new credentials.
 */
export function generateRandomSecret(): string {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

/**
 * Guesses visual brand color and icon name based on issuer/account name.
 */
export function detectBrandInfo(issuer: string, account?: string): { color: string; iconKey: string } {
  const combined = `${issuer} ${account || ''}`.toLowerCase();

  if (combined.includes('google') || combined.includes('gmail')) {
    return { color: '#4285F4', iconKey: 'google' };
  }
  if (combined.includes('github')) {
    return { color: '#24292F', iconKey: 'github' };
  }
  if (combined.includes('microsoft') || combined.includes('azure') || combined.includes('outlook')) {
    return { color: '#00A4EF', iconKey: 'microsoft' };
  }
  if (combined.includes('discord')) {
    return { color: '#5865F2', iconKey: 'discord' };
  }
  if (combined.includes('amazon') || combined.includes('aws')) {
    return { color: '#FF9900', iconKey: 'aws' };
  }
  if (combined.includes('apple') || combined.includes('icloud')) {
    return { color: '#111111', iconKey: 'apple' };
  }
  if (combined.includes('steam')) {
    return { color: '#171A21', iconKey: 'steam' };
  }
  if (combined.includes('binance') || combined.includes('crypto')) {
    return { color: '#F0B90B', iconKey: 'crypto' };
  }
  if (combined.includes('orion')) {
    return { color: '#7C3AED', iconKey: 'orion' };
  }
  if (combined.includes('twitter') || combined.includes('x.com')) {
    return { color: '#1DA1F2', iconKey: 'twitter' };
  }

  // Curated palette for other brands
  const colors = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#06B6D4', '#8B5CF6', '#3B82F6'];
  let hash = 0;
  for (let i = 0; i < issuer.length; i++) {
    hash = issuer.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = colors[Math.abs(hash) % colors.length];

  return { color, iconKey: 'shield' };
}
