import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  X,
  Key,
  Fingerprint,
  Mail,
  Smartphone,
  Lock,
  Clock,
  LifeBuoy,
  Check,
  Copy,
  Download,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  AuthenticatorSecurityConfig,
  UnlockMethodType,
} from '../../types/authenticatorSecurity';
import {
  generateSalt,
  hashPin,
  verifyPin,
  generateRecoveryCodes,
  registerPasskey,
} from '../../utils/securityCrypto';

interface AuthenticatorSecuritySettingsModalProps {
  isOpen: boolean;
  config: AuthenticatorSecurityConfig;
  userEmail?: string | null;
  onClose: () => void;
  onSaveConfig: (updated: AuthenticatorSecurityConfig) => void;
  onLockNow: () => void;
}

export const AuthenticatorSecuritySettingsModal: React.FC<
  AuthenticatorSecuritySettingsModalProps
> = ({ isOpen, config, userEmail, onClose, onSaveConfig, onLockNow }) => {
  const [activeTab, setActiveTab] = useState<'methods' | 'pin' | 'autolock' | 'recovery'>('methods');

  // Methods state
  const [enabledMethods, setEnabledMethods] = useState(config.enabledMethods);
  const [primaryMethod, setPrimaryMethod] = useState<UnlockMethodType>(config.primaryMethod);
  const [emailAddress, setEmailAddress] = useState(config.emailAddress || userEmail || '');
  const [phoneNumber, setPhoneNumber] = useState(config.phoneNumber || '');

  // PIN change state
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinLength, setPinLength] = useState<4 | 6>(config.pinLength === 6 ? 6 : 4);
  const [pinChangeError, setPinChangeError] = useState<string | null>(null);
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);

  // Auto-lock state
  const [autoLockMinutes, setAutoLockMinutes] = useState<number>(config.autoLockMinutes ?? 5);

  // Recovery codes state
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>(config.recoveryCodes || []);
  const [usedCodes, setUsedCodes] = useState<string[]>(config.usedRecoveryCodes || []);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [regeneratingCodes, setRegeneratingCodes] = useState(false);

  // Passkey registration
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyRegistered, setPasskeyRegistered] = useState(Boolean(config.passkeyCredentialId));
  const [passkeyError, setPasskeyError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleMethod = (method: 'pin' | 'passkey' | 'email' | 'sms') => {
    const isCurrent = enabledMethods[method];
    if (isCurrent) {
      const activeCount = Object.values(enabledMethods).filter(Boolean).length;
      if (activeCount <= 1) return; // Must have at least 1 method
    }

    const next = { ...enabledMethods, [method]: !isCurrent };
    setEnabledMethods(next);

    if (!next[primaryMethod]) {
      const fallback = (Object.keys(next) as (keyof typeof next)[]).find((k) => next[k]);
      if (fallback) setPrimaryMethod(fallback);
    }
  };

  const handleRegisterNewPasskey = async () => {
    setPasskeyLoading(true);
    setPasskeyError(null);
    try {
      const res = await registerPasskey(emailAddress || userEmail || 'Usuario Orion');
      setPasskeyRegistered(true);
      const updated: AuthenticatorSecurityConfig = {
        ...config,
        passkeyCredentialId: res.credentialId,
        enabledMethods: { ...enabledMethods, passkey: true },
        updatedAt: new Date().toISOString(),
      };
      onSaveConfig(updated);
    } catch (err: any) {
      setPasskeyError(err?.message || 'Error al registrar Passkey en este dispositivo.');
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeError(null);
    setPinChangeSuccess(false);

    // Validate current PIN if existing
    if (config.pinSalt && config.pinHash) {
      const isValid = await verifyPin(currentPin, config.pinSalt, config.pinHash);
      if (!isValid) {
        setPinChangeError('El PIN actual no es correcto.');
        return;
      }
    }

    if (newPin.length !== pinLength) {
      setPinChangeError(`El nuevo PIN debe tener exactamente ${pinLength} dígitos.`);
      return;
    }

    if (newPin !== confirmPin) {
      setPinChangeError('El nuevo PIN y su confirmación no coinciden.');
      return;
    }

    const newSalt = generateSalt(16);
    const newHash = await hashPin(newPin, newSalt);

    const updated: AuthenticatorSecurityConfig = {
      ...config,
      pinSalt: newSalt,
      pinHash: newHash,
      pinLength,
      updatedAt: new Date().toISOString(),
    };

    onSaveConfig(updated);
    setPinChangeSuccess(true);
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
  };

  const handleSaveMethods = () => {
    const updated: AuthenticatorSecurityConfig = {
      ...config,
      enabledMethods,
      primaryMethod,
      emailAddress: emailAddress.trim() || undefined,
      phoneNumber: phoneNumber.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };
    onSaveConfig(updated);
    onClose();
  };

  const handleSaveAutoLock = (mins: number) => {
    setAutoLockMinutes(mins);
    const updated: AuthenticatorSecurityConfig = {
      ...config,
      autoLockMinutes: mins,
      updatedAt: new Date().toISOString(),
    };
    onSaveConfig(updated);
  };

  const handleRegenerateRecoveryCodes = () => {
    setRegeneratingCodes(true);
    const fresh = generateRecoveryCodes(6);
    setRecoveryCodes(fresh);
    setUsedCodes([]);

    const updated: AuthenticatorSecurityConfig = {
      ...config,
      recoveryCodes: fresh,
      usedRecoveryCodes: [],
      updatedAt: new Date().toISOString(),
    };
    onSaveConfig(updated);
    setTimeout(() => setRegeneratingCodes(false), 400);
  };

  const handleCopyCodes = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join('\n'));
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    } catch {}
  };

  const handleDownloadCodes = () => {
    const content = `ORION WORKSPACE - CODIGOS DE RECUPERACION DE BÓVEDA\nGenerado: ${new Date().toLocaleString()}\nUsuario: ${
      userEmail || 'Local'
    }\n\n${recoveryCodes.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nGuarda estos códigos en un lugar seguro y secreto.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orion-vault-recovery-codes-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-xl rounded-3xl bg-[#141418] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Seguridad de la Bóveda</h2>
              <p className="text-xs text-neutral-400">
                Gestiona métodos de desbloqueo, cifrado y recuperación
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('methods')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'methods'
                ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Métodos de Acceso
          </button>
          <button
            onClick={() => setActiveTab('pin')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'pin'
                ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Cambiar PIN
          </button>
          <button
            onClick={() => setActiveTab('autolock')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'autolock'
                ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Bloqueo Automático
          </button>
          <button
            onClick={() => setActiveTab('recovery')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'recovery'
                ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Códigos de Respaldo
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: METHODS */}
          {activeTab === 'methods' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Métodos Habilitados
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Selecciona qué credenciales pueden abrir tu bóveda.
                </p>
              </div>

              {/* PIN Toggle */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">PIN Criptográfico</div>
                    <div className="text-[11px] text-neutral-400">
                      PIN cifrado con salt SHA-256 ({config.pinLength || 4} dígitos)
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleMethod('pin')}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    enabledMethods.pin ? 'bg-violet-600' : 'bg-neutral-800'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                      enabledMethods.pin ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Passkey Toggle */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Fingerprint className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">
                      Passkey / Biometría
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      Touch ID, Face ID o Windows Hello
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!passkeyRegistered && (
                    <button
                      type="button"
                      onClick={handleRegisterNewPasskey}
                      disabled={passkeyLoading}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium cursor-pointer"
                    >
                      {passkeyLoading ? 'Registrando...' : 'Registrar'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleMethod('passkey')}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      enabledMethods.passkey ? 'bg-violet-600' : 'bg-neutral-800'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                        enabledMethods.passkey ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {passkeyError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                  {passkeyError}
                </div>
              )}

              {/* Email OTP */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Código por Correo</div>
                      <div className="text-[11px] text-neutral-400">
                        Código de 6 dígitos enviado por correo
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleMethod('email')}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      enabledMethods.email ? 'bg-violet-600' : 'bg-neutral-800'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                        enabledMethods.email ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
                {enabledMethods.email && (
                  <input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="ejemplo@orion.app"
                    className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
                  />
                )}
              </div>

              {/* SMS OTP */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Código por SMS</div>
                      <div className="text-[11px] text-neutral-400">
                        Código enviado a tu teléfono móvil
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleMethod('sms')}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      enabledMethods.sms ? 'bg-violet-600' : 'bg-neutral-800'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                        enabledMethods.sms ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
                {enabledMethods.sms && (
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+34 600 000 000"
                    className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                  />
                )}
              </div>

              {/* Primary Method Selector */}
              <div className="pt-2">
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Método de desbloqueo preferido al entrar
                </label>
                <select
                  value={primaryMethod}
                  onChange={(e) => setPrimaryMethod(e.target.value as UnlockMethodType)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  {enabledMethods.pin && <option value="pin">PIN Criptográfico</option>}
                  {enabledMethods.passkey && (
                    <option value="passkey">Passkey / Biometría</option>
                  )}
                  {enabledMethods.email && (
                    <option value="email">Código por Correo</option>
                  )}
                  {enabledMethods.sms && <option value="sms">Código por SMS</option>}
                </select>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveMethods}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Guardar Configuración
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PIN */}
          {activeTab === 'pin' && (
            <form onSubmit={handleChangePin} className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Modificar PIN de la Bóveda
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Tu PIN nunca se guarda en texto plano; se cifra con un salt único mediante
                  SHA-256.
                </p>
              </div>

              {/* Length selector */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-400">Longitud del PIN:</span>
                <div className="flex rounded-xl bg-black/40 p-0.5 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setPinLength(4)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                      pinLength === 4 ? 'bg-violet-600 text-white' : 'text-neutral-400'
                    }`}
                  >
                    4 Dígitos
                  </button>
                  <button
                    type="button"
                    onClick={() => setPinLength(6)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                      pinLength === 6 ? 'bg-violet-600 text-white' : 'text-neutral-400'
                    }`}
                  >
                    6 Dígitos
                  </button>
                </div>
              </div>

              {/* Current PIN */}
              {config.pinHash && (
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">
                    PIN actual
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-mono tracking-widest text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              )}

              {/* New PIN */}
              <div>
                <label className="block text-xs text-neutral-400 mb-1">
                  Nuevo PIN ({pinLength} dígitos)
                </label>
                <input
                  type="password"
                  maxLength={pinLength}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-mono tracking-widest text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              {/* Confirm New PIN */}
              <div>
                <label className="block text-xs text-neutral-400 mb-1">
                  Confirmar nuevo PIN
                </label>
                <input
                  type="password"
                  maxLength={pinLength}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-mono tracking-widest text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              {pinChangeError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                  {pinChangeError}
                </div>
              )}

              {pinChangeSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>PIN actualizado y cifrado con éxito.</span>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Actualizar PIN
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: AUTO-LOCK */}
          {activeTab === 'autolock' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Tiempo de Bloqueo Inactivo
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  La bóveda se bloqueará automáticamente cuando salgas de la pestaña o estés
                  inactivo.
                </p>
              </div>

              <div className="space-y-2">
                {[
                  { value: 0, label: 'Inmediatamente al salir de la pestaña' },
                  { value: 5, label: '5 minutos de inactividad (Recomendado)' },
                  { value: 15, label: '15 minutos de inactividad' },
                  { value: 30, label: '30 minutos de inactividad' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSaveAutoLock(opt.value)}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                      autoLockMinutes === opt.value
                        ? 'bg-violet-600/15 border-violet-500/40 text-violet-200'
                        : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5 text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-neutral-400" />
                      <span className="text-xs font-medium">{opt.label}</span>
                    </div>
                    {autoLockMinutes === opt.value && (
                      <Check className="w-4 h-4 text-violet-400" />
                    )}
                  </button>
                ))}
              </div>

              {/* Instant Lock action */}
              <div className="pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-white">Bloqueo Instantáneo</h4>
                    <p className="text-[11px] text-neutral-400">
                      Cierra y protege la bóveda ahora mismo
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLockNow();
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Bloquear Ahora</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RECOVERY CODES */}
          {activeTab === 'recovery' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    Códigos de Emergencia
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Permiten entrar si pierdes el PIN o tu dispositivo biométrico.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRegenerateRecoveryCodes}
                  disabled={regeneratingCodes}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-neutral-300 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${regeneratingCodes ? 'animate-spin' : ''}`}
                  />
                  <span>Regenerar</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {recoveryCodes.map((code, idx) => {
                  const isUsed = usedCodes.includes(code);
                  return (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border font-mono text-xs text-center ${
                        isUsed
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400/60 line-through'
                          : 'bg-black/40 border-white/10 text-violet-300 font-bold'
                      }`}
                    >
                      {code}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCopyCodes}
                  className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedCodes ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copiado al portapapeles</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Todos</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCodes}
                  className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar .txt</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
