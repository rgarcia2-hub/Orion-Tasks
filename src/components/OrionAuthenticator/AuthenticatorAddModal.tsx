import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Camera,
  Upload,
  Key,
  Shield,
  Sparkles,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  FolderPlus,
} from 'lucide-react';
import { AuthenticatorToken, AUTHENTICATOR_PRESETS } from '../../types/authenticator';
import {
  sanitizeSecret,
  isValidBase32,
  parseOtpAuthUri,
  scanQrCodeFromImage,
  scanQrCodeFromVideo,
  generateRandomSecret,
  detectBrandInfo,
} from '../../utils/totp';

interface AuthenticatorAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToken: (token: Omit<AuthenticatorToken, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export const AuthenticatorAddModal: React.FC<AuthenticatorAddModalProps> = ({
  isOpen,
  onClose,
  onAddToken,
}) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'upload' | 'manual'>('manual');

  // Manual Form State
  const [issuer, setIssuer] = useState('');
  const [account, setAccount] = useState('');
  const [secret, setSecret] = useState('');
  const [folder, setFolder] = useState('Personal');
  const [digits, setDigits] = useState(6);
  const [period, setPeriod] = useState(30);
  const [showSecret, setShowSecret] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Camera Scanner State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Image Upload State
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setIssuer('');
      setAccount('');
      setSecret('');
      setFolder('Personal');
      setDigits(6);
      setPeriod(30);
      setErrorMessage(null);
      setCameraError(null);
    } else {
      stopCamera();
    }
  }, [isOpen]);

  // Clean up camera on unmount or tab switch
  useEffect(() => {
    if (activeTab !== 'scan') {
      stopCamera();
    } else if (isOpen) {
      startCamera();
    }
  }, [activeTab, isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        startScanLoop();
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraError('No se pudo acceder a la cámara. Revisa los permisos o usa la opción de subir imagen.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startScanLoop = () => {
    const scan = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const qrData = scanQrCodeFromVideo(videoRef.current);
        if (qrData) {
          handleDetectedQr(qrData);
          return;
        }
      }
      animationFrameRef.current = requestAnimationFrame(scan);
    };
    animationFrameRef.current = requestAnimationFrame(scan);
  };

  const handleDetectedQr = (qrData: string) => {
    stopCamera();
    const parsed = parseOtpAuthUri(qrData);
    if (parsed && parsed.secret) {
      const brand = detectBrandInfo(parsed.issuer || '', parsed.account || '');
      onAddToken({
        issuer: parsed.issuer || 'Servicio 2FA',
        account: parsed.account || 'Cuenta',
        secret: parsed.secret,
        digits: parsed.digits || 6,
        period: parsed.period || 30,
        color: brand.color,
        icon: brand.iconKey,
        folder: 'Personal',
      });
      onClose();
    } else {
      setErrorMessage('El código QR no contiene una URL válida de autenticación 2FA (otpauth://).');
      setActiveTab('manual');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const qrData = scanQrCodeFromImage(img);
        setIsProcessingImage(false);
        if (qrData) {
          handleDetectedQr(qrData);
        } else {
          setErrorMessage('No se encontró ningún código QR legible en la imagen seleccionada.');
        }
      };
      img.onerror = () => {
        setIsProcessingImage(false);
        setErrorMessage('Error al leer el archivo de imagen.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (preset: typeof AUTHENTICATOR_PRESETS[0]) => {
    setIssuer(preset.issuer);
    setDigits(preset.defaultDigits);
    setPeriod(preset.defaultPeriod);
  };

  const handleGenerateTestSecret = () => {
    setSecret(generateRandomSecret());
    if (!issuer) setIssuer('Orion Cloud');
    if (!account) setAccount('usuario@orion.app');
  };

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanSecret = sanitizeSecret(secret);
    if (!cleanSecret) {
      setErrorMessage('Por favor introduce la clave secreta Base32.');
      return;
    }

    if (!isValidBase32(cleanSecret)) {
      setErrorMessage('La clave secreta no es un Base32 válido (solo letras A-Z y números 2-7).');
      return;
    }

    const finalIssuer = issuer.trim() || 'Servicio 2FA';
    const finalAccount = account.trim() || 'Cuenta';
    const brand = detectBrandInfo(finalIssuer, finalAccount);

    onAddToken({
      issuer: finalIssuer,
      account: finalAccount,
      secret: cleanSecret,
      digits,
      period,
      folder: folder.trim() || 'General',
      color: brand.color,
      icon: brand.iconKey,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#1e1e1e] rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 z-10 space-y-5 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Añadir Cuenta de Verificación (2FA)
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Sincronizado y respaldado en tu nube personal
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#282828] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-[#262626] border border-neutral-200/80 dark:border-neutral-700/80">
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'manual'
                  ? 'bg-white dark:bg-[#1a1a1a] text-neutral-900 dark:text-white shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Clave Manual</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-white dark:bg-[#1a1a1a] text-neutral-900 dark:text-white shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Subir Imagen QR</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('scan')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'scan'
                  ? 'bg-white dark:bg-[#1a1a1a] text-neutral-900 dark:text-white shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Escanear con Cámara</span>
            </button>
          </div>

          {/* Global Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: MANUAL ENTRY */}
          {activeTab === 'manual' && (
            <form onSubmit={handleSubmitManual} className="space-y-4">
              {/* Presets Row */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">
                  Servicios Frecuentes
                </label>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  {AUTHENTICATOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-neutral-200 dark:border-neutral-700 hover:border-violet-500 dark:hover:border-violet-500 bg-neutral-50 dark:bg-[#252525] text-neutral-700 dark:text-neutral-300 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Issuer & Account inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Servicio / Proveedor
                  </label>
                  <input
                    type="text"
                    value={issuer}
                    onChange={(e) => setIssuer(e.target.value)}
                    placeholder="Ej. Google, GitHub, AWS"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#262626] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Usuario / Correo
                  </label>
                  <input
                    type="text"
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    placeholder="Ej. usuario@gmail.com"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#262626] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>
              </div>

              {/* Secret Key Input with visibility toggle & test generator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    Clave Secreta (Base32)
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateTestSecret}
                    className="text-[11px] text-violet-600 dark:text-violet-400 hover:underline inline-flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generar clave de prueba</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    placeholder="Ej. JBSWY3DPEHPK3PXP"
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-neutral-50 dark:bg-[#262626] border border-neutral-200 dark:border-neutral-700 text-xs font-mono text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-violet-500 uppercase tracking-widest"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 cursor-pointer"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">
                  Introduce el código alfanumérico que te proporciona la plataforma al activar la verificación en dos pasos.
                </p>
              </div>

              {/* Advanced Options: Folder, Digits, Period */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    Carpeta
                  </label>
                  <select
                    value={folder}
                    onChange={(e) => setFolder(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-neutral-50 dark:bg-[#262626] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer"
                  >
                    <option value="Personal">Personal</option>
                    <option value="Trabajo">Trabajo</option>
                    <option value="Finanzas">Finanzas</option>
                    <option value="Dev">Dev / Código</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    Dígitos
                  </label>
                  <select
                    value={digits}
                    onChange={(e) => setDigits(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-neutral-50 dark:bg-[#262626] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer"
                  >
                    <option value={6}>6 dígitos (estándar)</option>
                    <option value={8}>8 dígitos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    Intervalo
                  </label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-neutral-50 dark:bg-[#262626] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer"
                  >
                    <option value={30}>30 segundos</option>
                    <option value={60}>60 segundos</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800/80">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[#282828] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!secret.trim()}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Credencial</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: UPLOAD QR IMAGE */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-violet-500 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer bg-neutral-50/60 dark:bg-[#242424]/60 transition-colors group"
              >
                <div className="w-12 h-12 rounded-2xl bg-violet-600/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  {isProcessingImage ? 'Escaneando código QR...' : 'Selecciona o suelta la captura del código QR'}
                </h4>
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500 max-w-xs mt-1">
                  Sube una captura de pantalla del código QR proporcionado por Google, GitHub, etc. Orion extraerá la clave automáticamente.
                </p>
                <button
                  type="button"
                  className="mt-4 px-4 py-1.5 rounded-xl bg-white dark:bg-[#2f2f2f] border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200 shadow-2xs group-hover:border-violet-500"
                >
                  Examinar archivos
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: CAMERA SCANNER */}
          {activeTab === 'scan' && (
            <div className="space-y-4">
              <div className="relative w-full h-64 rounded-2xl bg-black overflow-hidden border border-neutral-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />

                {/* Scanning reticle / overlay */}
                <div className="absolute inset-0 border-2 border-violet-500/40 pointer-events-none flex items-center justify-center">
                  <div className="w-44 h-44 border-2 border-violet-400 rounded-2xl relative shadow-lg">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white" />
                  </div>
                </div>

                {cameraError && (
                  <div className="absolute inset-0 bg-neutral-900/90 p-4 text-center flex flex-col items-center justify-center text-white text-xs space-y-2">
                    <AlertCircle className="w-6 h-6 text-rose-400" />
                    <span>{cameraError}</span>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-center text-neutral-500 dark:text-neutral-400">
                Apunta con tu cámara al código QR en la pantalla de la web para añadir la cuenta al instante.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
