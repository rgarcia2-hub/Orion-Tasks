import { collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { OrionEmail, ComposeEmailData, MailFolder } from '../types/mail';
import { marked } from 'marked';

const STORAGE_KEY_EMAILS = 'orion_internal_emails_v2';

export const INITIAL_ORION_EMAILS: OrionEmail[] = [
  {
    id: 'welcome-orion-01',
    source: 'internal',
    from: {
      name: 'Equipo de Orion Workspace',
      email: 'team@orionworkspace.com',
    },
    to: ['me@orion.app'],
    subject: '¡Te damos la bienvenida a Orion Mail! 🚀 (Soporte de Imágenes y Estilos)',
    preview: 'Descubre el nuevo cliente de correo de alta velocidad con soporte total para imágenes y estilos tipográficos...',
    body: `¡Hola Robert!

Bienvenido a **Orion Mail**, el nuevo cliente de correo integrado en tu suite de Orion Workspace con soporte para **negrita**, _cursiva_, ~~tachado~~ e imágenes en alta resolución.

![Orion Mail Banner](https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=80)

### ¿Qué hace único a Orion Mail?
- **Soporte visual completo**: Ahora los correos con imágenes, estilos como **negrita** o _cursiva_, listas y tablas se visualizan con renderizado enriquecido instantáneo.
- **Modo híbrido**: Conéctate con tu cuenta real de Google para leer correos de Gmail o utiliza el buzón interno con persistencia en Cloud Firestore.
- **Rendimiento instantáneo**: Búsqueda en tiempo real por asunto, remitente o contenido, filtros de no leídos y estrellas.
- **Visor Lightbox de imágenes**: Haz clic en cualquier imagen del correo para ampliarla a pantalla completa y copiar su enlace.

Un cordial saludo,  
**El equipo de Orion Workspace**`,
    hasImages: true,
    date: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    timestamp: Date.now() - 1000 * 60 * 45,
    folder: 'inbox',
    isRead: false,
    isStarred: true,
    labels: ['Orion', 'Bienvenida'],
  },
  {
    id: 'orion-styles-showcase-02',
    source: 'internal',
    from: {
      name: 'Guía de Formato Orion',
      email: 'format@orionworkspace.com',
    },
    to: ['me@orion.app'],
    subject: '🎨 Guía de estilos: **Negrita**, _Cursiva_, ~~Tachado~~ e Imágenes',
    preview: 'Comprueba cómo se visualizan todos los estilos tipográficos enriquecidos e imágenes en tus correos...',
    body: `Hola Robert,

Aquí tienes una demostración interactiva de cómo funcionan los estilos visuales en **Orion Mail**:

### 1. Estilos tipográficos
- **Texto en negrita**: \`**Texto en negrita**\` se muestra como **Texto en negrita destacado**.
- _Texto en cursiva_: \`_Texto en cursiva_\` o \`*Texto en cursiva*\` se muestra como _Texto en cursiva elegante_.
- ~~Texto tachado~~: \`~~Texto tachado~~\` se muestra como ~~Texto tachado o corregido~~.
- \`Código en línea\`: \`\`código\`\` se muestra con fondo monospace resaltado.

### 2. Citas destacadas
> "El diseño no es solo lo que se ve y lo que se siente. El diseño es cómo funciona."
> — Orion Design Principles

### 3. Fotografía e imágenes en correos
Las imágenes compartidas o recibidas desde Gmail se ajustan automáticamente a la ventana y permiten hacer zoom al hacer clic sobre ellas:

![Fotografía de muestra en alta resolución](https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80)

¡Prueba redactar un correo nuevo y usa los botones de formato para enviar mensajes con estilo profesional!`,
    hasImages: true,
    date: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    timestamp: Date.now() - 1000 * 60 * 120,
    folder: 'inbox',
    isRead: true,
    isStarred: true,
    labels: ['Guía', 'Estilos'],
  },
  {
    id: 'feature-release-calendar-03',
    source: 'internal',
    from: {
      name: 'Novedades de Producto',
      email: 'updates@orionworkspace.com',
    },
    to: ['me@orion.app'],
    subject: 'Orion Calendar & Tasks: Sincronización continua activa',
    preview: 'Conoce los detalles de las últimas actualizaciones implementadas en el ecosistema Orion Workspace.',
    body: `Hola de nuevo,

Hemos desplegado mejoras clave en tus aplicaciones de Orion:
1. **Orion Tasks**: Tablero Kanban fluido con drag & drop y sincronización bidireccional con Google Tasks.
2. **Orion Calendar**: Vistas de mes, semana, día y agenda con duplicación inteligente de eventos y soporte ICS.
3. **Orion Mail**: Soporte para visor HTML, extracción de imágenes de Gmail y formato Markdown.

![Productividad Orion Workspace](https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1000&q=80)

¡Disfruta de tu flujo de trabajo sin interrupciones!`,
    hasImages: true,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    timestamp: Date.now() - 1000 * 60 * 60 * 24,
    folder: 'inbox',
    isRead: true,
    isStarred: false,
    labels: ['Novedades'],
  },
];

// Helper to load cached internal emails
export function loadCachedEmails(): OrionEmail[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EMAILS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading cached emails:', e);
  }
  return INITIAL_ORION_EMAILS;
}

// Helper to save cached internal emails
export function saveCachedEmails(emails: OrionEmail[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_EMAILS, JSON.stringify(emails));
  } catch (e) {
    console.error('Error saving cached emails:', e);
  }
}

// Send real email via Gmail API with multipart/alternative (Plain text + HTML with styles & images)
export async function sendGmailMessage(
  accessToken: string,
  to: string,
  subject: string,
  bodyText: string
): Promise<{ id: string; threadId?: string }> {
  const cleanSubject = subject || '(Sin asunto)';
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(cleanSubject)))}?=`;

  // Parse markdown into HTML for rich email clients
  let htmlBody = '';
  try {
    const parsed = marked.parse(bodyText);
    htmlBody = typeof parsed === 'string' ? parsed : String(parsed);
  } catch {
    htmlBody = `<p>${bodyText.replace(/\n/g, '<br/>')}</p>`;
  }

  const boundary = `==_Orion_Boundary_${Date.now()}==`;

  const emailLines = [
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    bodyText,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;line-height:1.6;color:#1e1e1e;}img{max-width:100%;height:auto;border-radius:8px;}blockquote{border-left:4px solid #6366f1;padding-left:12px;margin:12px 0;color:#555;}</style></head><body>${htmlBody}</body></html>`,
    '',
    `--${boundary}--`,
  ];

  const rawEmail = emailLines.join('\r\n');
  const base64UrlEncoded = btoa(unescape(encodeURIComponent(rawEmail)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: base64UrlEncoded,
    }),
  });

  if (!response.ok) {
    const errorDetails = await response.json().catch(() => null);
    const msg = errorDetails?.error?.message || `Error HTTP ${response.status} al enviar correo con Gmail`;
    throw new Error(msg);
  }

  return await response.json();
}

interface ExtractedGmailContent {
  text: string;
  html?: string;
  hasImages: boolean;
  inlineImages: Map<string, { mimeType: string; data: string }>;
  attachments: { name: string; size: string; type: string }[];
}

function extractGmailPayloadContent(payload: any): ExtractedGmailContent {
  const result: ExtractedGmailContent = {
    text: '',
    html: undefined,
    hasImages: false,
    inlineImages: new Map(),
    attachments: [],
  };

  function traverse(part: any) {
    if (!part) return;

    const mimeType = (part.mimeType || '').toLowerCase();
    const headers: Record<string, string> = {};
    if (part.headers && Array.isArray(part.headers)) {
      part.headers.forEach((h: any) => {
        if (h.name && h.value) headers[h.name.toLowerCase()] = h.value;
      });
    }

    const contentId = headers['content-id'] || '';
    const cleanCid = contentId.replace(/[<>]/g, '').trim();

    // Check for inline images
    if (mimeType.startsWith('image/') && part.body?.data) {
      result.hasImages = true;
      if (cleanCid) {
        result.inlineImages.set(cleanCid, {
          mimeType,
          data: part.body.data,
        });
      }
    }

    // Check for text/plain
    if (mimeType === 'text/plain' && part.body?.data && !result.text) {
      try {
        result.text = decodeBase64Url(part.body.data);
      } catch (e) {
        console.warn('Could not decode plain text part:', e);
      }
    }

    // Check for text/html
    if (mimeType === 'text/html' && part.body?.data && !result.html) {
      try {
        result.html = decodeBase64Url(part.body.data);
      } catch (e) {
        console.warn('Could not decode html part:', e);
      }
    }

    // Check for attachments
    if (part.filename && part.filename.length > 0) {
      const sizeBytes = part.body?.size || 0;
      const sizeStr =
        sizeBytes > 1024 * 1024
          ? `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
      result.attachments.push({
        name: part.filename,
        size: sizeStr,
        type: mimeType || 'application/octet-stream',
      });
      if (mimeType.startsWith('image/')) {
        result.hasImages = true;
      }
    }

    // Recursively traverse subparts
    if (part.parts && Array.isArray(part.parts)) {
      for (const subPart of part.parts) {
        traverse(subPart);
      }
    }
  }

  traverse(payload);

  // If HTML contains cid: references and matching inline images, replace them with base64 data URIs
  if (result.html && result.inlineImages.size > 0) {
    result.inlineImages.forEach((img, cid) => {
      const dataUri = `data:${img.mimeType};base64,${img.data.replace(/-/g, '+').replace(/_/g, '/')}`;
      const regex = new RegExp(`src=["']cid:(<)?${cid}(>)?["']`, 'gi');
      result.html = result.html!.replace(regex, `src="${dataUri}"`);
    });
  }

  // Check if html contains any <img tags
  if (result.html && /<img\s[^>]*src=/i.test(result.html)) {
    result.hasImages = true;
  }

  return result;
}

// Fetch real Gmail messages if accessToken is available
export async function fetchGmailMessages(accessToken: string): Promise<OrionEmail[]> {
  try {
    const listRes = await fetch(
      'https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=25',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!listRes.ok) {
      console.warn('Gmail API returned status:', listRes.status);
      return [];
    }

    const listData = await listRes.json();
    if (!listData.messages || !Array.isArray(listData.messages)) {
      return [];
    }

    const emailPromises = listData.messages.slice(0, 15).map(async (msg: { id: string }) => {
      try {
        const msgRes = await fetch(
          `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (!msgRes.ok) return null;
        const data = await msgRes.json();

        const headers: Record<string, string> = {};
        data.payload?.headers?.forEach((h: { name: string; value: string }) => {
          headers[h.name.toLowerCase()] = h.value;
        });

        const fromRaw = headers['from'] || 'Desconocido <unknown@mail.com>';
        let fromName = fromRaw;
        let fromEmail = fromRaw;
        const match = fromRaw.match(/(.*)<(.*)>/);
        if (match) {
          fromName = match[1].replace(/["']/g, '').trim() || match[2].trim();
          fromEmail = match[2].trim();
        }

        const subject = headers['subject'] || '(Sin asunto)';
        const dateHeader = headers['date'];
        const timestamp = dateHeader ? new Date(dateHeader).getTime() || Date.now() : Date.now();
        const date = new Date(timestamp).toISOString();

        // Extract deep payload content (text, html, images, attachments)
        const content = extractGmailPayloadContent(data.payload);
        const snippet = data.snippet || '';

        // Determine plain text body and clean preview
        const plainTextBody = content.text || (content.html ? content.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : snippet);
        const cleanPreview = snippet || plainTextBody.slice(0, 120);

        const labelIds: string[] = data.labelIds || [];
        const isUnread = labelIds.includes('UNREAD');
        const isStarred = labelIds.includes('STARRED');

        let folder: MailFolder = 'inbox';
        if (labelIds.includes('SENT')) {
          folder = 'sent';
        } else if (labelIds.includes('DRAFT')) {
          folder = 'drafts';
        } else if (labelIds.includes('TRASH')) {
          folder = 'trash';
        }

        const emailItem: OrionEmail = {
          id: `gmail-${data.id}`,
          source: 'gmail',
          from: {
            name: fromName,
            email: fromEmail,
          },
          to: [headers['to'] || 'me'],
          subject,
          preview: cleanPreview,
          body: plainTextBody,
          bodyHtml: content.html,
          hasImages: content.hasImages,
          attachments: content.attachments.length > 0 ? content.attachments : undefined,
          date,
          timestamp,
          folder,
          isRead: !isUnread,
          isStarred,
          labels: ['Gmail'],
        };
        return emailItem;
      } catch (e) {
        console.error('Error fetching individual Gmail message:', e);
        return null;
      }
    });

    const results = await Promise.all(emailPromises);
    return results.filter((item): item is OrionEmail => item !== null);
  } catch (error) {
    console.error('Error fetching Gmail messages:', error);
    return [];
  }
}

function decodeBase64Url(input: string): string {
  try {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (m) => m.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return input;
  }
}

// Firestore Realtime Listener for Internal Emails
export function subscribeToInternalEmails(
  userId: string,
  onEmailsUpdate: (emails: OrionEmail[]) => void
) {
  try {
    const emailsRef = collection(db, 'users', userId, 'emails');
    return onSnapshot(
      emailsRef,
      (snapshot) => {
        if (snapshot.empty) {
          // If Firestore collection empty for new user, seed initial emails
          const initial = loadCachedEmails();
          initial.forEach((em) => {
            setDoc(doc(db, 'users', userId, 'emails', em.id), {
              ...em,
              userId,
            }).catch(console.error);
          });
          onEmailsUpdate(initial);
        } else {
          const list: OrionEmail[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as OrionEmail);
          });
          list.sort((a, b) => b.timestamp - a.timestamp);
          saveCachedEmails(list);
          onEmailsUpdate(list);
        }
      },
      (error) => {
        console.error('Firestore emails listener error, falling back to cache:', error);
        onEmailsUpdate(loadCachedEmails());
      }
    );
  } catch (err) {
    console.error('Error setting up emails listener:', err);
    onEmailsUpdate(loadCachedEmails());
    return () => {};
  }
}

// Persist single email update to Firestore & cache
export async function persistEmailUpdate(userId: string | null, email: OrionEmail): Promise<void> {
  if (userId) {
    try {
      const emailRef = doc(db, 'users', userId, 'emails', email.id);
      await setDoc(emailRef, { ...email, userId }, { merge: true });
    } catch (e) {
      console.error('Error updating email in Firestore:', e);
    }
  }
}

// Delete email from Firestore
export async function persistEmailDelete(userId: string | null, emailId: string): Promise<void> {
  if (userId) {
    try {
      const emailRef = doc(db, 'users', userId, 'emails', emailId);
      await deleteDoc(emailRef);
    } catch (e) {
      console.error('Error deleting email in Firestore:', e);
    }
  }
}
