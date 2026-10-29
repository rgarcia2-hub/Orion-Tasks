import React, { useMemo, useState, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import {
  Image as ImageIcon,
  Eye,
  FileText,
  ExternalLink,
  X,
  Copy,
  Check,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';

interface EmailBodyRendererProps {
  body: string;
  bodyHtml?: string;
  subject?: string;
}

export const EmailBodyRenderer: React.FC<EmailBodyRendererProps> = ({
  body,
  bodyHtml,
  subject,
}) => {
  const [viewMode, setViewMode] = useState<'rich' | 'plain'>('rich');
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt?: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Detect whether this is a rich HTML newsletter/email (e.g. from Gmail)
  const isHtmlEmail = useMemo(() => {
    return Boolean(bodyHtml && /<[a-z][\s\S]*>/i.test(bodyHtml));
  }, [bodyHtml]);

  // For HTML emails (like La Vanguardia, news, receipts), default to Light Canvas (standard email paper mode)
  // because 99% of newsletters have dark text and graphics designed for a white canvas.
  const [canvasTheme, setCanvasTheme] = useState<'light' | 'dark'>(() => {
    return isHtmlEmail ? 'light' : 'dark';
  });

  // Keep canvasTheme in sync if email switches
  useEffect(() => {
    if (isHtmlEmail) {
      setCanvasTheme('light');
    } else {
      setCanvasTheme('dark');
    }
  }, [isHtmlEmail, bodyHtml, body]);

  // Configure marked for safe GFM parsing with breaks
  useMemo(() => {
    marked.setOptions({
      gfm: true,
      breaks: true,
    });
  }, []);

  // Process and sanitize the HTML content
  const { renderedHtml, hasDetectedImages, imageCount } = useMemo(() => {
    let rawHtml = '';

    if (bodyHtml && bodyHtml.trim().length > 0) {
      rawHtml = bodyHtml;
    } else {
      // Parse markdown into HTML if only plain body is available
      try {
        const parsed = marked.parse(body || '');
        rawHtml = typeof parsed === 'string' ? parsed : '';
      } catch (err) {
        console.error('Error parsing markdown:', err);
        rawHtml = `<p>${(body || '').replace(/\n/g, '<br/>')}</p>`;
      }
    }

    // Sanitize with DOMPurify allowing standard email tags and attributes
    const cleanHtml = DOMPurify.sanitize(rawHtml, {
      ADD_TAGS: [
        'style',
        'img',
        'table',
        'tbody',
        'thead',
        'tfoot',
        'tr',
        'td',
        'th',
        'center',
        'font',
        'span',
        'div',
        'hr',
        'p',
        'b',
        'i',
        'u',
        's',
        'strike',
        'strong',
        'em',
        'small',
        'sub',
        'sup',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
      ],
      ADD_ATTR: [
        'target',
        'rel',
        'loading',
        'alt',
        'title',
        'width',
        'height',
        'style',
        'align',
        'valign',
        'border',
        'cellpadding',
        'cellspacing',
        'bgcolor',
        'background',
        'color',
        'face',
        'size',
        'colspan',
        'rowspan',
        'class',
        'id',
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|cid|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    });

    // Count images and setup interactions without disrupting email layouts
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = cleanHtml;

    // Ensure all links open safely in a new tab without destroying button styles
    const links = tempDiv.querySelectorAll('a');
    links.forEach((a) => {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
      const inlineStyle = a.getAttribute('style') || '';
      // Only apply default link colors if not already styled as button/banner
      if (!inlineStyle.includes('color:') && !inlineStyle.includes('background:')) {
        a.classList.add('text-indigo-600', 'hover:text-indigo-700', 'underline');
      }
    });

    // Track images and enable zoom, WITHOUT adding forced borders or margins
    const imgs = tempDiv.querySelectorAll('img');
    let validImgCount = 0;

    imgs.forEach((img, idx) => {
      img.setAttribute('loading', 'lazy');
      img.setAttribute('data-image-index', String(idx));
      img.style.maxWidth = '100%';

      // Check if it's a 1x1 tracking pixel
      const w = img.getAttribute('width');
      const h = img.getAttribute('height');
      const isPixel = (w === '1' && h === '1') || (w === '0' || h === '0');

      if (!isPixel) {
        validImgCount++;
        img.classList.add('cursor-zoom-in');
      }
    });

    return {
      renderedHtml: tempDiv.innerHTML,
      hasDetectedImages: validImgCount > 0,
      imageCount: validImgCount,
    };
  }, [body, bodyHtml]);

  // Click handler to catch image clicks for Lightbox view
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target && target.tagName === 'IMG') {
      const img = target as HTMLImageElement;
      // Skip tiny tracking pixels
      if (img.naturalWidth > 10 && img.naturalHeight > 10 && img.src) {
        setLightboxImage({
          src: img.src,
          alt: img.alt || subject || 'Imagen del correo',
        });
      }
    }
  };

  const copyImageLink = () => {
    if (lightboxImage?.src) {
      navigator.clipboard.writeText(lightboxImage.src);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="space-y-3">
      {/* View Toolbar: HTML vs Plain text, Canvas mode & Image counter */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
        <div className="flex items-center gap-2">
          {hasDetectedImages && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
              <ImageIcon className="w-3.5 h-3.5 text-neutral-400" />
              <span>
                {imageCount} {imageCount === 1 ? 'imagen' : 'imágenes'}
              </span>
            </span>
          )}

          <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400 dark:text-neutral-500">
            {isHtmlEmail ? (
              <span>HTML original</span>
            ) : (
              <span>Formato enriquecido</span>
            )}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Canvas Mode Toggle (Paper / Dark) for HTML emails */}
          {isHtmlEmail && viewMode === 'rich' && (
            <button
              type="button"
              onClick={() => setCanvasTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
              title={
                canvasTheme === 'light'
                  ? 'Ver en fondo oscuro'
                  : 'Ver en fondo blanco original (recomendado para newsletters)'
              }
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer bg-neutral-100 dark:bg-[#222222] hover:bg-neutral-200 dark:hover:bg-[#2c2c2c] text-neutral-700 dark:text-neutral-300 border border-neutral-200/70 dark:border-neutral-800"
            >
              {canvasTheme === 'light' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Lienzo claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Lienzo oscuro</span>
                </>
              )}
            </button>
          )}

          {/* Toggle between rich HTML and raw plain text */}
          <div className="flex items-center bg-neutral-100 dark:bg-[#222222] p-0.5 rounded-lg border border-neutral-200/60 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setViewMode('rich')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'rich'
                  ? 'bg-white dark:bg-[#181818] text-neutral-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Vista enriquecida</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('plain')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'plain'
                  ? 'bg-white dark:bg-[#181818] text-neutral-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Texto plano</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Email Reading Surface */}
      <div
        className={`rounded-2xl border transition-colors shadow-2xs overflow-hidden ${
          viewMode === 'rich' && isHtmlEmail && canvasTheme === 'light'
            ? 'bg-white text-neutral-900 border-neutral-200/90'
            : 'bg-white dark:bg-[#181818] text-neutral-800 dark:text-neutral-200 border-neutral-200/80 dark:border-neutral-800/80'
        }`}
      >
        {viewMode === 'rich' ? (
          <div
            onClick={handleContentClick}
            className={`${
              isHtmlEmail ? 'email-html-view' : 'email-markdown-view'
            } p-4 sm:p-7 text-sm leading-relaxed overflow-x-auto`}
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        ) : (
          <div className="p-6 sm:p-8 font-mono text-xs text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed overflow-x-auto bg-neutral-50/50 dark:bg-[#151515]">
            {body || (bodyHtml ? bodyHtml.replace(/<[^>]+>/g, ' ') : '(Sin contenido)')}
          </div>
        )}
      </div>

      {/* Lightbox Modal for enlarged images */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-neutral-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="h-12 px-4 bg-neutral-950 flex items-center justify-between text-neutral-300 text-xs border-b border-neutral-800 select-none">
              <span className="truncate max-w-md font-medium text-neutral-200">
                {lightboxImage.alt}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyImageLink}
                  title="Copiar enlace de imagen"
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors flex items-center gap-1 text-[11px]"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copiado' : 'Copiar URL'}</span>
                </button>
                <a
                  href={lightboxImage.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Abrir en pestaña nueva"
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxImage(null)}
                  title="Cerrar vista"
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Image viewer */}
            <div className="p-4 flex items-center justify-center overflow-auto max-h-[calc(90vh-3rem)]">
              <img
                src={lightboxImage.src}
                alt={lightboxImage.alt || 'Imagen ampliada'}
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
