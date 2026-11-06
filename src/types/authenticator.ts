export type TotpAlgorithm = 'SHA1' | 'SHA256' | 'SHA512';

export interface AuthenticatorToken {
  id: string;
  userId?: string;
  issuer: string;
  account: string;
  secret: string; // Base32 encoded secret key
  algorithm?: TotpAlgorithm;
  digits?: number; // Usually 6 (sometimes 8)
  period?: number; // Usually 30s
  icon?: string;
  color?: string;
  folder?: string;
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedCodeInfo {
  token: AuthenticatorToken;
  code: string;
  formattedCode: string;
  secondsRemaining: number;
  period: number;
  nextCode?: string;
  percentageRemaining: number;
}

export interface AuthenticatorBrandPreset {
  name: string;
  issuer: string;
  color: string;
  iconName: string;
  defaultDigits: number;
  defaultPeriod: number;
  description: string;
}

export const AUTHENTICATOR_PRESETS: AuthenticatorBrandPreset[] = [
  {
    name: 'Google',
    issuer: 'Google',
    color: '#4285F4',
    iconName: 'google',
    defaultDigits: 6,
    defaultPeriod: 30,
    description: 'Cuentas de Google, Workspace y YouTube',
  },
  {
    name: 'GitHub',
    issuer: 'GitHub',
    color: '#24292F',
    iconName: 'github',
    defaultDigits: 6,
    defaultPeriod: 30,
    description: 'Repositorios y autenticación para desarrolladores',
  },
  {
    name: 'Microsoft',
    issuer: 'Microsoft',
    color: '#00A4EF',
    iconName: 'microsoft',
    defaultDigits: 6,
    defaultPeriod: 30,
    description: 'Outlook, Azure, Xbox y Office 365',
  },
  {
    name: 'Discord',
    issuer: 'Discord',
    color: '#5865F2',
    iconName: 'discord',
    defaultDigits: 6,
    defaultPeriod: 30,
    description: 'Comunidades, servidores y mensajería',
  },
  {
    name: 'Amazon / AWS',
    issuer: 'Amazon Web Services',
    color: '#FF9900',
    iconName: 'aws',
    defaultDigits: 6,
    defaultPeriod: 30,
    description: 'Consola cloud AWS y cuenta Amazon',
  },
  {
    name: 'Apple',
    issuer: 'Apple',
    color: '#000000',
    iconName: 'apple',
    defaultDigits: 6,
    defaultPeriod: 30,
    description: 'ID de Apple e iCloud',
  },
  {
    name: 'Steam',
    issuer: 'Steam',
    color: '#171A21',
    iconName: 'steam',
    defaultDigits: 5,
    defaultPeriod: 30,
    description: 'Plataforma de videojuegos Steam Guard',
  },
  {
    name: 'Orion Workspace',
    issuer: 'Orion Cloud',
    color: '#7C3AED',
    iconName: 'orion',
    defaultDigits: 6,
    defaultPeriod: 30,
    description: 'Acceso seguro al ecosistema Orion',
  },
];
