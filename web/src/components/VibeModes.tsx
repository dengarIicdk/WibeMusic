import { useState } from 'react';
import type { MixMode, WaveLang, WaveSeedIn } from '../api/types';
import { toggle, useListen } from '../lib/listen';
import { canWave, startWave, useWave, WAVE_TITLE } from '../lib/wave';
import { Icon } from './Icon';
import { Spinner } from './ui';

export interface VibeMode {
  id: string;
  title: string;
  hint: string;
  mode: MixMode;
  lang?: WaveLang;
  seed: WaveSeedIn | null;
}

/** Режимы «Мой Вайб»: каждый режим — запуск волны Hub с другим `mode`, языком или сидом. */
export const VIBE_MODES: VibeMode[] = [
  { id: 'normal', title: 'Баланс', hint: 'Знакомое и новое поровну', mode: 'normal', seed: null },
  { id: 'favorites', title: 'Любимое', hint: 'Больше того, что вы любите', mode: 'favorites', seed: null },
  { id: 'discover', title: 'Незнакомое', hint: 'Новые имена и песни', mode: 'discover', seed: null },
  { id: 'ja', title: 'Японский', hint: 'Треки с японскими иероглифами и кана', mode: 'normal', lang: 'ja', seed: null },
  { id: 'ru', title: 'Кириллица', hint: 'Треки с русскими (кириллическими) названиями', mode: 'normal', lang: 'ru', seed: null },
  { id: 'latin', title: 'Латиница', hint: 'Треки с названиями латиницей', mode: 'normal', lang: 'latin', seed: null },
];

/** Режимы от текущего трека: «В стиле артиста» и «По этому треку». */
function seedModesOf(track: { ref: string; nd_song_id?: string | null; artist_ref?: string | null; artists?: { name: string; ref?: string }[] } | null): VibeMode[] {
  if (!track) return [];
  const out: VibeMode[] = [];
  const artist = track.artist_ref ?? track.artists?.find((a) => a.ref)?.ref;
  const artistName = track.artists?.[0]?.name;
  if (artist?.startsWith('dz:')) out.push({ id: 'artist', title: `В стиле ${artistName ?? 'артиста'}`, hint: 'Вайб по исполнителю, который играет сейчас', mode: 'normal', seed: { artist_ref: artist } });
  if (track.nd_song_id) out.push({ id: 'track', title: 'По этому треку', hint: 'Вайб, начатый с текущей песни', mode: 'normal', seed: { nd_song_id: track.nd_song_id } });
  return out;
}

/** Режим без своего сида берёт текущий трек: у нового пользователя истории ещё нет, и Hub без сида не строит волну. */
export function vibeSeed(mode: VibeMode, track: Parameters<typeof seedModesOf>[0]): WaveSeedIn | null {
  return mode.seed ?? seedModesOf(track)[0]?.seed ?? null;
}

/** Блок «Мой Вайб»: овал с режимами, которые скроллятся в обе стороны. Без `onSelect` выбор внутренний (главная и поиск). */
export function VibeModes({ origin, selected, onSelect }: { origin: 'home_card' | 'catalog_card'; selected?: VibeMode; onSelect?: (m: VibeMode) => void }) {
  const { title, starting } = useWave();
  const playing = useListen((s) => !!s.track && s.context.startsWith('wave:'));
  const track = useListen((s) => s.track);
  const [inner, setInner] = useState<VibeMode>(VIBE_MODES[0]);
  if (!canWave()) return null;

  const current = selected ?? inner;
  const pick = (m: VibeMode) => (onSelect ? onSelect(m) : setInner(m));
  const items = [...VIBE_MODES, ...seedModesOf(track)];
  const busy = starting === '';
  const on = playing && title === WAVE_TITLE;

  return (
    <section className="mx-4 mt-3" aria-label="Мой Вайб">
      <div
        className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto rounded-[999px] bg-raised px-4 py-3"
        role="listbox"
        aria-label="Режимы"
      >
        {items.map((item) => {
          const active = item.id === current.id;
          return (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => pick(item)}
              className={`min-w-[7.5rem] snap-center rounded-full border px-4 py-2 text-left text-sm transition ${active ? 'border-accent bg-accent text-on-accent' : 'border-line bg-surface text-muted hover:text-fg'}`}
            >
              <span className="block whitespace-nowrap font-semibold">{item.title}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="min-w-0 text-[13px] text-muted">{busy ? 'Подбираем первые треки…' : on ? 'Играет — подстраивается под каждый пропуск и ♥' : current.hint}</p>
        <button
          type="button"
          onClick={() => (on ? toggle() : void startWave(vibeSeed(current, track), origin, { mode: current.mode, lang: current.lang }))}
          disabled={starting !== null}
          aria-label={on ? 'Пауза' : `Растрясти вайб: ${current.title}`}
          className="flex h-12 shrink-0 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-on-accent shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-80"
        >
          {busy ? <Spinner size={20} /> : <Icon name={on ? 'pause' : 'refresh'} size={20} stroke={2.4} />}
          <span>{on ? 'Пауза' : 'Растрясти'}</span>
        </button>
      </div>
    </section>
  );
}
