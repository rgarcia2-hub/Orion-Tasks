# Orion Workspace: Arquitectura Móvil, Escala y Distribución Ergonómica

Plan arquitectónico y de diseño para transformar Orion Workspace en una suite web touch-first de alto rendimiento, optimizada para dispositivos móviles (375px–430px) sin comprometer la experiencia de escritorio (1440px).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> A continuación se detallan las decisiones clave confirmadas en la fase de clarificación interactiva para gobernar el diseño y comportamiento móvil:

- [x] **Navegación Principal Móvil (Completado)**: Barra de navegación inferior anclada (`OrionMobileNavBar`) con accesos directos rápidos a Hub, Tasks, Calendario, Mail y menú deslizable (*Bottom Sheet Drawer* `OrionMobileAppDrawer`).
- [x] **Escalado y Distribución de Vistas Densas (Completado)**: Pestañas deslizables para columnas Kanban en móvil (`TasksKanbanView`), vista dividida colapsable con botón de volver para Orion Mail (`MailReaderView` y `MailThreadList`), visualización de cuadrícula y pestañas de sección para Orion Drive (`OrionDriveApp`), y distribución de agenda/mes en Orion Calendar.
- [x] **Controles Táctiles y Ergonomía (Completado)**: Botón de acción flotante (FAB) para subidas rápidas en Drive, hitboxes táctiles $\ge 44\text{px}$, metadatos de viewport PWA (`viewport-fit=cover`), y cumplimiento del límite del 15% de superficie fija.

---

## 1. Overview & Core Concept

### A. Propósito de la Transformación Móvil
Orion Workspace pasa de ser un entorno pensado para monitor de escritorio a un **sistema operativo de productividad responsivo de clase mundial**. En smartphone, los elementos se reorganizan siguiendo las leyes ergonómicas de la zona del pulgar (*Thumb Zone*), eliminando barras laterales pesadas y tablas comprimidas ilegibles.

### B. Audiencia y Contexto de Uso
- **Usuario móvil activo**: Personas que revisan su agenda de reuniones, marcan tareas completadas, consultan o suben archivos en Orion Drive, leen correos entrantes y generan códigos 2FA desde su teléfono con una sola mano.

### C. Valor Clave
- **Cero zoom accidental**: Todo el contenido se ajusta a la anchura del dispositivo sin desbordamiento horizontal (`overflow-x-hidden`).
- **Acceso en milisegundos**: Las acciones prioritarias (crear tarea, nuevo evento, añadir token 2FA, subir archivo) están al alcance del pulgar en la parte inferior de la pantalla.

---

## 2. User Experience & Visual Design

### A. Distribución Ergonómica por Zonas del Pulgar

```
┌───────────────────────────────────────┐  ▲
│ [App Switcher / Logo]    [User Avatar]│  │ Zona Difícil (Hard Reach): 
│ Barra Superior Compacta (52px)        │  │ Encabezados, títulos y filtros
├───────────────────────────────────────┤  ▼
│                                       │  ▲
│  [ Pestañas Deslizables de Vista ]    │  │
│                                       │  │
│  • Tarjeta de Elemento 1 (56px)       │  │ Zona de Extensión (Stretch Zone):
│  • Tarjeta de Elemento 2 (56px)       │  │ Feed de contenido principal,
│  • Tarjeta de Elemento 3 (56px)       │  │ tarjetas verticales, lectura
│                                       │  │
├───────────────────────────────────────┤  ▼
│  [ + Botón de Acción Principal ]      │  ▲ Zona Natural del Pulgar (Thumb Zone):
├───────────────────────────────────────┤  │ Acciones primarias y barra de
│ [Hub] [Tasks] [Cal] [Mail] [Apps ☰]   │  │ navegación inferior anclada (60px)
└───────────────────────────────────────┘  ▼
```

### B. Barra de Navegación Inferior Móvil (`OrionMobileNavBar`)
- **Fijada en la base**: `fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-[#18181b]/90 backdrop-blur-xl border-t border-neutral-200/80 dark:border-neutral-800`.
- **Estructura de 5 destinos táctiles**:
  1. **Hub**: Vista general y widget de bienvenida.
  2. **Tasks / Tareas**: Tablero Kanban adaptado con pestañas por estado y panel de hábitos.
  3. **Calendario**: Vista combinada de agenda diaria y eventos del mes.
  4. **Mail**: Bandeja de entrada compacta con escaneo rápido y acciones deslizables.
  5. **Más Apps (Drawer ☰)**: Abre el panel inferior que da acceso instantáneo a Orion Drive, Orion Authenticator, Copias de Seguridad y Modo Oscuro.
- **Micro-interacción**: Indicador visual activo mediante sutil punto de acento y realce tipográfico; respuesta táctil en $\le 120\text{ms}$.

### C. Panel Inferior de Aplicaciones (`OrionMobileAppDrawer`)
- Panel deslizante con fondo translúcido (*Liquid Glass*), esquinas superiores redondeadas (`rounded-t-3xl`), tirador visual táctil (`w-10 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700 mx-auto mt-2.5 mb-4`) y cierre mediante gesto hacia abajo o botón exterior.
- Cuadrícula de iconos grandes (48x48px) para saltar con fluidez a cualquier rincón de la suite.

### D. Adaptación de Vistas Clave en Móvil

1. **Orion Tasks (Kanban & Timeline)**:
   - En pantallas pequeñas ($< 768\text{px}$), en lugar de mostrar 4 columnas horizontales aplastadas, se despliega un **selector horizontal de columnas en píldoras** (`Por Hacer (3) | En Progreso (2) | Completado (5)`) que filtra la columna activa al instante con animación lateral suave.
   - Panel de Hábitos: Se muestra como pestaña secundaria accesible con un toque, con casillas de verificación de $44\text{px}$.
2. **Orion Drive**:
   - Selector de vista lista/cuadrícula optimizado: La lista se convierte en filas táctiles de $60\text{px}$ con información clara (icono de tipo, nombre, peso y fecha).
   - Menú contextual: En móvil se abre automáticamente como un *Bottom Action Sheet* en lugar de un menú flotante milimétrico.
3. **Orion Calendar**:
   - Cabecera de mes con carrusel horizontal de días (`Lun 14`, `Mar 15`, `Mié 16`) y vista vertical de **Agenda del Día** con franjas horarias legibles y aviso de conflictos.
4. **Orion Mail**:
   - Vista dividida colapsable: Si se selecciona un correo, la lista se retira limpiamente con animación `slide-in` para dar todo el ancho a la lectura y al análisis con IA. Botón "Volver" con tamaño táctil en la barra superior.
5. **Orion Authenticator**:
   - Teclado numérico ubicado en el tercio inferior del teléfono para ingresar el PIN sin estirar la mano.
   - Tarjetas de códigos TOTP a ancho completo con botón táctil directo de copiado de 48px y barra de progreso circular visible.

### E. Tipografía, Tamaños y Regla de Superficie Fija (15% Cap)
- **Top Bar Móvil**: Altura máxima de $52\text{px}$ (`h-13`), garantizando que la suma de Top Bar ($52\text{px}$) + Bottom Nav ($60\text{px}$) no supere nunca el 15% del alto de pantalla de un smartphone típico (667px–844px), dejando más del 85% libre para el contenido.
- **Tamaños de fuente adaptados**:
  - Títulos principales en móvil: `text-lg` a `text-xl font-bold` (en lugar de `text-3xl`).
  - Textos descriptivos: `text-xs` y `text-sm` con interlineado holgado (`leading-relaxed`).
  - Metadatos: `text-[11px]` con separadores tipográficos limpios (`·`), sin cajas de píldoras estáticas.

---

## 3. Key Product Decisions & Trade-Offs

### Decisión 1: Barra de Navegación Inferior vs Menú Lateral Hamburguesa
- **Enfoque Elegido**: Barra inferior táctil anclada fija con botón de menú deslizable (*Bottom Sheet*).
- **Justificación**: En teléfonos modernos de pantalla alargada (19.5:9), las esquinas superiores izquierdas son inaccesibles con una sola mano. La barra inferior sitúa las 4 herramientas principales al alcance del pulgar sin abrir menús adicionales.
- **Alternativa descartada**: Menú hamburguesa tradicional arriba a la izquierda, que obliga al usuario a usar las dos manos.

### Decisión 2: Pestañas de Columna para Kanban en Móvil vs Scroll Horizontal Infinito
- **Enfoque Elegido**: Pestañas de segmento superior deslizables para alternar la columna visible.
- **Justificación**: El scroll horizontal infinito en móvil colisiona con los gestos de arrastrar tarjetas y provoca pérdidas de contexto visual. Con pestañas, el usuario sabe con certeza en qué columna está y las tarjetas ocupan el 100% del ancho legible.
- **Alternativa descartada**: Columnas en cuadrícula minúscula de 150px, que mutilan los títulos de las tareas.

### Decisión 3: Modales como Bottom Sheets en Pantallas Móviles
- **Enfoque Elegido**: En pantallas móviles (`sm:hidden`), todos los modales principales (Nueva Tarea, Detalles, Crear Carpeta, Compartir) se transforman automáticamente en paneles deslizantes desde abajo (*Bottom Sheets*).
- **Justificación**: Sigue el estándar natural de iOS y Android para formularios y paneles de acción.
- **Alternativa descartada**: Modales centrados con scroll interno en marcos reducidos de 300px.

---

## 4. Technical Architecture & Data Strategy

### Diagrama de Arquitectura y Componentes Móviles

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ORION WORKSPACE CORE                            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Mobile Viewport Detector Hook (useIsMobile: window.matchMedia)   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌────────────────────────────┴────────────────────────────┐
       ▼                                                         ▼
┌─────────────────────────────────────┐   ┌─────────────────────────────────────┐
│       DESKTOP VIEWPORT (≥768px)     │   │        MOBILE VIEWPORT (<768px)     │
│ ├─ Desktop Top Header & AppSwitcher │   │ ├─ Mobile Compact Top Bar (52px)    │
│ ├─ Multi-Column Kanban Board        │   │ ├─ Swipeable Column Segmented Tabs  │
│ ├─ Full Multi-Folder Drive Grid     │   │ ├─ Vertical Single-Col Card Stream  │
│ └─ Split-Screen Email Reader        │   │ ├─ Slide-In Mobile Email Reader     │
│                                     │   │ ├─ Bottom Action Sheets for Modals  │
│                                     │   │ └─ OrionMobileNavBar (Fixed Bottom) │
│                                     │   │     ├─ 4 Primary App Tabs (Thumb)   │
│                                     │   │     └─ App Drawer Sheet (☰ Más)     │
└─────────────────────────────────────┘   └─────────────────────────────────────┘
```

### Componentes Específicos a Crear e Integrar

1. **`src/hooks/useIsMobile.ts`**:
   - Hook reactivo ligero basado en `window.matchMedia('(max-width: 767px)')` con detección de cambio de orientación y soporte SSR seguro.
2. **`src/components/OrionMobileNavBar.tsx`**:
   - Barra de navegación inferior con los accesos directos y el disparador del panel de aplicaciones.
3. **`src/components/OrionMobileAppDrawer.tsx`**:
   - Hoja de aplicaciones deslizable (*Bottom Sheet Drawer*) con soporte para gestos táctiles de arrastre y fondo Liquid Glass.
4. **Optimización Responsiva en `TasksKanbanView.tsx`**:
   - Selector de columnas en móvil con pestañas táctiles horizontales.
5. **Optimización Responsiva en `OrionMailApp.tsx` y `OrionDriveApp.tsx`**:
   - Ajuste de cabeceras, botones de acción flotantes para móvil (*Floating Action Button / FAB*) y adaptación de tablas a filas táctiles.
6. **Optimización en `OrionAuthenticatorApp.tsx`**:
   - Reubicación del teclado numérico y ajuste de modales de seguridad como láminas inferiores.
