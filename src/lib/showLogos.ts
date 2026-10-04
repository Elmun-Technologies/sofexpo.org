/** Show logos: data in src/data/show-logos.json, files built by `npm run logos`. */
import logos from '@/data/show-logos.json';
import dims from '@/data/show-logo-dims.json';

export interface ShowLogo {
  id: string;
  name: string;
  plate: string;
  round: boolean;
  webp: string;
  png: string;
  width: number;
  height: number;
}

type Entry = { id: string; master: string; name: string; plate: string; shape: 'round' | 'wide' };

export function logoFor(slug: string | null | undefined): ShowLogo | null {
  if (!slug) return null;
  const l = (logos as unknown as Record<string, Entry>)[slug];
  const d = (dims as unknown as Record<string, [number, number]>)[slug];
  if (!l || !d || slug.startsWith('_')) return null;
  return {
    id: l.id,
    name: l.name,
    plate: l.plate,
    round: l.shape === 'round',
    webp: `/brand/${l.id}/logo.webp`,
    png: `/brand/${l.id}/logo.png`,
    width: d[0],
    height: d[1],
  };
}
