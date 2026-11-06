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

/* =======================================================================
 * END-TO-END ENCRYPTION (E2EE) - ZERO-KNOWLEDGE CRYPTOGRAPHY (AES-256-GCM)
 * ======================================================================= */

import type { AuthenticatorToken, EncryptedCloudToken } from '../types/authenticator';

export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Derives a 256-bit AES-GCM vault master key from the user's PIN + unique salt
 * using PBKDF2 (100,000 rounds of SHA-256).
 */
export async function deriveVaultMasterKey(pin: string, salt: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(`orion:vault:pin:${pin}`),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(`orion:vault:salt:${salt}`),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts arbitrary UTF-8 text using AES-256-GCM with a fresh CSPRNG 96-bit IV.
 */
export async function encryptDataAESGCM(
  plaintext: string,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(iv);
  const encoded = new TextEncoder().encode(plaintext);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encoded
  );

  return {
    ciphertext: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv),
  };
}

/**
 * Decrypts AES-256-GCM ciphertext using the given key and IV.
 */
export async function decryptDataAESGCM(
  ciphertext: string,
  iv: string,
  key: CryptoKey
): Promise<string> {
  const encBuffer = base64ToArrayBuffer(ciphertext);
  const ivBuffer = base64ToArrayBuffer(iv);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(ivBuffer),
    },
    key,
    encBuffer
  );

  return new TextDecoder().decode(decryptedBuffer);
}

/**
 * Encrypts a full AuthenticatorToken into a zero-knowledge cloud payload.
 * Secrets, issuer, account, and algorithm are completely encrypted in ciphertext.
 */
export async function encryptTokenE2EE(
  token: AuthenticatorToken,
  key: CryptoKey
): Promise<EncryptedCloudToken> {
  const payloadToEncrypt = JSON.stringify({
    issuer: token.issuer,
    account: token.account,
    secret: token.secret,
    algorithm: token.algorithm || 'SHA1',
    digits: token.digits || 6,
    period: token.period || 30,
    icon: token.icon || 'shield',
    color: token.color || '#7C3AED',
    folder: token.folder || 'General',
    isPinned: Boolean(token.isPinned),
  });

  const { ciphertext, iv } = await encryptDataAESGCM(payloadToEncrypt, key);

  return {
    id: token.id,
    userId: token.userId,
    isE2EE: true,
    version: 1,
    ciphertext,
    iv,
    createdAt: token.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Decrypts a cloud token document. If the document is E2EE encrypted,
 * decrypts the ciphertext using the vault key. If legacy plaintext, returns safely.
 */
export async function decryptTokenE2EE(
  data: any,
  key: CryptoKey
): Promise<AuthenticatorToken> {
  if (data.isE2EE && data.ciphertext && data.iv) {
    try {
      const jsonStr = await decryptDataAESGCM(data.ciphertext, data.iv, key);
      const parsed = JSON.parse(jsonStr);
      return {
        id: data.id,
        userId: data.userId,
        issuer: parsed.issuer || 'Servicio',
        account: parsed.account || '',
        secret: parsed.secret || '',
        algorithm: parsed.algorithm || 'SHA1',
        digits: parsed.digits || 6,
        period: parsed.period || 30,
        icon: parsed.icon || 'shield',
        color: parsed.color || '#7C3AED',
        folder: parsed.folder || 'General',
        isPinned: Boolean(parsed.isPinned),
        isE2EE: true,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
    } catch (err) {
      console.error('Error decrypting E2EE token with provided key:', err);
      throw new Error('Fallo al descifrar el token E2EE: clave inválida o datos corruptos.');
    }
  }

  // Backward-compatibility: legacy unencrypted token
  return {
    id: data.id,
    userId: data.userId,
    issuer: data.issuer || 'Servicio',
    account: data.account || '',
    secret: data.secret || '',
    algorithm: data.algorithm || 'SHA1',
    digits: data.digits || 6,
    period: data.period || 30,
    icon: data.icon || 'shield',
    color: data.color || '#7C3AED',
    folder: data.folder || 'General',
    isPinned: Boolean(data.isPinned),
    isE2EE: false,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}

// In-memory active vault key state (cleared when vault locks or page unloads)
let activeVaultCryptoKey: CryptoKey | null = null;

export function setActiveVaultKey(key: CryptoKey | null): void {
  activeVaultCryptoKey = key;
}

export function getActiveVaultKey(): CryptoKey | null {
  return activeVaultCryptoKey;
}

export function hasActiveVaultKey(): boolean {
  return activeVaultCryptoKey !== null;
}

const DEVICE_VAULT_STORAGE_KEY = 'orion_auth_device_vault_key_v1';

/**
 * Caches the vault master key encrypted/stored on the trusted local device,
 * allowing instant decryption when unlocking with Passkeys (Face ID, Touch ID)
 * or Email/SMS OTP without needing to re-prompt for the PIN.
 */
export async function saveDeviceVaultKey(key: CryptoKey): Promise<void> {
  try {
    const rawBuffer = await window.crypto.subtle.exportKey('raw', key);
    const base64 = arrayBufferToBase64(rawBuffer);
    localStorage.setItem(DEVICE_VAULT_STORAGE_KEY, base64);
  } catch (err) {
    console.warn('Could not cache device vault key:', err);
  }
}

export async function loadDeviceVaultKey(): Promise<CryptoKey | null> {
  try {
    const base64 = localStorage.getItem(DEVICE_VAULT_STORAGE_KEY);
    if (!base64) return null;
    const rawBuffer = base64ToArrayBuffer(base64);
    return await window.crypto.subtle.importKey(
      'raw',
      rawBuffer,
      { name: 'AES-GCM' },
      true,
      ['encrypt', 'decrypt']
    );
  } catch (err) {
    console.warn('Could not import device vault key:', err);
    return null;
  }
}

export function clearDeviceVaultKey(): void {
  try {
    localStorage.removeItem(DEVICE_VAULT_STORAGE_KEY);
    activeVaultCryptoKey = null;
  } catch {}
}
