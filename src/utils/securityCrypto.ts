/**
 * Cryptographic and security operations for Orion Authenticator Vault.
 * Uses Web Crypto API (SubtleCrypto) for salted SHA-256 hashing, WebAuthn for Passkeys,
 * and OTP dispatch for SMS / Email.
 */

// Generate random hex salt
export function generateSalt(byteLength = 16): string {
  const bytes = new Uint8Array(byteLength);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// SHA-256 hash with salt
export async function hashPin(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`orion:authenticator:pin:${salt}:${pin}`);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Verify entered PIN against stored salted hash
export async function verifyPin(
  pin: string,
  salt: string,
  expectedHash: string
): Promise<boolean> {
  const computed = await hashPin(pin, salt);
  return computed === expectedHash;
}

// Generate emergency recovery codes (e.g. ORION-4829-1920)
export function generateRecoveryCodes(count = 6): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const r1 = Math.floor(1000 + Math.random() * 9000);
    const r2 = Math.floor(1000 + Math.random() * 9000);
    codes.push(`ORION-${r1}-${r2}`);
  }
  return codes;
}

// Helper: convert base64url string to BufferSource ArrayBuffer
function base64UrlToBufferSource(base64Url: string): ArrayBuffer {
  try {
    const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
    const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const buffer = new ArrayBuffer(rawData.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < rawData.length; ++i) {
      view[i] = rawData.charCodeAt(i);
    }
    return buffer;
  } catch {
    const encoded = new TextEncoder().encode(base64Url);
    return encoded.buffer as ArrayBuffer;
  }
}

// Register real native WebAuthn Passkey (Touch ID / Face ID / Windows Hello)
export async function registerPasskey(
  userName: string
): Promise<{ credentialId: string; rawId?: string }> {
  if (
    typeof window === 'undefined' ||
    !window.PublicKeyCredential ||
    !navigator.credentials ||
    !navigator.credentials.create
  ) {
    throw new Error('Tu navegador no es compatible con la API biométrica WebAuthn / Passkeys.');
  }

  // Create 32-byte cryptographic random challenge
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  // User identifier
  const userId = new Uint8Array(16);
  window.crypto.getRandomValues(userId);

  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

  try {
    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'Orion Authenticator',
          ...(isLocal ? { id: 'localhost' } : hostname ? { id: hostname } : {}),
        },
        user: {
          id: userId,
          name: userName || 'usuario@orion.app',
          displayName: userName || 'Usuario Orion',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256 (standard Passkey)
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Triggers Face ID, Touch ID, Windows Hello
          userVerification: 'required', // Forces biometric dialog
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      },
    })) as PublicKeyCredential | null;

    if (!credential) {
      throw new Error('No se generó la credencial biométrica.');
    }

    return { credentialId: credential.id };
  } catch (err: any) {
    console.error('WebAuthn registration error:', err);
    if (err.name === 'NotAllowedError') {
      throw new Error('Registro cancelado o denegado por el usuario en FaceID/TouchID/Windows Hello.');
    }
    if (err.name === 'SecurityError') {
      throw new Error('El navegador no permite registrar Passkeys dentro de un iframe con restricciones.');
    }
    throw new Error(err.message || 'Error al comunicarse con el autenticador biométrico del sistema.');
  }
}

export interface VerifyPasskeyResult {
  success: boolean;
  error?: string;
}

// Verify real native WebAuthn Passkey (Opens Face ID, Touch ID, Windows Hello)
export async function verifyPasskey(
  credentialId?: string
): Promise<VerifyPasskeyResult> {
  if (
    typeof window === 'undefined' ||
    !window.PublicKeyCredential ||
    !navigator.credentials ||
    !navigator.credentials.get
  ) {
    return {
      success: false,
      error: 'Tu navegador no soporta autenticación biométrica WebAuthn / Passkeys.',
    };
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

    let allowCredentials: PublicKeyCredentialDescriptor[] | undefined = undefined;
    if (credentialId && !credentialId.startsWith('passkey-device-')) {
      try {
        allowCredentials = [
          {
            id: base64UrlToBufferSource(credentialId),
            type: 'public-key',
            transports: ['internal'],
          },
        ];
      } catch {
        allowCredentials = undefined;
      }
    }

    const publicKeyOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      timeout: 60000,
      ...(isLocal ? { rpId: 'localhost' } : hostname ? { rpId: hostname } : {}),
      userVerification: 'required', // Opens Face ID, Touch ID, Windows Hello
      ...(allowCredentials && allowCredentials.length > 0 ? { allowCredentials } : {}),
    };

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyOptions,
    });

    if (assertion) {
      return { success: true };
    }
    return { success: false, error: 'No se recibió la confirmación biométrica del dispositivo.' };
  } catch (error: any) {
    console.error('WebAuthn verification error:', error);
    if (error?.name === 'NotAllowedError') {
      return {
        success: false,
        error: 'Autenticación biométrica cancelada o no reconocida (Face ID, Touch ID, Windows Hello).',
      };
    }
    if (error?.name === 'SecurityError') {
      return {
        success: false,
        error: 'El navegador bloqueó la solicitud biométrica por directiva de seguridad del iframe.',
      };
    }
    return {
      success: false,
      error: error?.message || 'Error al comunicarse con el autenticador biométrico.',
    };
  }
}

// Dispatch Email OTP (Generates 6-digit code with simulated notification)
export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper to trigger simulated real-time alert for SMS / Email OTP
export function notifyOtpDispatched(
  type: 'email' | 'sms',
  destination: string,
  code: string
) {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(
        type === 'email' ? 'Orion Security · Código de Correo' : 'Orion SMS · Código de Verificación',
        {
          body: `Tu código de verificación de 6 dígitos es: ${code} (Enviado a ${destination})`,
          icon: '/favicon.ico',
        }
      );
    } catch {}
  }
}
