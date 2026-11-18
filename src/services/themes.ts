import animeLofiArt from '../assets/images/cartoon_anime_lofi_1794738131046.jpg';
import comicCityArt from '../assets/images/cartoon_comic_city_1794738131858.jpg';
import pixelWorldArt from '../assets/images/cartoon_pixel_world_1794738133562.jpg';
import spaceBotArt from '../assets/images/cartoon_space_bot_1794738133619.jpg';
import storybookSkyArt from '../assets/images/cartoon_storybook_sky_1794738132470.jpg';
import { LauncherTheme } from '../types/launcher';

export interface ThemeDefinition {
  id: LauncherTheme;
  name: string;
  category: 'cartoon' | 'monochrome' | 'color' | 'light';
  description: string;
  isLight: boolean;
  swatchBg: string;
  swatchAccent: string;
  canvasBackground: string;
  ambientOverlay: string | null;
  backgroundImage?: string;
  scrimCss?: string;
  accentHex: string;
  accentFgHex: string;
  accentRgb: string;
  trackRgb: string;
  glowRgb: string;
  bgHex: string;
  fgHex: string;
}

export const LAUNCHER_THEMES: ThemeDefinition[] = [
  // Cartoon & Illustrated Themes
  {
    id: 'cartoon-anime',
    name: 'Midnight Anime',
    category: 'cartoon',
    description: 'Hand-painted lantern night sky with drifting sakura clouds',
    isLight: false,
    swatchBg: 'linear-gradient(155deg, #1e295b 0%, #0d1229 100%)',
    swatchAccent: '#fda4af',
    canvasBackground: 'linear-gradient(180deg, #0b1026 0%, #141c3d 55%, #0a0d1c 100%)',
    ambientOverlay: null,
    backgroundImage: animeLofiArt,
    scrimCss:
      'linear-gradient(180deg, rgba(8,12,30,0.48) 0%, rgba(10,15,36,0.34) 55%, rgba(8,10,24,0.58) 100%)',
    accentHex: '#fda4af',
    accentFgHex: '#250711',
    accentRgb: '253, 164, 175',
    trackRgb: '254, 205, 211',
    glowRgb: '253, 164, 175',
    bgHex: '#0b1026',
    fgHex: '#fff1f2',
  },
  {
    id: 'cartoon-comic',
    name: 'Retro Comic Pop',
    category: 'cartoon',
    description: 'Halftone twilight skyline with cel-shaded ink clouds',
    isLight: false,
    swatchBg: 'linear-gradient(155deg, #2d1b4e 0%, #0d132e 100%)',
    swatchAccent: '#facc15',
    canvasBackground: 'linear-gradient(180deg, #0a1026 0%, #24183c 55%, #0e172a 100%)',
    ambientOverlay: null,
    backgroundImage: comicCityArt,
    scrimCss:
      'linear-gradient(180deg, rgba(10,14,34,0.42) 0%, rgba(18,14,38,0.32) 55%, rgba(8,11,24,0.58) 100%)',
    accentHex: '#facc15',
    accentFgHex: '#1c1502',
    accentRgb: '250, 204, 21',
    trackRgb: '253, 224, 71',
    glowRgb: '250, 204, 21',
    bgHex: '#0a1026',
    fgHex: '#fefce8',
  },
  {
    id: 'cartoon-pixel',
    name: 'Pixel Quest 16-Bit',
    category: 'cartoon',
    description: 'Retro pixel art starry sky with floating lighthouse island',
    isLight: false,
    swatchBg: 'linear-gradient(155deg, #1b1745 0%, #090b21 100%)',
    swatchAccent: '#22d3ee',
    canvasBackground: 'linear-gradient(180deg, #090b21 0%, #1c1947 58%, #261b47 100%)',
    ambientOverlay: null,
    backgroundImage: pixelWorldArt,
    scrimCss:
      'linear-gradient(180deg, rgba(7,9,26,0.42) 0%, rgba(12,14,38,0.28) 55%, rgba(14,12,34,0.5) 100%)',
    accentHex: '#22d3ee',
    accentFgHex: '#041d24',
    accentRgb: '34, 211, 238',
    trackRgb: '103, 232, 249',
    glowRgb: '34, 211, 238',
    bgHex: '#090b21',
    fgHex: '#ecfeff',
  },
  {
    id: 'cartoon-space',
    name: 'Cosmic Space Bot',
    category: 'cartoon',
    description: 'Playful cartoon bot floating among ringed planets & stars',
    isLight: false,
    swatchBg: 'linear-gradient(155deg, #27184e 0%, #100926 100%)',
    swatchAccent: '#fb923c',
    canvasBackground: 'linear-gradient(180deg, #0d0820 0%, #1b1038 55%, #110926 100%)',
    ambientOverlay: null,
    backgroundImage: spaceBotArt,
    scrimCss:
      'linear-gradient(180deg, rgba(11,7,28,0.4) 0%, rgba(15,9,36,0.28) 55%, rgba(10,6,24,0.48) 100%)',
    accentHex: '#fb923c',
    accentFgHex: '#240c02',
    accentRgb: '251, 146, 60',
    trackRgb: '253, 186, 116',
    glowRgb: '251, 146, 60',
    bgHex: '#0d0820',
    fgHex: '#fff7ed',
  },
  {
    id: 'cartoon-storybook',
    name: 'Storybook Sky',
    category: 'cartoon',
    description: 'Daylight cartoon clouds, hot-air balloon & rolling hills',
    isLight: true,
    swatchBg: 'linear-gradient(155deg, #e0f2fe 0%, #bae6fd 100%)',
    swatchAccent: '#e11d48',
    canvasBackground: 'linear-gradient(180deg, #e5f3ff 0%, #d4ebff 60%, #e4f2d8 100%)',
    ambientOverlay: null,
    backgroundImage: storybookSkyArt,
    scrimCss:
      'linear-gradient(180deg, rgba(236,246,255,0.44) 0%, rgba(240,248,255,0.6) 56%, rgba(232,244,252,0.3) 100%)',
    accentHex: '#e11d48',
    accentFgHex: '#ffffff',
    accentRgb: '225, 29, 72',
    trackRgb: '15, 23, 42',
    glowRgb: '225, 29, 72',
    bgHex: '#e5f3ff',
    fgHex: '#0f172a',
  },

  // Monochrome & AMOLED
  {
    id: 'amoled',
    name: 'Pure Black AMOLED',
    category: 'monochrome',
    description: '#000000 true black canvas with crisp white highlights',
    isLight: false,
    swatchBg: '#000000',
    swatchAccent: '#ffffff',
    canvasBackground: '#000000',
    ambientOverlay: null,
    accentHex: '#ffffff',
    accentFgHex: '#000000',
    accentRgb: '255, 255, 255',
    trackRgb: '255, 255, 255',
    glowRgb: '255, 255, 255',
    bgHex: '#000000',
    fgHex: '#f4f4f5',
  },
  {
    id: 'dark-grey',
    name: 'Dark Graphite',
    category: 'monochrome',
    description: 'Deep slate charcoal surface with muted contrast',
    isLight: false,
    swatchBg: 'linear-gradient(145deg, #18181b 0%, #09090b 100%)',
    swatchAccent: '#e4e4e7',
    canvasBackground: 'linear-gradient(180deg, #121318 0%, #09090b 65%, #070709 100%)',
    ambientOverlay:
      'radial-gradient(circle at 75% 15%, rgba(255, 255, 255, 0.05) 0%, transparent 52%)',
    accentHex: '#f4f4f5',
    accentFgHex: '#09090b',
    accentRgb: '244, 244, 245',
    trackRgb: '228, 228, 231',
    glowRgb: '228, 228, 231',
    bgHex: '#09090b',
    fgHex: '#f4f4f5',
  },
  {
    id: 'silver',
    name: 'Titanium Silver',
    category: 'monochrome',
    description: 'Brushed gunmetal steel with luminous silver glow',
    isLight: false,
    swatchBg: 'linear-gradient(145deg, #3f3f46 0%, #18181b 100%)',
    swatchAccent: '#ffffff',
    canvasBackground: 'linear-gradient(165deg, #27272d 0%, #16161b 50%, #0e0e12 100%)',
    ambientOverlay:
      'radial-gradient(circle at 25% 20%, rgba(255, 255, 255, 0.09) 0%, transparent 55%)',
    accentHex: '#ffffff',
    accentFgHex: '#18181b',
    accentRgb: '255, 255, 255',
    trackRgb: '244, 244, 245',
    glowRgb: '255, 255, 255',
    bgHex: '#16161b',
    fgHex: '#fafafa',
  },

  // Color Themes
  {
    id: 'midnight-ocean',
    name: 'Midnight Sapphire',
    category: 'color',
    description: 'Deep oceanic navy with crisp sky-cyan accents',
    isLight: false,
    swatchBg: 'linear-gradient(145deg, #0f294a 0%, #050d1d 100%)',
    swatchAccent: '#38bdf8',
    canvasBackground: 'linear-gradient(165deg, #0a1b36 0%, #061022 52%, #030812 100%)',
    ambientOverlay:
      'radial-gradient(circle at 75% 22%, rgba(56, 189, 248, 0.14) 0%, rgba(14, 165, 233, 0.04) 42%, transparent 72%)',
    accentHex: '#38bdf8',
    accentFgHex: '#041322',
    accentRgb: '56, 189, 248',
    trackRgb: '125, 211, 252',
    glowRgb: '56, 189, 248',
    bgHex: '#061022',
    fgHex: '#f0f9ff',
  },
  {
    id: 'emerald-forest',
    name: 'Emerald Night',
    category: 'color',
    description: 'Botanical deep pine with luminous mint accents',
    isLight: false,
    swatchBg: 'linear-gradient(145deg, #0c3527 0%, #04140e 100%)',
    swatchAccent: '#34d399',
    canvasBackground: 'linear-gradient(165deg, #09261c 0%, #05150f 55%, #020b07 100%)',
    ambientOverlay:
      'radial-gradient(circle at 72% 24%, rgba(52, 211, 153, 0.13) 0%, rgba(16, 185, 129, 0.03) 44%, transparent 74%)',
    accentHex: '#34d399',
    accentFgHex: '#022c22',
    accentRgb: '52, 211, 153',
    trackRgb: '110, 231, 183',
    glowRgb: '52, 211, 153',
    bgHex: '#05150f',
    fgHex: '#ecfdf5',
  },
  {
    id: 'amber-sunset',
    name: 'Amber Horizon',
    category: 'color',
    description: 'Warm espresso dusk with golden amber highlights',
    isLight: false,
    swatchBg: 'linear-gradient(145deg, #3c1f0d 0%, #140904 100%)',
    swatchAccent: '#fbbf24',
    canvasBackground: 'linear-gradient(165deg, #241208 0%, #140a05 55%, #0b0502 100%)',
    ambientOverlay:
      'radial-gradient(circle at 74% 22%, rgba(251, 191, 36, 0.14) 0%, rgba(245, 158, 11, 0.04) 44%, transparent 72%)',
    accentHex: '#fbbf24',
    accentFgHex: '#1c0f03',
    accentRgb: '251, 191, 36',
    trackRgb: '252, 211, 77',
    glowRgb: '251, 191, 36',
    bgHex: '#140a05',
    fgHex: '#fffbeb',
  },
  {
    id: 'crimson-noir',
    name: 'Crimson Velvet',
    category: 'color',
    description: 'Rich burgundy shadows with rose-crimson accents',
    isLight: false,
    swatchBg: 'linear-gradient(145deg, #431020 0%, #140409 100%)',
    swatchAccent: '#fb7185',
    canvasBackground: 'linear-gradient(165deg, #280a14 0%, #15050b 55%, #0c0205 100%)',
    ambientOverlay:
      'radial-gradient(circle at 74% 24%, rgba(251, 113, 133, 0.14) 0%, rgba(244, 63, 94, 0.04) 44%, transparent 72%)',
    accentHex: '#fb7185',
    accentFgHex: '#23040d',
    accentRgb: '251, 113, 133',
    trackRgb: '253, 164, 175',
    glowRgb: '251, 113, 133',
    bgHex: '#15050b',
    fgHex: '#fff1f2',
  },
  {
    id: 'violet-cosmos',
    name: 'Aurora Violet',
    category: 'color',
    description: 'Deep cosmic indigo with soft ultraviolet glow',
    isLight: false,
    swatchBg: 'linear-gradient(145deg, #27154a 0%, #0b0616 100%)',
    swatchAccent: '#a78bfa',
    canvasBackground: 'linear-gradient(165deg, #1b0f35 0%, #0f081e 55%, #080412 100%)',
    ambientOverlay:
      'radial-gradient(circle at 72% 24%, rgba(167, 139, 250, 0.16) 0%, rgba(139, 92, 246, 0.04) 45%, transparent 74%)',
    accentHex: '#a78bfa',
    accentFgHex: '#120826',
    accentRgb: '167, 139, 250',
    trackRgb: '196, 181, 253',
    glowRgb: '167, 139, 250',
    bgHex: '#0f081e',
    fgHex: '#f5f3ff',
  },

  // Light Themes
  {
    id: 'nordic-paper',
    name: 'Nordic Paper',
    category: 'light',
    description: 'Warm architectural ivory canvas with crisp charcoal ink',
    isLight: true,
    swatchBg: 'linear-gradient(145deg, #faf8f4 0%, #e7e2d8 100%)',
    swatchAccent: '#18181b',
    canvasBackground: 'linear-gradient(180deg, #f6f4ee 0%, #eeebe2 58%, #e6e1d5 100%)',
    ambientOverlay:
      'radial-gradient(circle at 75% 18%, rgba(24, 24, 27, 0.04) 0%, transparent 55%)',
    accentHex: '#18181b',
    accentFgHex: '#fafaf9',
    accentRgb: '24, 24, 27',
    trackRgb: '24, 24, 27',
    glowRgb: '24, 24, 27',
    bgHex: '#f4f1ea',
    fgHex: '#18181b',
  },
  {
    id: 'sky-daylight',
    name: 'Daylight Sky',
    category: 'light',
    description: 'Bright glacial blue surface with deep cobalt ink',
    isLight: true,
    swatchBg: 'linear-gradient(145deg, #f0f7ff 0%, #cfe4ff 100%)',
    swatchAccent: '#2563eb',
    canvasBackground: 'linear-gradient(170deg, #f2f7ff 0%, #e4efff 55%, #d6e6ff 100%)',
    ambientOverlay:
      'radial-gradient(circle at 74% 20%, rgba(37, 99, 235, 0.09) 0%, transparent 58%)',
    accentHex: '#1d4ed8',
    accentFgHex: '#ffffff',
    accentRgb: '29, 78, 216',
    trackRgb: '15, 23, 42',
    glowRgb: '37, 99, 235',
    bgHex: '#e8f1ff',
    fgHex: '#0f172a',
  },
];

export const THEME_MAP: Record<LauncherTheme, ThemeDefinition> = LAUNCHER_THEMES.reduce(
  (acc, t) => {
    acc[t.id] = t;
    return acc;
  },
  {} as Record<LauncherTheme, ThemeDefinition>
);

export function getThemeDefinition(themeId: LauncherTheme | string | undefined): ThemeDefinition {
  if (themeId && themeId in THEME_MAP) {
    return THEME_MAP[themeId as LauncherTheme];
  }
  return THEME_MAP.amoled;
}
