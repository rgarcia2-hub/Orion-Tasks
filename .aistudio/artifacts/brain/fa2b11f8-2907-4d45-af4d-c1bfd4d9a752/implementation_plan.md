# Orion Mail · Cliente de Correo Híbrido de 3 Columnas

Orion Mail es el cliente de correo electrónico de alta productividad para el ecosistema Orion Workspace, diseñado con una arquitectura de 3 columnas inspirada en Proton Mail y Notion, permitiendo gestionar mensajes tanto de tu cuenta real de Gmail como de un buzón interno seguro almacenado en Cloud Firestore.

## User Review & Critical Decisions

> [!IMPORTANT]
> Decisiones de producto confirmadas mediante entrevista interactiva:
> - **Modo de conexión híbrido**: Soporte dual que permite alternar o visualizar conjuntamente correos reales de Gmail (mediante la integración oficial de Google OAuth ya configurada en tu proyecto) y correos/borradores internos de Orion sincronizados en Firestore.
> - **Diseño de 3 columnas**: Navegación lateral (Carpetas, etiquetas y selector de cuentas), lista central de hilos con vista previa rápida y búsqueda instantánea, y panel derecho de lectura y composición de correos.
> - **Independencia funcional**: Mantenido como cliente de correo especializado y autónomo, accesible directamente desde el Hub y mediante su subURL dedicada `/mail`.

---

## 1. Overview & Core Concept

- **Qué hace**: Proporciona un entorno unificado para consultar bandejas de entrada (*Recibidos*, *Enviados*, *Destacados*, *Borradores*, *Papelera*), redactar nuevos correos con formato enriquecido, responder hilos, buscar mensajes por remitente o asunto, y alternar fluidamente entre la cuenta de Gmail conectada y el buzón interno de Orion.
- **Público objetivo**: Usuarios de Orion Workspace que buscan una experiencia de correo sin distracciones, ultrarrápida, con atajos de teclado y estética visual cuidada.
- **Valor diferencial**: Convivencia transparente entre correos de Gmail y correos internos del equipo o notas enviadas a uno mismo, sin salir del ecosistema Orion.

---

## 2. User Experience & Visual Design

### A. Estructura de 3 Columnas (Layout Grid)
1. **Columna 1: Navegación & Carpetas (240px - 260px)**
   - Selector de cuenta activa (Gmail conectada vs. Buzón Interno Orion vs. "Todas las bandejas").
   - Botón primario prominente `+ Redactar`.
   - Carpetas principales: Recibidos (*Inbox* con contador numérico tabular), Destacados (*Starred*), Enviados (*Sent*), Borradores (*Drafts*), Papelera (*Trash*).
   - Etiquetas personalizadas con indicadores de color sutiles.
   - Acceso al Hub y conmutador rápido de apps en la cabecera.

2. **Columna 2: Lista de Hilos y Mensajes (320px - 380px)**
   - Barra superior con buscador en tiempo real (`filter por asunto, remitente o cuerpo`).
   - Filtros de estado rápidos: "Todos", "No leídos", "Con adjuntos".
   - Tarjetas de hilos con avatar de remitente, asunto destacado, extracto de 2 líneas, fecha en formato tabular `tabular-nums` y selector de estrella de favorito.
   - Indicador visual claro de mensaje seleccionado y estado leído/no leído.

3. **Columna 3: Panel de Lectura & Redacción (Área flexible principal)**
   - **Vista de Lectura**: Cabecera con datos del remitente, avatares, fecha exacta, botones de acción rápida (*Responder*, *Reenviar*, *Marcar como no leído*, *Eliminar*, *Destacar*).
   - Cuerpo del mensaje con renderizado seguro de texto y HTML limpio.
   - **Compositor Integrado / Modal Deslizable**: Redactor con campos *Para*, *Asunto*, barra de formato enriquecido, adjuntos y botón de envío inmediato.

### B. Identidad Visual y Tema
- **Paleta Celestial Orion**: Tonos profundos en modo oscuro (`#121212`, `#191919`, bordes `#262626`, acentos violeta/índigo estelar) y fondos limpios y contrastados en modo claro (`#ffffff`, `#f8f9fa`, acentos índigo y pizarra).
- **Tipografía**: `Plus Jakarta Sans` con jerarquía de pesos marcada y cifras tabulares (`tabular-nums`) en todas las horas y contadores.
- **Micro-interacciones**: Transiciones suaves al cambiar de hilo mediante `motion`, feedback al archivar o destacar con iconos animados de `lucide-react`.

---

## 3. Key Product Decisions & Trade-Offs

- **Decisión 1: Sincronización híbrida (Gmail API + Firestore)**
  - *Enfoque*: Cuando el usuario ha iniciado sesión con Google y tiene el token activo, Orion Mail consulta la API oficial de Gmail (`messages.list` y `messages.get`). Para mensajes redactados internamente o cuando no hay conexión externa, almacena los datos en Firestore bajo la colección `users/{userId}/emails`.
  - *Por qué*: Ofrece lo mejor de los dos mundos: permite ver tus correos reales del día a día y al mismo tiempo crear y gestionar correos internos sin fallos de cuota o cuando se trabaja desconectado.
  - *Alternativas descartadas*: Depender exclusivamente de Gmail (requiere re-autenticación constante) o solo buzón falso (pierde utilidad real).

- **Decisión 2: SubURL dedicada `/mail` y navegación sincronizada**
  - *Enfoque*: Registro de la ruta `/mail` en el router de `CalendarContext`, tarjeta dedicada en `OrionWorkspaceHub` con estado funcional y soporte para historial del navegador (`popstate`).
  - *Por qué*: Consistencia total con `/tasks` y `/calendar`.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          ORION WORKSPACE HUB                           │
│                 (/tasks  ·  /calendar  ·  /mail)                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                       Ruta activa: /mail
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        ORION MAIL CONTAINER                            │
├────────────────────┬────────────────────────────┬──────────────────────┤
│  Columna 1 (Nav)   │   Columna 2 (Thread List)  │  Columna 3 (Reader)  │
│  - Cuentas         │   - Buscador en vivo       │  - Asunto & Remitente│
│  - Botón Redactar  │   - Filtro Leídos/No leídos│  - Acciones (Reply)  │
│  - Carpetas        │   - Hilos con avatares     │  - Contenido & HTML  │
│  - Etiquetas       │   - Badges tabulares       │  - Compositor nuevo  │
└─────────┬──────────┴──────────────┬─────────────┴──────────┬───────────┘
          │                         │                        │
          ▼                         ▼                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     MAIL SERVICE & PERSISTENCIA                        │
├─────────────────────────────────────┬──────────────────────────────────┤
│  Google Gmail API (OAuth Scopes)    │   Cloud Firestore Persistence    │
│  - Fetch real threads & messages    │   - users/{uid}/emails           │
│  - Mark as read / Starred           │   - Drafts, sent, custom tags    │
│  - Send via Gmail endpoint          │   - Real-time snapshot listeners │
└─────────────────────────────────────┴──────────────────────────────────┘
```

### Entidades de Datos (TypeScript)
```typescript
interface OrionEmail {
  id: string;
  source: 'gmail' | 'internal';
  from: { name: string; email: string; avatarUrl?: string };
  to: string[];
  subject: string;
  preview: string;
  body: string;
  date: string; // ISO
  folder: 'inbox' | 'sent' | 'drafts' | 'trash' | 'starred';
  isRead: boolean;
  isStarred: boolean;
  labels?: string[];
}
```
