export type UnlockMethodType = 'pin' | 'passkey' | 'email' | 'sms';

export interface AuthenticatorSecurityConfig {
  isConfigured: boolean; // Has completed the first-time setup
  primaryMethod: UnlockMethodType;
  enabledMethods: {
    pin: boolean;
    passkey: boolean;
    email: boolean;
    sms: boolean;
  };
  // Encrypted PIN details (SHA-256 with salt)
  pinSalt?: string;
  pinHash?: string;
  pinLength: number; // 4 or 6
  // Passkey / WebAuthn details
  passkeyCredentialId?: string;
  passkeyRegisteredName?: string;
  // Email verification details
  emailAddress?: string;
  // SMS verification details
  phoneNumber?: string;
  // Emergency Recovery Codes
  recoveryCodes: string[];
  usedRecoveryCodes: string[];
  // Auto-lock configuration
  autoLockMinutes: number; // 0 = immediately on leave, 5, 15, 30
  updatedAt: string;
}

export const DEFAULT_SECURITY_CONFIG: AuthenticatorSecurityConfig = {
  isConfigured: false,
  primaryMethod: 'pin',
  enabledMethods: {
    pin: true,
    passkey: false,
    email: false,
    sms: false,
  },
  pinLength: 4,
  recoveryCodes: [],
  usedRecoveryCodes: [],
  autoLockMinutes: 5,
  updatedAt: new Date().toISOString(),
};
