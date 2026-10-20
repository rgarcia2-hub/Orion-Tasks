import React from 'react';
import { motion } from 'motion/react';
import { OrionLogo } from './OrionLogo';
import { Shield, ArrowLeft, Lock, Database, Eye, RefreshCw } from 'lucide-react';
import { useCalendar } from '../context/CalendarContext';

export const PrivacyPolicyView: React.FC = () => {
  const { navigateToApp } = useCalendar();

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#121212] text-neutral-900 dark:text-neutral-100 transition-colors font-sans py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-8 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <OrionLogo size={36} />
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-neutral-950 to-neutral-700 dark:from-white dark:to-neutral-300 bg-clip-text text-transparent">
                Orion Workspace
              </span>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Política de Privacidad</p>
            </div>
          </div>
          <button
            onClick={() => navigateToApp('hub')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-[#1e1e1e] border border-neutral-200/80 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/80 transition-all shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a Orion
          </button>
        </div>

        {/* Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-8 bg-white dark:bg-[#191919] border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl p-6 sm:p-10 shadow-xs space-y-8"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 mb-3 border border-emerald-200/60 dark:border-emerald-800/40">
              <Shield className="w-3.5 h-3.5" />
              Última actualización: 19 de octubre de 2026
            </div>
            <h1 className="text-3xl font-extrabold text-neutral-950 dark:text-white tracking-tight">
              Política de Privacidad de Orion Workspace
            </h1>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              En Orion Workspace nos tomamos muy en serio la privacidad y protección de los datos de nuestros usuarios. Esta política describe con transparencia qué información se recopila, con qué propósito y cómo se salvaguarda cuando utilizas nuestras aplicaciones (Orion Tasks, Orion Calendar y Orion Workspace Hub).
            </p>
          </div>

          {/* Section 1 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" />
              1. Información que recopilamos
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Orion Workspace recopila únicamente la información estrictamente necesaria para ofrecer las funcionalidades de productividad y gestión de tiempo:
            </p>
            <ul className="list-disc list-inside text-sm text-neutral-600 dark:text-neutral-400 space-y-1.5 pl-2">
              <li><strong>Datos de cuenta Google:</strong> Nombre completo, dirección de correo electrónico y fotografía de perfil proporcionados mediante autenticación segura de Google OAuth / Firebase Authentication.</li>
              <li><strong>Datos de productividad:</strong> Tareas creadas, listas de tareas, notas personales y estados en el tablero Kanban.</li>
              <li><strong>Datos de calendario (con tu permiso explícito):</strong> Eventos, nombres de calendario y horarios leídos a través de la API oficial de Google Calendar.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-500" />
              2. Uso de datos y permisos de Google (Google API Disclosure)
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              El uso que Orion Workspace hace de la información recibida a través de las APIs de Google se ajusta a la <span className="underline decoration-indigo-400">Política de Datos de Usuario de los Servicios de la API de Google</span>, incluidos los requisitos de Uso Limitado:
            </p>
            <div className="bg-neutral-50 dark:bg-[#202020] rounded-xl p-4 border border-neutral-200/60 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-300 space-y-2">
              <p>• Los datos obtenidos de Google Calendar y Google Tasks se utilizan <strong>única y exclusivamente</strong> para mostrarlos en tu panel y permitirte gestionar tus tareas en el tablero Kanban de Orion.</p>
              <p>• <strong>Nunca vendemos, transferimos ni compartimos tus datos personales</strong> con terceros ni empresas de publicidad.</p>
              <p>• No utilizamos tus datos privados de calendario para entrenar modelos generalistas de inteligencia artificial sin tu consentimiento explícito.</p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Eye className="w-4 h-4 text-sky-500" />
              3. Almacenamiento y Seguridad
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Tus tareas, notas y configuraciones de espacio de trabajo se almacenan en la nube segura de Google Cloud Firestore con reglas de seguridad estrictas (Role-Based Access Control). Cada usuario solo puede leer y escribir sus propios documentos identificados por su ID de usuario criptográfico.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-amber-500" />
              4. Control sobre tus datos y eliminación
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Puedes revocar el acceso de Orion Workspace a tu cuenta de Google en cualquier momento desde la página de gestión de permisos de tu cuenta de Google (<a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 underline">myaccount.google.com/permissions</a>). Al desconectar tu cuenta o eliminar tus tareas, estas son eliminadas de la base de datos de Firestore.
            </p>
          </div>

          {/* Section 5 Contact */}
          <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400">
            <p>
              Para cualquier consulta sobre esta Política de Privacidad o la gestión de tus datos en Orion Workspace, puedes ponerte en contacto con el desarrollador responsable en: <span className="font-medium text-neutral-800 dark:text-neutral-200">robert.garcia.alsina2012@gmail.com</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
