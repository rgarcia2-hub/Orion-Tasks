# Orion Authenticator: Sistema de Seguridad Criptográfica Multicapa

Implementación del sistema integral de seguridad para la bóveda de credenciales 2FA en **Orion Authenticator**, garantizando máxima protección, cero almacenamiento en texto plano, y sincronización en la nube a través de Google Firebase Firestore.

---

## 1. Características Implementadas

### A. Asistente de Configuración Inicial Obligatorio (`AuthenticatorSetupWizard`)
- Se activa de forma automática la primera vez que el usuario abre **Orion Authenticator**.
- Proceso guiado en 3 pasos con diseño glassmorphic de Orion:
  1. **Selección de Métodos**: El usuario activa los métodos deseados (PIN, Passkey, Correo, SMS) y define su método preferido al entrar.
  2. **Configuración de Credenciales**:
     - **PIN Criptográfico**: Elección entre 4 o 6 dígitos con confirmación y hashing inmediato.
     - **Passkey / Biometría**: Registro mediante WebAuthn (`navigator.credentials.create`) con Face ID, Touch ID o Windows Hello.
     - **Correo de Verificación**: Validación de dirección de email para códigos OTP de 6 dígitos.
     - **Teléfono SMS**: Registro de número telefónico para recepción de códigos SMS.
  3. **Códigos de Respaldo de Emergencia**: Generación de 6 códigos criptográficos de un solo uso (`ORION-XXXX-XXXX`) con opciones para copiar al portapapeles o descargar en archivo `.txt`.

### B. Pantalla de Bloqueo Criptográfica (`AuthenticatorLockGate`)
- Interfaz que bloquea el acceso a todas las credenciales 2FA de la bóveda:
  - **Modo PIN**: Teclado numérico en pantalla + soporte para teclado físico (números 0-9, Backspace, Borrar, Enter), indicadores visuales de dígitos, animación *shake* en caso de error y validación con `verifyPin()`.
  - **Modo Passkey**: Desbloqueo instantáneo con lector biométrico o llave de seguridad FIDO2.
  - **Modo Correo / SMS**: Generador de código OTP de 6 dígitos con simulación visual en vivo y temporizador de reenvío.
  - **Código de Emergencia**: Permite ingresar un código de recuperación si el usuario no recuerda su PIN o no tiene acceso a sus dispositivos.
  - **Conmutador de Métodos**: Menú desplegable para alternar en cualquier momento entre todos los métodos habilitados.

### C. Criptografía y Cero Texto Plano (`securityCrypto.ts`)
- **Hashing SHA-256 con Salt Criptográfico**: El PIN nunca se almacena en texto claro; se genera un salt aleatorio de 16 bytes mediante Web Crypto API (`window.crypto.getRandomValues`) y se computa el hash `SHA-256` con `window.crypto.subtle.digest`.
- **Passkeys Nativas WebAuthn**: Compatible con el estándar FIDO2 / W3C WebAuthn para autenticación de plataforma.
- **Códigos de Recuperación**: Códigos de emergencia no repetibles que se marcan como consumidos una vez utilizados.

### D. Modal de Gestión de Seguridad (`AuthenticatorSecuritySettingsModal`)
- Accesible en cualquier momento desde el botón **"Seguridad"** de la cabecera:
  - **Métodos de Acceso**: Activar o desactivar PIN, Passkey, Correo o SMS, y cambiar el método predeterminado.
  - **Cambio de PIN**: Verificación del PIN actual, selección de longitud (4 o 6 dígitos), validación y recálculo de salt y hash.
  - **Bloqueo Automático**: Configuración del temporizador de inactividad (Inmediatamente al salir de la pestaña, 5 min, 15 min, 30 min) y botón **"Bloquear Ahora"**.
  - **Gestión de Códigos de Emergencia**: Visualización de códigos restantes y consumidos, botón para regenerar una nueva lista completa, copiar o descargar.

### E. Sincronización en la Nube y Bloqueo en Tiempo Real
- **Firestore Security Rules**: Desplegadas para `users/{userId}/authenticator_settings/security` con verificación de propietario `isOwner(userId)`.
- **Persistencia Híbrida**: Configuración sincronizada en Firestore para que se traslade entre dispositivos del mismo usuario, con respaldo en `localStorage` para disponibilidad instantánea.
- **Temporizador de Inactividad y Visibilidad**: Detección de pestaña en segundo plano (`visibilitychange`) y detector de inactividad que activa el bloqueo según la preferencia del usuario.
