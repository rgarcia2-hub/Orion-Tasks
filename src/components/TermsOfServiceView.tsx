import React from 'react';
import { motion } from 'motion/react';
import { OrionLogo } from './OrionLogo';
import { FileText, ArrowLeft, CheckCircle2, AlertCircle, Scale } from 'lucide-react';
import { useCalendar } from '../context/CalendarContext';

export const TermsOfServiceView: React.FC = () => {
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
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Condiciones de Servicio</p>
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 mb-3 border border-indigo-200/60 dark:border-indigo-800/40">
              <FileText className="w-3.5 h-3.5" />
              Última actualización: 19 de octubre de 2026
            </div>
            <h1 className="text-3xl font-extrabold text-neutral-950 dark:text-white tracking-tight">
              Condiciones de Servicio de Orion Workspace
            </h1>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Bienvenido a Orion Workspace. Al acceder o utilizar nuestro software, servicios o aplicaciones web asociadas (incluidos Orion Tasks, Orion Calendar y Orion Hub), aceptas estar sujeto a los siguientes términos y condiciones.
            </p>
          </div>

          {/* Section 1 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              1. Descripción del Servicio
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Orion Workspace proporciona un entorno unificado de productividad que integra gestión de tareas mediante tablero Kanban, visualización y organización de calendarios, notas rápidas y sincronización opcional con servicios de Google Calendar y Google Tasks.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-500" />
              2. Cuentas y Responsabilidad del Usuario
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Para utilizar ciertas funcionalidades sincronizadas, puedes conectar tu cuenta de Google. Eres responsable de mantener la seguridad y confidencialidad de tus credenciales y de toda actividad realizada bajo tu cuenta. Te comprometes a no utilizar el servicio para fines ilegales o no autorizados.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              3. Propiedad Intelectual y Licencia
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Todos los derechos de propiedad intelectual relativos a la interfaz, código, marca comercial, logotipos y diseño de Orion Workspace pertenecen a sus respectivos creadores. El usuario conserva la propiedad y derechos totales sobre el contenido de sus tareas, notas e información personal introducida en la plataforma.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Scale className="w-4 h-4 text-rose-500" />
              4. Limitación de Responsabilidad
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Orion Workspace se ofrece "tal cual" (as is) y según disponibilidad. Aunque nos esforzamos al máximo por garantizar una sincronización continua, disponibilidad y seguridad del servicio, no nos hacemos responsables de pérdidas accidentales de datos resultantes de interrupciones de servicios de terceros o fallos ajenos a nuestra infraestructura.
            </p>
          </div>

          {/* Section 5 Contact */}
          <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400">
            <p>
              Si tienes preguntas sobre estas Condiciones del Servicio, puedes contactar con nosotros en: <span className="font-medium text-neutral-800 dark:text-neutral-200">robert.garcia.alsina2012@gmail.com</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
