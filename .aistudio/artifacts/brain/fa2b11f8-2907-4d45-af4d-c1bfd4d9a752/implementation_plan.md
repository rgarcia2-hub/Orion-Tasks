# ChronoFlow — Notion-Style Google Calendar & Task Workspace

Una aplicación de productividad inspirada en Notion que conecta con Google Calendar para explorar calendarios, inspeccionar eventos al detalle, duplicarlos en un calendario interno con estados de flujo de trabajo (Tablero Kanban y Lista: Pendiente, En curso, Hecho), dashboard de inicio con métricas y el próximo evento, y un asistente inteligente con Gemini AI para sintetizar reuniones y extraer tareas de acción.

## Decisiones Críticas y Respuestas Confirmadas

> [!IMPORTANT]
> Se han incorporado las elecciones directas del usuario para definir la experiencia visual y funcional:

- **Flujo de trabajo para eventos duplicados**: Tablero Kanban interactivo (drag-and-drop o botones de cambio ágil) y vista de lista tabular estructurada con estados: `Pendiente`, `En curso` y `Hecho`.
- **Funcionalidades adicionales**: Asistente de inteligencia artificial con Gemini 3.8 Flash para generar resúmenes ejecutivos de reuniones, checklists de preparación y extracción automática de tareas accionables a partir de la descripción y notas del evento.
- **Identidad visual y diseño**: Estilo Notion, sobrio, limpio y minimalista, con paleta neutra y descansada, tipografía clara con números tabulares (`tabular-nums`), bordes sutiles de 1px sin tarjetas recargadas y sin píldoras de colores estridentes.

---

## 1. Visión General y Concepto Central

- **Qué hace**: Permite iniciar sesión de forma segura con Google Workspace para acceder a todos los calendarios del usuario (personales, laborales, secundarios). El usuario puede seleccionar cualquier calendario, examinar sus eventos con información completa (horarios, ubicación, asistentes, enlaces a Google Meet), "clonar/duplicar" eventos al calendario de gestión interna de la aplicación, organizar esos eventos mediante un tablero Kanban por estados, y monitorear el progreso diario desde una pestaña de inicio con cuenta atrás para el próximo evento y métricas de cumplimiento.
- **Público objetivo**: Profesionales, estudiantes y organizadores que necesitan transformar compromisos de calendario en flujos de trabajo accionables sin saturar su calendario original.
- **Valor diferencial**: Conexión directa con Google Calendar sin intermediarios, enriquecida con análisis inteligente de reuniones vía Gemini y persistencia local inmediata.

---

## 2. Experiencia de Usuario y Diseño Visual

### Flujos Clave de Usuario
1. **Conexión con Google**: El usuario pulsa el botón oficial de inicio de sesión con Google para autorizar la lectura de sus calendarios.
2. **Pestaña Inicio (Dashboard)**:
   - Tarjeta destacada con el **Próximo evento más cercano** (tiempo restante, hora exacta, título, calendario de origen y acceso rápido).
   - Panel de **Estadísticas de Productividad**: Eventos totales clonados, tasa de completados (%) con gráfico circular o barra de progreso minimalista, desglose por estado (Pendiente, En curso, Hecho) y tiempo medio estimado.
   - **Lista de Tareas Pendientes Urgentes**: Lista rápida de eventos en estado "Pendiente" con checkbox de completado rápido en 1 clic.
3. **Pestaña Explorador de Calendarios (Google Calendar)**:
   - Selector lateral o desplegable limpio con todos los calendarios disponibles del usuario (con su color original de Google).
   - Lista cronológica de eventos (hoy, esta semana, próximos 30 días) con buscador instantáneo y filtros de fecha.
   - **Cajón / Modal de Detalles**: Al hacer clic en un evento, se despliega el resumen completo: hora de inicio/fin, ubicación, enlace a Meet/videollamada, organizador, asistentes con confirmación y descripción completa.
   - **Botón "Duplicar en App"**: Clona el evento al gestor interno con un clic, permitiendo opcionalmente añadir notas iniciales, tags o prioridad.
4. **Pestaña Tareas y Calendario App (Kanban & Lista)**:
   - Vista dividida o conmutable: **Tablero Kanban** (columnas: *Pendiente*, *En curso*, *Hecho*) y **Vista de Lista** compacta.
   - Acciones de cambio de estado fluidas, añadir checklist interno a cada evento y notas enriquecidas.
   - Botón **"Resumen con IA"**: Invoca al modelo Gemini para sintetizar los detalles de la reunión y sugerir tareas de seguimiento en segundos.
5. **Pestaña Calendario Visual de la App**:
   - Vista de mes/semana interactiva con los eventos duplicados y su estado visualmente diferenciado.

### Identidad Visual y Estilo Notion
- **Dirección estética**: Minimalismo editorial tipo Notion. Fondo blanco sereno en modo claro (`#ffffff` / `#f7f7f5`) y carbón profundo en modo oscuro (`#191919` / `#202020`).
- **Paleta de color y contraste**:
  - Lienzo (60%): `#ffffff` (claro) / `#191919` (oscuro).
  - Superficies y separadores (30%): Líneas ultrafinas de 1px (`#e9e9e7` / `#2e2e2e`), fondos de fila suaves al hover (`#f1f1ef` / `#252525`).
  - Acentos discretos (10%): Monocromo equilibrado con toques sutiles de ámbar y esmeralda únicamente para indicar estados funcionales (Pendiente: pizarra neutro, En curso: azul suave, Hecho: esmeralda discreto).
- **Tipografía y jerarquía**:
  - Tipografía sans-serif refinada (`Plus Jakarta Sans` / sistema nativo de alta legibilidad).
  - Figuras tabulares (`tabular-nums`) para todas las fechas, contadores horarios y porcentajes.
  - Cero píldoras decorativas: etiquetas y metadatos con separadores limpios tipo `·` o texto plano tipográfico.

---

## 3. Decisiones de Producto y Arquitectura

- **Autenticación con Google Workspace**:
  - *Enfoque*: Google OAuth 2.0 en cliente (Firebase Auth + GoogleAuthProvider) con scopes mínimos necesarios (`calendar.calendarlist.readonly` y `calendar.events.readonly`).
  - *Por qué*: Acceso seguro y oficial directo a las APIs de Google sin requerir redirecciones complejas de backend que puedan fallar en entornos sandbox.
- **Gestión de Datos y Persistencia de la App**:
  - *Enfoque*: Almacenamiento local reactivo (`localStorage`) con soporte para exportar/importar JSON. Los eventos clonados se guardan de forma persistente en el navegador del usuario y pueden enriquecerse con notas, sub-tareas y estados sin alterar el calendario original de Google.
  - *Por qué*: Privacidad total para el usuario, cero latencia y funcionamiento offline para las tareas ya sincronizadas.
- **Integración con Gemini AI**:
  - *Enfoque*: Endpoint server-side `/api/gemini/summarize` que utiliza el SDK oficial `@google/genai` con el modelo `gemini-3.8-flash` y esquema JSON estructurado para devolver: resumen en 2 frases, puntos clave discutidos y tareas de acción sugeridas.
  - *Por qué*: Rápido, estructurado y sin exponer la API key en el cliente.

---

## 4. Arquitectura Técnica y Estrategia de Datos

### Diagrama de Arquitectura de Componentes

```
┌────────────────────────────────────────────────────────────────────────┐
│                        App Navigation & Top Bar                        │
│  [ChronoFlow Notion Wordmark]   [Inicio | Calendarios | Tareas | Ajustes]  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┼─────────────────────────┐
           ▼                        ▼                         ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│    Pestaña Inicio   │  │  Explorador Google  │  │  Espacio de Tareas  │
│                     │  │      Calendar       │  │    y Flujo App      │
│ ┌─────────────────┐ │  │ ┌─────────────────┐ │  │ ┌─────────────────┐ │
│ │ Próximo Evento  │ │  │ │ Selector Agenda │ │  │ │ Tablero Kanban  │ │
│ │  con Cuenta     │ │  │ │ (Calendarios)   │ │  │ │ Pendiente/Curso/│ │
│ │  Regresiva      │ │  │ └────────┬────────┘ │  │ │ Hecho           │ │
│ └─────────────────┘ │  │          │          │  │ └─────────────────┘ │
│ ┌─────────────────┐ │  │ ┌────────▼────────┐ │  │ ┌─────────────────┐ │
│ │ Estadísticas y  │ │  │ │ Lista de Eventos│ │  │ │ Vista de Lista  │ │
│ │ Tasa Completados│ │  │ │ con Filtros/Día │ │  │ │ & Filtro Rápido │ │
│ └─────────────────┘ │  │ └────────┬────────┘ │  │ └─────────────────┘ │
│ ┌─────────────────┐ │  │          │          │  │ ┌─────────────────┐ │
│ │ Pendientes Top  │ │  │ ┌────────▼────────┐ │  │ │ Asistente IA   │ │
│ │ con Checkbox    │ │  │ │ Modal Detalle & │ │  │ │ (Resumen Gemini)│ │
│ └─────────────────┘ │  │ │ "Duplicar a App"│ │  │ └─────────────────┘ │
│                     │  │ └─────────────────┘ │  │                     │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
           │                        │                         │
           └────────────────────────┼─────────────────────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │      Estado Centralizado      │
                    │   - authStore (Google Token)  │
                    │   - calendarStore (G-Events)  │
                    │   - appTasksStore (Duplicados)│
                    │   - localStorage Persistencia │
                    └───────────────┬───────────────┘
                                    │
             ┌──────────────────────┴──────────────────────┐
             ▼                                             ▼
  ┌──────────────────────┐                      ┌──────────────────────┐
  │ Google Calendar API  │                      │ Server Express Route │
  │ (Google Cloud OAuth) │                      │ /api/gemini/summarize│
  └──────────────────────┘                      └──────────────────────┘
```

### Modelo de Datos de Eventos Duplicados

```typescript
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface AppTaskEvent {
  id: string; // UUID local
  googleEventId?: string; // Referencia al evento original
  calendarId: string;
  calendarName: string;
  calendarColor?: string;
  title: string;
  description: string;
  location?: string;
  meetLink?: string;
  startDateTime: string;
  endDateTime: string;
  isAllDay: boolean;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  notes: string;
  subtasks: { id: string; title: string; completed: boolean }[];
  aiSummary?: {
    summary: string;
    actionItems: string[];
    preparationNotes: string[];
  };
  createdAt: string;
  completedAt?: string;
}
```

### Plan de Fases de Construcción
1. **Fase 1: Configuración de OAuth y Entorno**: Invocar `set_up_oauth` para registrar los permisos de Google Calendar con la autorización del usuario y configurar el proxy server Express para Gemini.
2. **Fase 2: Conector Google Calendar**: Cliente API para consultar calendarios (`users/me/calendarList`) y eventos con rango temporal y paginación.
3. **Fase 3: Pestaña de Inicio (Dashboard)**: Cálculo de métricas dinámicas (porcentaje de completados, eventos pendientes), contador regresivo al próximo evento y lista interactiva de tareas.
4. **Fase 4: Explorador de Calendarios y Modal de Evento**: Interfaz para cambiar de calendario, ver detalles completos (asistentes, videollamadas, descripciones) y botón de duplicación al sistema interno.
5. **Fase 5: Tablero Kanban y Lista de Flujo**: Columnas por estado con arrastrar/cambiar estado, sub-tareas y editor de notas.
6. **Fase 6: Asistente Gemini AI**: Integración para resumir el evento y extraer elementos de acción directamente en la tarea.
7. **Fase 7: Verificación y Acabados de Estilo Notion**: Verificación de compilación sin errores, accesibilidad, atajos de teclado y pulido de microinteracciones.
