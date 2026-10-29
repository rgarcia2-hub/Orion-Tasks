# Orion Workspace: Liquid Glass Spotlight & Ecosistema Inteligente

Plan arquitectónico integral para potenciar las aplicaciones de Orion Workspace (Mail, Calendar, Tasks y Notes) con herramientas de productividad avanzadas, búsqueda universal Spotlight con estética Apple Liquid Glass, análisis cognitivo de correos con IA y seguimiento de hábitos diarios.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> A continuación se resumen las decisiones clave confirmadas en la fase de clarificación interactiva y los patrones arquitectónicos acordados para la ejecución:

- **Spotlight Universal (Apple Liquid Glass)**: Activación mediante atajo global (`Cmd/Ctrl + K`) y botón visible en la barra superior. Contenedor flotante con desenfoque de fondo ultra suave (`backdrop-blur-2xl`), borde especular de vidrio líquido, animación fluida elástica (`spring physics`) y búsqueda instantánea en todas las entidades (Eventos, Tareas, Correos y Notas).
- **IA Correo a Tarea con Animación Glow**: Botón en la lectura de correos que activa el análisis inteligente con Gemini. Mientras el modelo procesa la información, los caracteres y párrafos del correo realizan un efecto de pulso luminoso (*holographic text glow*). Al concluir, se abre un diálogo de vista previa editable con los campos extraídos (título, prioridad, fecha límite y subtareas) antes de guardar en el tablero.
- **Sección de Hábitos en Orion Tasks**: Panel lateral desplegable con cuadrícula de días de la semana, contadores de rachas activas (*streaks*), casillas de verificación rápida y persistencia en Firestore/Local.
- **Línea de Tiempo (Timeline) en Orion Tasks**: Conmutador de vista entre Kanban tradicional y línea de tiempo horizontal interactiva agrupada por fecha de vencimiento.
- **Orion Notes Interactivo & Exportable**: Soporte nativo para casillas de verificación interactivas `[x]` con barra de progreso de completado, buscador en vivo dentro del editor y exportación directa a formato Markdown limpio y visualización imprimible para PDF.
- **Orion Calendar Pro**: Algoritmo visual de detección de conflictos para eventos solapados, widget meteorológico sutil en las cabeceras de los días y generación en 1 clic del resumen de agenda diario para portapapeles.
- **Widget "Mi Día" en el Hub**: Tarjeta de bienvenida en el panel principal con resumen consolidado de las 4 aplicaciones.

---

## 1. Overview & Core Concept

Orion Workspace evoluciona de aplicaciones individuales conectadas hacia un **sistema operativo de productividad unificado**. Los usuarios pueden procesar información entrante en su correo y convertirla de inmediato en tareas ejecutables con asistencia de IA, organizar sus rutinas mediante el panel de Hábitos y consultar cualquier elemento de la plataforma en milisegundos mediante el buscador universal Spotlight.

### Target Persona & Context
- Usuarios que gestionan múltiples responsabilidades y necesitan una interfaz rápida, sin fricciones ni recargas, con transiciones orgánicas y diseño cuidado al detalle inspirado en macOS y visionOS.

### Valor Principal
- Eliminación del copiado manual entre herramientas: un correo se transforma en tarea con fechas detectadas por IA; una tarea se enlaza con notas de reunión; y la barra Spotlight permite saltar a cualquier dato sin navegar de pantalla en pantalla.

---

## 2. User Experience & Visual Design

### A. Spotlight Universal (Liquid Glass Aesthetic)
- **Activación**: Pulsación de `Cmd + K` / `Ctrl + K` desde cualquier pantalla, o clic en el botón de búsqueda estilizado en la cabecera.
- **Aspecto Visual**: Píldora flotante centrada con fondo semitransparente de alta refracción (`rgba(255, 255, 255, 0.65)` en modo claro y `rgba(24, 24, 27, 0.75)` en modo oscuro), `backdrop-blur-2xl`, sombra envolvente multicapa y borde tenue con destello superior (*specular highlight*).
- **Micro-interacciones**: Entrada mediante expansión elástica con Framer Motion, resaltado de teclas de navegación (`↑` `↓` `Enter` `Esc`), iconos temáticos por aplicación y atajo rápido para abrir directamente el resultado.

### B. Análisis IA de Correo con Efecto Glow
- **Activación**: Botón destacado *"Crear Tarea con IA"* en la barra de herramientas del lector de correos.
- **Efecto de Animación**: Mientras la petición procesa en el servidor, el texto del correo adopta un degradado animado continuo (`background-clip: text` con animación de shimmer en tonos violeta y azul celeste) transmitiendo la sensación de escaneo en tiempo real.
- **Modal de Confirmación**: Muestra la tarjeta de tarea prediseñada permitiendo ajustar título, lista de subtareas detectadas, fecha estimada y prioridad antes de confirmarla.

### C. Orion Tasks: Hábitos y Vista Timeline
- **Panel Lateral de Hábitos**:
  - Lista de hábitos diarios (ej: *Lectura*, *Revisión Inbox Zero*, *Ejercicio*, *Planificación del Día*).
  - Selector de días (L, M, X, J, V, S, D) con indicador de racha de días consecutivos completados.
- **Vista Timeline**:
  - Pestaña alternativa al tablero Kanban.
  - Eje cronológico semanal/mensual que ubica visualmente las tarjetas según su fecha de vencimiento (`dueDateTime`), permitiendo identificar semanas con sobrecarga de trabajo.

### D. Orion Notes: Checklists y Exportación
- **Checklists Vivas**: Conversión de sintaxis `- [ ]` y `- [x]` en casillas de verificación interactivas dentro de la vista previa de la nota, calculando automáticamente el porcentaje de avance.
- **Exportación**: Botón de menú para descargar la nota en archivo `.md` estructurado y botón de exportación a PDF aprovechando el formateo tipográfico nativo de impresión.
- **Buscador en Vivo**: Filtro instantáneo sobre títulos y párrafos con resaltado amarillo de coincidencias.

### E. Orion Calendar: Conflictos y Pronóstico
- **Detector de Solapamientos**: Indicador de advertencia sutil en eventos que comparten la misma franja horaria en el mismo día, desplegando una píldora indicadora *"Conflicto con [Evento X]"*.
- **Widget de Clima**: Mini-indicador en las columnas del calendario con icono meteorológico y temperatura orientativa.
- **Compartir Agenda**: Botón para copiar al portapapeles el resumen estructurado de las reuniones del día.

---

## 3. Key Product Decisions & Trade-Offs

### Decisión 1: Modal Editable vs Inserción Directa de Tarea desde Correo
- **Elección**: Modal de vista previa editable (según confirmación del usuario).
- **Razón**: Permite al usuario revisar las fechas o subtareas inferidas por el modelo antes de que impacten en su tablero Kanban, garantizando total control y confianza en la IA.
- **Alternativa descartada**: Creación automática silenciosa, que podría generar duplicados o interpretaciones erróneas de fechas relativas.

### Decisión 2: Hábitos como Panel Lateral en Tasks
- **Elección**: Panel lateral dedicado desplegable con seguimiento de rachas.
- **Razón**: Mantiene el foco del tablero Kanban en tareas orientadas a proyectos y objetivos concretos, reservando el seguimiento de constancia para los hábitos diarios sin contaminar las columnas de estado.
- **Alternativa descartada**: Tratar cada hábito como una tarjeta Kanban normal, lo que saturaría las columnas de tareas con elementos repetitivos.

### Decisión 3: Arquitectura del Spotlight Universal
- **Elección**: Estado global en el contexto de la aplicación que indexa en memoria las tareas, eventos, notas y correos previamente cargados.
- **Razón**: Respuestas inmediatas a cada tecla (0ms de latencia) y capacidad de ejecutar acciones rápidas (cambiar de app, abrir modales) sin llamadas de red adicionales.

---

## 4. Technical Architecture & Data Strategy

### System Layout & Component Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ORION WORKSPACE HUB                             │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Spotlight Universal Search Modal (Cmd+K / Apple Liquid Glass)    │  │
│  │ ├─ Indexer: Tasks ⇄ Events ⇄ Emails ⇄ Notes                      │  │
│  │ └─ Fast Actions: Switch Apps, Create New Item, Open Reader       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────┐  ┌────────────────────────────────────────┐  │
│  │ Widget "Mi Día"      │  │ App Switcher & Navigation Bar          │  │
│  └──────────────────────┘  └────────────────────────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
┌───────────────────┐      ┌───────────────────┐      ┌───────────────────┐
│    ORION MAIL     │      │   ORION CALENDAR  │      │    ORION TASKS    │
│ ├─ Email Reader   │      │ ├─ Conflict Guard │      │ ├─ Kanban Board   │
│ ├─ AI Task Parser │      │ ├─ Weather Widget │      │ ├─ Timeline View  │
│ │  (Text Glow FX) │      │ ├─ Copy Agenda    │      │ └─ Hábitos Panel  │
│ └─ Task Preview   │      │ └─ Meeting Notes  │         (Daily Streaks)  │
└─────────┬─────────┘      └─────────┬─────────┘      └─────────┬─────────┘
          │                          │                          │
          └──────────────────────────┼──────────────────────────┘
                                     ▼
                          ┌─────────────────────┐
                          │     ORION NOTES     │
                          │ ├─ Live Checklists  │
                          │ ├─ Text Search      │
                          │ ├─ PDF / MD Export  │
                          │ └─ Linked Entities  │
                          └──────────┬──────────┘
                                     │
                                     ▼
                          ┌─────────────────────┐
                          │   SERVICES LAYER    │
                          │ ├─ Gemini API Route │
                          │ ├─ Firestore / Sync │
                          │ └─ Google API Auth  │
                          └─────────────────────┘
```

### Data Model Additions

- **HabitItem**:
  - `id`: string
  - `title`: string
  - `category`: 'salud' | 'trabajo' | 'mindset' | 'rutina'
  - `frequency`: 'daily' | 'weekdays'
  - `completedDates`: string[] (formato `YYYY-MM-DD`)
  - `streak`: number
  - `createdAt`: string

- **AI Analysis Response Schema**:
  - `title`: string
  - `description`: string
  - `priority`: 'low' | 'medium' | 'high'
  - `dueDate`: string (opcional)
  - `subtasks`: string[]

- **Spotlight Search Result**:
  - `id`: string
  - `type`: 'mail' | 'task' | 'calendar' | 'note'
  - `title`: string
  - `subtitle`: string
  - `metadata`: string
  - `onSelect`: () => void
