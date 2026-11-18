import React from 'react';
import {
  BookOpen,
  Calculator,
  Calendar,
  Camera,
  Clock,
  Cloud,
  Code2,
  Compass,
  Cpu,
  Folder,
  Globe,
  Image as ImageIcon,
  Layers,
  Mail,
  MapPin,
  MessageSquare,
  Mic,
  Music,
  NotebookPen,
  Phone,
  Radio,
  Search,
  Shield,
  SlidersHorizontal,
  Terminal,
  Video,
  Wallet,
} from 'lucide-react';
import { AppIconKey, AppItem, IconShape, IconSize } from '../types/launcher';

interface AppIconGlyphProps {
  app: AppItem;
  size?: IconSize;
  shape?: IconShape;
  monochrome?: boolean;
  uniformMask?: boolean;
  highlighted?: boolean;
  isLight?: boolean;
  pixelSize?: number;
  className?: string;
}

const ICON_MAP: Record<AppIconKey, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  phone: Phone,
  message: MessageSquare,
  mail: Mail,
  globe: Globe,
  camera: Camera,
  image: ImageIcon,
  music: Music,
  video: Video,
  map: MapPin,
  calendar: Calendar,
  clock: Clock,
  calculator: Calculator,
  note: NotebookPen,
  folder: Folder,
  terminal: Terminal,
  code: Code2,
  cloud: Cloud,
  compass: Compass,
  book: BookOpen,
  shield: Shield,
  sliders: SlidersHorizontal,
  radio: Radio,
  search: Search,
  layers: Layers,
  cpu: Cpu,
  wallet: Wallet,
  mic: Mic,
  sparkles: Compass,
};

export const AppIconGlyph: React.FC<AppIconGlyphProps> = ({
  app,
  size = 'medium',
  shape = 'squircle',
  monochrome = true,
  uniformMask = false,
  highlighted = false,
  isLight = false,
  pixelSize,
  className = '',
}) => {
  const IconComponent = ICON_MAP[app.iconKey] || Compass;

  const boxSizeClass =
    size === 'small'
      ? 'w-9 h-9'
      : size === 'large'
      ? 'w-14 h-14'
      : 'w-11 h-11';

  const glyphSizeClass =
    size === 'small'
      ? 'w-4 h-4'
      : size === 'large'
      ? 'w-6 h-6'
      : 'w-5 h-5';

  const radiusClass =
    shape === 'circle'
      ? 'rounded-full'
      : shape === 'sharp'
      ? 'rounded-lg'
      : 'rounded-2xl';

  const boxStyle: React.CSSProperties | undefined = pixelSize
    ? { width: `${pixelSize}px`, height: `${pixelSize}px` }
    : undefined;

  if (app.iconBase64) {
    return (
      <div
        style={boxStyle}
        className={`relative flex items-center justify-center overflow-hidden shrink-0 border transition-colors ${
          pixelSize ? '' : boxSizeClass
        } ${radiusClass} ${
          isLight
            ? highlighted
              ? 'border-zinc-900/60 bg-white shadow-sm'
              : 'border-zinc-900/15 bg-white/90'
            : highlighted
            ? 'border-white/70 bg-zinc-900 shadow-[0_0_20px_rgba(255,255,255,0.22)]'
            : uniformMask
            ? 'border-white/25 bg-zinc-900'
            : 'border-white/15 bg-zinc-950'
        } ${className}`}
      >
        <img
          src={app.iconBase64}
          alt={app.name}
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover ${
            uniformMask
              ? 'grayscale contrast-150 brightness-95 scale-[0.82] rounded-xl'
              : monochrome
              ? 'grayscale contrast-125 brightness-105'
              : ''
          }`}
        />
        {uniformMask && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/15 bg-gradient-to-b from-white/10 to-black/25"
          />
        )}
      </div>
    );
  }

  return (
    <div
      style={boxStyle}
      className={`relative flex items-center justify-center shrink-0 border transition-all duration-200 ${
        pixelSize ? '' : boxSizeClass
      } ${radiusClass} ${
        isLight
          ? highlighted
            ? 'bg-gradient-to-b from-white to-zinc-100 border-zinc-900/45 text-zinc-950 shadow-sm'
            : uniformMask
            ? 'bg-white/95 border-zinc-900/20 text-zinc-900 shadow-sm'
            : 'bg-white/80 border-zinc-900/15 text-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
          : highlighted
          ? 'bg-gradient-to-b from-white/20 via-zinc-800/95 to-zinc-950 border-white/60 text-white shadow-[0_0_24px_rgba(255,255,255,0.22)]'
          : uniformMask
          ? 'bg-zinc-950 border-white/25 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
          : monochrome
          ? 'bg-gradient-to-b from-zinc-800/75 to-zinc-950/95 border-white/15 text-zinc-200'
          : 'bg-gradient-to-b from-zinc-700/80 to-zinc-900 border-white/25 text-white'
      } ${className}`}
    >
      <IconComponent
        className={pixelSize ? 'w-[46%] h-[46%]' : glyphSizeClass}
        strokeWidth={highlighted ? 1.85 : uniformMask ? 1.7 : 1.5}
      />
    </div>
  );
};
