import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Key,
  Fingerprint,
  Mail,
  Smartphone,
  Check,
  ArrowRight,
  ArrowLeft,
  Copy,
  Download,
  AlertCircle,
  Sparkles,
  Lock,
} from 'lucide-react';
import {
  AuthenticatorSecurityConfig,
  UnlockMethodType,
} from '../../types/authenticatorSecurity';
import {
  generateSalt,
  hashPin,
  generateRecoveryCodes,
  registerPasskey,
} from '../../utils/securityCrypto';

interface AuthenticatorSetupWizardProps {
  isOpen: boolean;
  userEmail?: string | null;
  onComplete: (config: AuthenticatorSecurityConfig) => void;
  onCancel?: () => void;
}

export const AuthenticatorSetupWizard: React.FC<AuthenticatorSetupWizardProps> = ({
  isOpen,
  userEmail,
  onComplete,
  onCancel,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Selection
  const [enabledMethods, setEnabledMethods] = useState({
    pin: true,
    passkey: false,
    email: Boolean(userEmail),
    sms: false,
  });
  const [primaryMethod, setPrimaryMethod] = useState<UnlockMethodType>('pin');

  // Step 2: Configuration inputs
  const [pinLength, setPinLength] = useState<4 | 6>(4);
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [emailAddress, setEmailAddress] = useState(userEmail || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [passkeyRegistered, setPasskeyRegistered] = useState(false);
  const [passkeyId, setPasskeyId] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);

  // Step 3: Recovery Codes
  const [recoveryCodes] = useState<string[]>(() => generateRecoveryCodes(6));
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [hasConfirmedCodes, setHasConfirmedCodes] = useState(false);

  if (!isOpen) return null;

  const toggleMethod = (method: 'pin' | 'passkey' | 'email' | 'sms') => {
    // Keep at least one method enabled
    const current = enabledMethods[method];
    if (current) {
      const activeCount = Object.values(enabledMethods).filter(Boolean).length;
      if (activeCount <= 1) return; // Cannot disable last method
    }
    const next = { ...enabledMethods, [method]: !current };
    setEnabledMethods(next);

    // If disabled primary, pick another active one
    if (!next[primaryMethod]) {
      const remaining = (Object.keys(next) as (keyof typeof next)[]).find((k) => next[k]);
      if (remaining) setPrimaryMethod(remaining);
    }
  };

  const handleRegisterPasskey = async () => {
    try {
      const result = await registerPasskey(emailAddress || userEmail || 'Usuario Orion');
      setPasskeyId(result.credentialId);
      setPasskeyRegistered(true);
      setStepError(null);
    } catch (err: any) {
      setStepError(err?.message || 'No se pudo registrar la Passkey en este dispositivo.');
    }
  };

  const handleGoToStep2 = () => {
    setStepError(null);
    setStep(2);
  };

  const handleGoToStep3 = async () => {
    setStepError(null);

    // Validate PIN if enabled
    if (enabledMethods.pin) {
      if (pin.length !== pinLength) {
        setStepError(`El PIN debe tener exactamente ${pinLength} dígitos numéricos.`);
        return;
      }
      if (pin !== pinConfirm) {
        setStepError('Los dos PIN introducidos no coinciden.');
        return;
      }
    }

    // Validate Email if enabled
    if (enabledMethods.email) {
      if (!emailAddress.trim() || !emailAddress.includes('@')) {
        setStepError('Introduce una dirección de correo válida para el método por email.');
        return;
      }
    }

    // Validate SMS if enabled
    if (enabledMethods.sms) {
      if (!phoneNumber.trim() || phoneNumber.length < 8) {
        setStepError('Introduce un número de teléfono válido con prefijo internacional.');
        return;
      }
    }

    setStep(3);
  };

  const handleCopyCodes = async () => {
    try {
      await navigator.clipboard.writeText(
        `CÓDIGOS DE RECUPERACIÓN DE EMERGENCIA - ORION AUTHENTICATOR\nGenerados el: ${new Date().toLocaleString()}\n\n` +
          recoveryCodes.map((c, i) => `${i + 1}. ${c}`).join('\n')
      );
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2500);
    } catch {}
  };

  const handleDownloadCodes = () => {
    const text =
      `CÓDIGOS DE RECUPERACIÓN DE EMERGENCIA - ORION AUTHENTICATOR\n` +
      `Generados el: ${new Date().toLocaleString()}\n\n` +
      `Guarda estos códigos en un lugar seguro. Si pierdes el acceso a tu método de desbloqueo,\n` +
      `puedes usar cualquiera de estos códigos para acceder a tu bóveda.\n\n` +
      recoveryCodes.map((c, i) => `${i + 1}. ${c}`).join('\n') +
      `\n\nNota: Cada código solo se puede utilizar una única vez.\n`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orion-authenticator-recovery-codes-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFinishSetup = async () => {
    let pinSalt = '';
    let pinHash = '';

    if (enabledMethods.pin && pin) {
      pinSalt = generateSalt(16);
      pinHash = await hashPin(pin, pinSalt);
    }

    const finalConfig: AuthenticatorSecurityConfig = {
      isConfigured: true,
      primaryMethod,
      enabledMethods,
      pinSalt,
      pinHash,
      pinLength,
      passkeyCredentialId: passkeyId || undefined,
      passkeyRegisteredName: passkeyRegistered ? 'Dispositivo actual' : undefined,
      emailAddress: enabledMethods.email ? emailAddress.trim() : undefined,
      phoneNumber: enabledMethods.sms ? phoneNumber.trim() : undefined,
      recoveryCodes,
      usedRecoveryCodes: [],
      autoLockMinutes: 5,
      updatedAt: new Date().toISOString(),
    };

    onComplete(finalConfig);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        />

        {/* Modal Wizard Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative w-full max-w-xl bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 z-10 space-y-6 overflow-hidden"
        >
          {/* Header & Step Dots */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-semibold">
                <Shield className="w-3.5 h-3.5" />
                <span>Configuración de Bóveda Segura</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400">
                <span className={step >= 1 ? 'text-violet-500 font-bold' : ''}>1</span>
                <span>/</span>
                <span className={step >= 2 ? 'text-violet-500 font-bold' : ''}>2</span>
                <span>/</span>
                <span className={step === 3 ? 'text-violet-500 font-bold' : ''}>3</span>
              </div>
            </div>

            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {step === 1 && 'Elige cómo proteger tu Authenticator'}
              {step === 2 && 'Configura tus credenciales de acceso'}
              {step === 3 && 'Tus códigos de respaldo de emergencia'}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {step === 1 &&
                'Para proteger tus códigos 2FA contra accesos no autorizados, activa uno o varios métodos de autenticación cifrados.'}
              {step === 2 &&
                'Establece tu PIN cifrado y los detalles para validar tu identidad cada vez que abras la aplicación.'}
              {step === 3 &&
                'Si alguna vez olvidas tu PIN o no tienes tu teléfono, estos códigos te permitirán desbloquear tu bóveda.'}
            </p>
          </div>

          {/* Error Banner */}
          {stepError && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{stepError}</span>
            </div>
          )}

          {/* PASO 1: SELECCIONAR MÉTODOS */}
          {step === 1 && (
            <div className="space-y-3">
              {/* Option 1: PIN Cifrado */}
              <div
                onClick={() => toggleMethod('pin')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  enabledMethods.pin
                    ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20 ring-1 ring-violet-500/20'
                    : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#222222]'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    enabledMethods.pin
                      ? 'bg-violet-600 text-white'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                  }`}
                >
                  <Key className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      PIN Cifrado en Reposo (Recomendado)
                    </span>
                    <input
                      type="checkbox"
                      checked={enabledMethods.pin}
                      onChange={() => {}}
                      className="rounded accent-violet-600 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Clave numérica de 4 o 6 dígitos. Se almacena con hash criptográfico SHA-256 y sal única; nadie puede ver tu PIN en texto plano.
                  </p>
                </div>
              </div>

              {/* Option 2: Passkey / Biometría */}
              <div
                onClick={() => toggleMethod('passkey')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  enabledMethods.passkey
                    ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20 ring-1 ring-violet-500/20'
                    : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#222222]'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    enabledMethods.passkey
                      ? 'bg-indigo-600 text-white'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                  }`}
                >
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      Passkey / Biometría (Touch ID, Face ID, Windows Hello)
                    </span>
                    <input
                      type="checkbox"
                      checked={enabledMethods.passkey}
                      onChange={() => {}}
                      className="rounded accent-violet-600 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Desbloquea instantáneamente con la huella digital o reconocimiento facial de tu ordenador o dispositivo móvil.
                  </p>
                </div>
              </div>

              {/* Option 3: Verificación por Email */}
              <div
                onClick={() => toggleMethod('email')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  enabledMethods.email
                    ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20 ring-1 ring-violet-500/20'
                    : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#222222]'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    enabledMethods.email
                      ? 'bg-purple-600 text-white'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                  }`}
                >
                  <Mail className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      Código de un solo uso por Correo (Email OTP)
                    </span>
                    <input
                      type="checkbox"
                      checked={enabledMethods.email}
                      onChange={() => {}}
                      className="rounded accent-violet-600 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Recibe un código de 6 dígitos en tu bandeja de correo cada vez que inicies sesión en un nuevo navegador.
                  </p>
                </div>
              </div>

              {/* Option 4: Verificación por SMS */}
              <div
                onClick={() => toggleMethod('sms')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  enabledMethods.sms
                    ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20 ring-1 ring-violet-500/20'
                    : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#222222]'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    enabledMethods.sms
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      Verificación por Mensaje de Texto (SMS OTP)
                    </span>
                    <input
                      type="checkbox"
                      checked={enabledMethods.sms}
                      onChange={() => {}}
                      className="rounded accent-violet-600 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Código de verificación enviado a tu número de teléfono móvil para acceso de doble factor.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: INTRODUCIR Y CONFIRMAR DATOS */}
          {step === 2 && (
            <div className="space-y-4">
              {/* PIN Configuration */}
              {enabledMethods.pin && (
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#222222] border border-neutral-200 dark:border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-violet-500" />
                      <span className="text-xs font-bold text-neutral-900 dark:text-white">
                        Establece tu PIN
                      </span>
                    </div>
                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-neutral-200 dark:bg-[#2c2c2c] text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          setPinLength(4);
                          setPin('');
                          setPinConfirm('');
                        }}
                        className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer ${
                          pinLength === 4
                            ? 'bg-white dark:bg-[#1a1a1a] text-neutral-900 dark:text-white shadow-2xs'
                            : 'text-neutral-500'
                        }`}
                      >
                        4 dígitos
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPinLength(6);
                          setPin('');
                          setPinConfirm('');
                        }}
                        className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer ${
                          pinLength === 6
                            ? 'bg-white dark:bg-[#1a1a1a] text-neutral-900 dark:text-white shadow-2xs'
                            : 'text-neutral-500'
                        }`}
                      >
                        6 dígitos
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        PIN ({pinLength} números)
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={pinLength}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        placeholder={'•'.repeat(pinLength)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-neutral-700 text-center font-mono text-lg tracking-widest text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        Confirma tu PIN
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={pinLength}
                        value={pinConfirm}
                        onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                        placeholder={'•'.repeat(pinLength)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-neutral-700 text-center font-mono text-lg tracking-widest text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Passkey registration */}
              {enabledMethods.passkey && (
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#222222] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Fingerprint className="w-5 h-5 text-indigo-500" />
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                        Vincular Passkey biométrica
                      </h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        {passkeyRegistered
                          ? 'Passkey configurada en este dispositivo con éxito.'
                          : 'Pulsa para registrar Touch ID / Face ID / Windows Hello.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRegisterPasskey}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                      passkeyRegistered
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xs'
                    }`}
                  >
                    {passkeyRegistered ? '✓ Vinculada' : 'Vincular ahora'}
                  </button>
                </div>
              )}

              {/* Email configuration */}
              {enabledMethods.email && (
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#222222] border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                  <label className="block text-xs font-bold text-neutral-900 dark:text-white">
                    Correo para códigos OTP
                  </label>
                  <input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="tu-correo@ejemplo.com"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              )}

              {/* SMS configuration */}
              {enabledMethods.sms && (
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#222222] border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                  <label className="block text-xs font-bold text-neutral-900 dark:text-white">
                    Teléfono móvil para verificación por SMS
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+34 600 000 000"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* PASO 3: CÓDIGOS DE EMERGENCIA */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#222222] border border-neutral-200 dark:border-neutral-800 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {recoveryCodes.map((code) => (
                    <div
                      key={code}
                      className="px-2.5 py-2 rounded-xl bg-white dark:bg-[#1a1a1a] border border-neutral-200/80 dark:border-neutral-700 text-center font-mono font-bold text-xs text-neutral-800 dark:text-neutral-200"
                    >
                      {code}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyCodes}
                    className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-[#282828] border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedCodes ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCodes ? 'Copiados' : 'Copiar Códigos'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadCodes}
                    className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-[#282828] border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar .txt</span>
                  </button>
                </div>
              </div>

              {/* Confirmation Checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasConfirmedCodes}
                  onChange={(e) => setHasConfirmedCodes(e.target.checked)}
                  className="mt-0.5 rounded accent-violet-600 cursor-pointer"
                />
                <span className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  Confirmo que he copiado o descargado mis códigos de recuperación de emergencia y los guardaré en un lugar seguro.
                </span>
              </label>
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800/80">
            {step === 1 ? (
              <div>
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[#282828] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Atrás</span>
              </button>
            )}

            {step === 1 && (
              <button
                type="button"
                onClick={handleGoToStep2}
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Continuar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={handleGoToStep3}
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Continuar a Códigos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                disabled={!hasConfirmedCodes}
                onClick={handleFinishSetup}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Activar y Proteger Bóveda</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
