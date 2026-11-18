import React from 'react';
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Sun,
} from 'lucide-react';
import { WeatherData } from '../types/launcher';

interface WeatherWidgetProps {
  weather: WeatherData | null;
  unit: 'C' | 'F';
  loading: boolean;
  isLight?: boolean;
  onRefresh: () => void;
}

function getWeatherIcon(code: number) {
  if (code === 0) return Sun;
  if (code <= 3) return Cloud;
  if (code <= 48) return CloudFog;
  if (code <= 57) return CloudDrizzle;
  if (code <= 67 || (code >= 80 && code <= 82)) return CloudRain;
  if (code <= 77) return CloudSnow;
  if (code >= 95) return CloudLightning;
  return Cloud;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  weather,
  unit,
  loading,
  isLight = false,
  onRefresh,
}) => {
  // Never display fake or placeholder weather/location text if real data is unavailable
  if (!weather) {
    return null;
  }

  const temp =
    unit === 'F'
      ? Math.round((weather.temperatureC * 9) / 5 + 32)
      : weather.temperatureC;

  const Icon = getWeatherIcon(weather.weatherCode);

  return (
    <button
      type="button"
      onClick={onRefresh}
      title="Tap to refresh weather"
      className={`group inline-flex items-center gap-2 text-left text-xs sm:text-sm transition-colors min-h-[36px] focus:outline-none focus-visible:ring-1 rounded-lg ${
        isLight
          ? 'text-zinc-700 hover:text-zinc-950 focus-visible:ring-zinc-900/35'
          : 'text-zinc-300 hover:text-white focus-visible:ring-white/40'
      }`}
    >
      <Icon
        className={`w-4 h-4 shrink-0 ${isLight ? 'text-zinc-800' : 'text-zinc-200'} ${
          loading ? 'opacity-50' : ''
        }`}
        strokeWidth={1.6}
      />
      <span className={`font-mono-tabular font-medium ${isLight ? 'text-zinc-950' : 'text-white'}`}>
        {temp}°{unit}
      </span>
      <span className={isLight ? 'text-zinc-400' : 'text-zinc-600'} aria-hidden="true">·</span>
      <span className={`${isLight ? 'text-zinc-700' : 'text-zinc-300'} truncate max-w-[140px]`}>
        {weather.condition}
      </span>
      {weather.locationName && (
        <>
          <span className={isLight ? 'text-zinc-400' : 'text-zinc-600'} aria-hidden="true">·</span>
          <span className={`${isLight ? 'text-zinc-500' : 'text-zinc-400'} truncate max-w-[140px]`}>
            {weather.locationName}
          </span>
        </>
      )}
    </button>
  );
};
