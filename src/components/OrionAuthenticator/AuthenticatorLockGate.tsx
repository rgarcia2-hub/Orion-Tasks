import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Lock,
  Key,
  Fingerprint,
  Mail,
  Smartphone,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  LifeBuoy,
  Delete,
  Sparkles,
} from 'lucide-react';
import {
  AuthenticatorSecurityConfig,
  UnlockMethodType,
} from '../../types/authenticatorSecurity';
import {
  verifyPin,
  verifyPasskey,
  generateOtpCode,
  notifyOtpDispatched,
} from '../../utils/securityCrypto';

interface AuthenticatorLockGateProps {
  config: AuthenticatorSecurityConfig;
  userEmail?: string | null;
  onUnlock: (updatedConfig?: AuthenticatorSecurityConfig) => void;
}

export const AuthenticatorLockGate: React.FC<AuthenticatorLockGateProps> = ({
  config,
  userEmail,
  onUnlock,
}) => {
  const [activeMethod, setActiveMethod] = useState<UnlockMethodType | 'recovery'>(
    config.primaryMethod || 'pin'
  );

  // PIN state
  const [pinDigits, setPinDigits] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Passkey state
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);

  // Email / SMS OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [expectedOtp, setExpectedOtp] = useState<string | null>(null);
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpNotificationBanner, setOtpNotificationBanner] = useState<{
    type: 'email' | 'sms';
    destination: string;
    code: string;
  } | null>(null);

  // Emergency Recovery Code state
  const [recoveryCodeInput, setRecoveryCodeInput] = useState('');
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  // Show method selector dropdown/drawer
  const [showMethodPicker, setShowMethodPicker] = useState(false);

  const pinLength = config.pinLength || 4;

  // Handle countdown timer for OTP resend
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // Physical keyboard support for PIN
  useEffect(() => {
    if (activeMethod !== 'pin') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleAppendPinDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDeletePinDigit();
      } else if (e.key === 'Escape') {
        handleClearPin();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMethod, pinDigits, pinLength]);

  // Handle PIN input digit
  const handleAppendPinDigit = (digit: string) => {
    if (isVerifying) return;
    setPinError(null);

    const nextPin = pinDigits + digit;
    if (nextPin.length <= pinLength) {
      setPinDigits(nextPin);
      if (nextPin.length === pinLength) {
        verifyEnteredPin(nextPin);
      }
    }
  };

  const handleDeletePinDigit = () => {
    if (isVerifying) return;
    setPinDigits((prev) => prev.slice(0, -1));
    setPinError(null);
  };

  const handleClearPin = () => {
    if (isVerifying) return;
    setPinDigits('');
    setPinError(null);
  };

  // Verify PIN with salted SHA-256
  const verifyEnteredPin = async (candidatePin: string) => {
    if (!config.pinSalt || !config.pinHash) {
      setPinError('Error de configuración de seguridad.');
      return;
    }

    setIsVerifying(true);
    try {
      const isValid = await verifyPin(candidatePin, config.pinSalt, config.pinHash);
      if (isValid) {
        onUnlock();
      } else {
        triggerShake();
        setPinError('PIN incorrecto. Inténtalo de nuevo.');
        setPinDigits('');
      }
    } catch {
      setPinError('Error al validar credenciales criptográficas.');
    } finally {
      setIsVerifying(false);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // Verify Passkey (invokes real native Touch ID / Face ID / Windows Hello)
  const handleVerifyPasskey = async () => {
    setPasskeyLoading(true);
    setPasskeyError(null);
    try {
      const result = await verifyPasskey(config.passkeyCredentialId);
      if (result.success) {
        onUnlock();
      } else {
        setPasskeyError(result.error || 'La autenticación con Passkey fue cancelada o no coincidió.');
      }
    } catch (err: any) {
      setPasskeyError(err?.message || 'Error al comunicarse con el autenticador biométrico.');
    } finally {
      setPasskeyLoading(false);
    }
  };

  // Trigger Passkey automatically if primary on initial mount
  const hasAutoTriggeredPasskeyRef = useRef(false);
  useEffect(() => {
    if (activeMethod === 'passkey' && config.enabledMethods.passkey && !hasAutoTriggeredPasskeyRef.current) {
      hasAutoTriggeredPasskeyRef.current = true;
      handleVerifyPasskey();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMethod]);

  // Request Email OTP
  const handleSendEmailOtp = () => {
    const destination = config.emailAddress || userEmail || 'tu correo registrado';
    const code = generateOtpCode();
    setExpectedOtp(code);
    setOtpSent(true);
    setEnteredOtp('');
    setOtpError(null);
    setOtpCountdown(45);

    notifyOtpDispatched('email', destination, code);
    setOtpNotificationBanner({
      type: 'email',
      destination,
      code,
    });
  };

  // Request SMS OTP
  const handleSendSmsOtp = () => {
    const destination = config.phoneNumber || 'tu teléfono móvil';
    const code = generateOtpCode();
    setExpectedOtp(code);
    setOtpSent(true);
    setEnteredOtp('');
    setOtpError(null);
    setOtpCountdown(45);

    notifyOtpDispatched('sms', destination, code);
    setOtpNotificationBanner({
      type: 'sms',
      destination,
      code,
    });
  };

  // Verify OTP
  const handleVerifyOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!expectedOtp || enteredOtp.trim() !== expectedOtp.trim()) {
      setOtpError('Código de verificación incorrecto.');
      triggerShake();
      return;
    }
    onUnlock();
  };

  // Verify Emergency Recovery Code
  const handleVerifyRecoveryCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = recoveryCodeInput.trim().toUpperCase();
    if (!cleanInput) {
      setRecoveryError('Ingresa un código de recuperación.');
      return;
    }

    const availableCodes = config.recoveryCodes || [];
    const used = config.usedRecoveryCodes || [];

    if (used.includes(cleanInput)) {
      setRecoveryError('Este código de emergencia ya fue utilizado anteriormente.');
      triggerShake();
      return;
    }

    if (!availableCodes.includes(cleanInput)) {
      setRecoveryError('Código de recuperación inválido o desconocido.');
      triggerShake();
      return;
    }

    // Mark code as used and unlock
    const updated: AuthenticatorSecurityConfig = {
      ...config,
      usedRecoveryCodes: [...used, cleanInput],
      updatedAt: new Date().toISOString(),
    };

    onUnlock(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0a0c]/90 backdrop-blur-xl select-none">
      {/* Background ambient cosmic glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[130px]" />
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[130px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Real-time simulated OTP banner for testing/demo environments */}
        <AnimatePresence>
          {otpNotificationBanner && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="mb-4 p-4 rounded-2xl bg-neutral-900/95 border border-violet-500/30 shadow-2xl backdrop-blur-md text-xs text-neutral-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                    {otpNotificationBanner.type === 'email' ? (
                      <Mail className="w-3.5 h-3.5" />
                    ) : (
                      <Smartphone className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <span>Simulación de Envío OTP</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300 font-mono">
                        EN VIVO
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Código enviado a {otpNotificationBanner.destination}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOtpNotificationBanner(null)}
                  className="text-neutral-500 hover:text-neutral-300 text-[11px]"
                >
                  ✕
                </button>
              </div>
              <div className="mt-2.5 p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                <span className="font-mono text-base font-bold tracking-widest text-violet-300">
                  {otpNotificationBanner.code}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEnteredOtp(otpNotificationBanner.code);
                    setOtpNotificationBanner(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-medium"
                >
                  Autorrellenar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lock Card Container */}
        <motion.div
          animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="rounded-3xl bg-[#141418]/90 border border-white/10 shadow-2xl backdrop-blur-2xl p-6 sm:p-8 overflow-hidden"
        >
          {/* Top Brand & Status */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-violet-500/20">
                <div className="w-full h-full rounded-[14px] bg-[#0f0f13] flex items-center justify-center">
                  <Shield className="w-8 h-8 text-violet-400" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-violet-500 border-2 border-[#141418] flex items-center justify-center text-white shadow-xs">
                <Lock className="w-3 h-3" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-white tracking-tight">
              Bóveda de Autenticación
            </h2>
            <p className="text-xs text-neutral-400 mt-1 max-w-xs">
              {userEmail
                ? `Protegida para ${userEmail}`
                : 'Acceso seguro con cifrado criptográfico'}
            </p>
          </div>

          {/* 1. PIN MODE */}
          {activeMethod === 'pin' && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-xs text-neutral-400 mb-3">
                  Ingresa tu PIN de {pinLength} dígitos
                </p>

                {/* PIN Visual Indicators */}
                <div className="flex items-center justify-center gap-3 py-2">
                  {Array.from({ length: pinLength }).map((_, idx) => {
                    const isFilled = idx < pinDigits.length;
                    return (
                      <motion.div
                        key={idx}
                        animate={
                          isFilled
                            ? { scale: [1, 1.25, 1], backgroundColor: '#a855f7' }
                            : { scale: 1, backgroundColor: 'rgba(255,255,255,0.08)' }
                        }
                        className={`w-4 h-4 rounded-full border transition-colors ${
                          isFilled
                            ? 'border-violet-400 shadow-sm shadow-violet-500/50'
                            : 'border-white/20'
                        }`}
                      />
                    );
                  })}
                </div>

                {pinError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-rose-400 mt-2 font-medium"
                  >
                    {pinError}
                  </motion.p>
                )}
              </div>

              {/* On-screen Numeric Keypad */}
              <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleAppendPinDigit(digit.toString())}
                    className="h-14 rounded-2xl bg-white/[0.04] hover:bg-white/[0.1] active:bg-violet-600/30 border border-white/5 active:border-violet-500/50 text-xl font-medium text-white transition-all cursor-pointer flex items-center justify-center shadow-xs"
                  >
                    {digit}
                  </button>
                ))}

                {/* Clear / Cancel */}
                <button
                  type="button"
                  onClick={handleClearPin}
                  className="h-14 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center border border-transparent"
                >
                  Borrar
                </button>

                {/* Zero */}
                <button
                  type="button"
                  onClick={() => handleAppendPinDigit('0')}
                  className="h-14 rounded-2xl bg-white/[0.04] hover:bg-white/[0.1] active:bg-violet-600/30 border border-white/5 active:border-violet-500/50 text-xl font-medium text-white transition-all cursor-pointer flex items-center justify-center shadow-xs"
                >
                  0
                </button>

                {/* Backspace */}
                <button
                  type="button"
                  onClick={handleDeletePinDigit}
                  className="h-14 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] text-neutral-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center border border-transparent"
                  title="Eliminar último dígito"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* 2. PASSKEY MODE */}
          {activeMethod === 'passkey' && (
            <div className="text-center space-y-6 py-4">
              <div className="w-20 h-20 rounded-3xl bg-violet-500/10 border border-violet-500/25 mx-auto flex items-center justify-center text-violet-400">
                <Fingerprint className="w-10 h-10 animate-pulse" />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white">
                  Autenticación Biométrica / Passkey
                </h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
                  Utiliza Touch ID, Face ID o Windows Hello registrado para abrir la bóveda.
                </p>
              </div>

              {passkeyError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                  {passkeyError}
                </div>
              )}

              <button
                type="button"
                onClick={handleVerifyPasskey}
                disabled={passkeyLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-violet-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                {passkeyLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verificando Passkey...</span>
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4" />
                    <span>Autenticar con Passkey</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* 3. EMAIL OTP MODE */}
          {activeMethod === 'email' && (
            <div className="space-y-4 py-2">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center mb-2">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-white">
                  Verificación por Correo
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Enviaremos un código a {config.emailAddress || userEmail || 'tu correo'}
                </p>
              </div>

              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleSendEmailOtp}
                  className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>Enviar Código de 6 Dígitos</span>
                </button>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1.5">
                      Código de 6 dígitos
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      autoFocus
                      className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-center font-mono text-xl tracking-widest text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {otpError && (
                    <p className="text-xs text-rose-400 font-medium text-center">
                      {otpError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={enteredOtp.length < 6}
                    className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-semibold transition-all cursor-pointer"
                  >
                    Verificar y Entrar
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      disabled={otpCountdown > 0}
                      onClick={handleSendEmailOtp}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 disabled:text-neutral-500"
                    >
                      {otpCountdown > 0
                        ? `Reenviar en ${otpCountdown}s`
                        : 'Reenviar código por correo'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* 4. SMS OTP MODE */}
          {activeMethod === 'sms' && (
            <div className="space-y-4 py-2">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-2">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-white">
                  Verificación por SMS
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Código al teléfono {config.phoneNumber || 'registrado'}
                </p>
              </div>

              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleSendSmsOtp}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Enviar SMS de Verificación</span>
                </button>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1.5">
                      Código recibido por SMS
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      autoFocus
                      className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-center font-mono text-xl tracking-widest text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {otpError && (
                    <p className="text-xs text-rose-400 font-medium text-center">
                      {otpError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={enteredOtp.length < 6}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold transition-all cursor-pointer"
                  >
                    Verificar y Entrar
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      disabled={otpCountdown > 0}
                      onClick={handleSendSmsOtp}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 disabled:text-neutral-500"
                    >
                      {otpCountdown > 0
                        ? `Reenviar en ${otpCountdown}s`
                        : 'Reenviar código por SMS'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* 5. EMERGENCY RECOVERY CODE MODE */}
          {activeMethod === 'recovery' && (
            <form onSubmit={handleVerifyRecoveryCode} className="space-y-4 py-2">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center mb-2">
                  <LifeBuoy className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-white">
                  Código de Emergencia
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Usa uno de tus códigos de recuperación guardados (ORION-XXXX-XXXX)
                </p>
              </div>

              <div>
                <input
                  type="text"
                  value={recoveryCodeInput}
                  onChange={(e) => setRecoveryCodeInput(e.target.value)}
                  placeholder="ORION-4829-1920"
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-center font-mono text-sm tracking-wider text-white uppercase focus:outline-none focus:border-amber-500"
                />
              </div>

              {recoveryError && (
                <p className="text-xs text-rose-400 font-medium text-center">
                  {recoveryError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-all cursor-pointer"
              >
                Desbloquear con Código de Emergencia
              </button>
            </form>
          )}

          {/* Bottom Switcher & Emergency Code Options */}
          <div className="mt-6 pt-5 border-t border-white/10 flex flex-col gap-2">
            {/* Alternative methods */}
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setShowMethodPicker(!showMethodPicker)}
                className="text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Otro método de desbloqueo</span>
                <span className="text-[10px]">▾</span>
              </button>

              {activeMethod !== 'recovery' && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveMethod('recovery');
                    setShowMethodPicker(false);
                  }}
                  className="text-neutral-400 hover:text-amber-400 text-[11px] transition-colors cursor-pointer"
                >
                  ¿Olvidaste tu clave?
                </button>
              )}
            </div>

            {/* Dropdown for other methods */}
            <AnimatePresence>
              {showMethodPicker && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden pt-2 space-y-1.5"
                >
                  {config.enabledMethods.pin && activeMethod !== 'pin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMethod('pin');
                        setShowMethodPicker(false);
                      }}
                      className="w-full p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] flex items-center gap-2.5 text-xs text-neutral-200 cursor-pointer"
                    >
                      <Key className="w-4 h-4 text-violet-400" />
                      <span>PIN Criptográfico</span>
                    </button>
                  )}

                  {config.enabledMethods.passkey && activeMethod !== 'passkey' && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMethod('passkey');
                        setShowMethodPicker(false);
                      }}
                      className="w-full p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] flex items-center gap-2.5 text-xs text-neutral-200 cursor-pointer"
                    >
                      <Fingerprint className="w-4 h-4 text-indigo-400" />
                      <span>Passkey / Biometría</span>
                    </button>
                  )}

                  {config.enabledMethods.email && activeMethod !== 'email' && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMethod('email');
                        setShowMethodPicker(false);
                      }}
                      className="w-full p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] flex items-center gap-2.5 text-xs text-neutral-200 cursor-pointer"
                    >
                      <Mail className="w-4 h-4 text-cyan-400" />
                      <span>Código por Correo</span>
                    </button>
                  )}

                  {config.enabledMethods.sms && activeMethod !== 'sms' && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMethod('sms');
                        setShowMethodPicker(false);
                      }}
                      className="w-full p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] flex items-center gap-2.5 text-xs text-neutral-200 cursor-pointer"
                    >
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      <span>Código por SMS</span>
                    </button>
                  )}

                  {activeMethod !== 'recovery' && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMethod('recovery');
                        setShowMethodPicker(false);
                      }}
                      className="w-full p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] flex items-center gap-2.5 text-xs text-amber-300 cursor-pointer"
                    >
                      <LifeBuoy className="w-4 h-4 text-amber-400" />
                      <span>Código de Recuperación de Emergencia</span>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
