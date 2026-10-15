import React, { useState, useRef, useEffect } from 'react';
import { COLOR_PALETTE } from '../utils/calendarData';
import { Check, Palette } from 'lucide-react';

interface ColorPickerPopoverProps {
  currentColor: string;
  onSelectColor: (hex: string) => void;
}

export const ColorPickerPopover: React.FC<ColorPickerPopoverProps> = ({
  currentColor,
  onSelectColor,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        title="Personalizar color del calendario"
        className="w-4 h-4 rounded-full border border-black/10 dark:border-white/20 transition-transform hover:scale-125 cursor-pointer flex items-center justify-center shrink-0 shadow-2xs"
        style={{ backgroundColor: currentColor }}
      />

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 sm:left-auto sm:right-0 top-6 z-50 p-2.5 bg-white dark:bg-[#252525] rounded-xl border border-[#e0e0de] dark:border-[#3a3a3a] shadow-xl w-48 space-y-2 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 px-1">
            Color Personalizado
          </div>
          <div className="grid grid-cols-4 gap-2 p-1">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => {
                  onSelectColor(c.hex);
                  setIsOpen(false);
                }}
                title={c.name}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-115 cursor-pointer shadow-2xs"
                style={{ backgroundColor: c.hex }}
              >
                {currentColor.toLowerCase() === c.hex.toLowerCase() && (
                  <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                )}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-[#f0f0ee] dark:border-[#333333] flex items-center gap-1.5 px-1">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => onSelectColor(e.target.value)}
              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
              id="custom-hex-input"
            />
            <label
              htmlFor="custom-hex-input"
              className="text-[11px] text-neutral-600 dark:text-neutral-400 font-mono cursor-pointer"
            >
              {currentColor.toUpperCase()}
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
