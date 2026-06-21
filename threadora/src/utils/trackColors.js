// Track color palette with expanded options
export const TRACK_COLORS = {
  'Dev': { hsl: '199 89% 45%', hex: '#0ea5e9' },
  'Design': { hsl: '271 65% 58%', hex: '#a855f7' },
  'Comms': { hsl: '151 49% 42%', hex: '#34a853' },
  'Research': { hsl: '173 80% 40%', hex: '#14b8a6' },
  'Marketing': { hsl: '330 81% 55%', hex: '#ec4899' },
  'Other': { hsl: '215 16% 65%', hex: '#94a3b8' },
};

const CUSTOM_TRACK_PALETTE = [
  { hsl: '262 80% 63%', hex: '#8b5cf6' }, // purple
  { hsl: '173 80% 40%', hex: '#14b8a6' }, // teal
  { hsl: '45 93% 47%', hex: '#eab308' }, // gold
  { hsl: '142 71% 45%', hex: '#22c55e' }, // green
  { hsl: '217 91% 60%', hex: '#3b82f6' }, // blue
  { hsl: '340 82% 52%', hex: '#e11d48' }, // rose
  { hsl: '188 86% 53%', hex: '#06b6d4' }, // cyan
  { hsl: '292 84% 61%', hex: '#d946ef' }, // fuchsia
];

let customTrackColorIndex = 0;

export function getNextCustomTrackColor() {
  const color = CUSTOM_TRACK_PALETTE[customTrackColorIndex % CUSTOM_TRACK_PALETTE.length];
  customTrackColorIndex++;
  return color;
}

export function getTrackColor(trackName) {
  if (TRACK_COLORS[trackName]?.hex) return TRACK_COLORS[trackName].hex;
  const name = String(trackName || 'Other');
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  return CUSTOM_TRACK_PALETTE[Math.abs(hash) % CUSTOM_TRACK_PALETTE.length].hex;
}
