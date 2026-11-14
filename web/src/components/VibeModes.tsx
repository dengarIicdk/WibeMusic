import { useState } from 'react';
import type { MixMode, WaveLang, WaveSeedIn } from '../api/types';
import { toggle, useListen } from '../lib/listen';
import { canWave, startWave, useWave } from '../lib/wave';
import { Icon } from './Icon';
import { Spinner } from './ui';

/** Режимы «Мой Вайб»: каждый режим — это запуск волны Hub с другим `mode`, языком или сидом. */
const MODES: Array<{ id: string; title: string; hint: string; mode: MixMode; lang?: WaveLang }> = [
  { id: 'normal', title: 'Обычный', hint: 'Баланс знакомого и нового', mode: 'normal' },
  { id: 'favorites', title: 'Любимое', hint: 'Больше того, что вы любите', mode: 'favorites' },
  { id: 'discover', title: 'Незнакомое', hint: 'Новые имена и песни', mode: 'discover' },
  { id: 'ja', title: 'Японский', hint: 'Только треки на японском', mode: 'normal', lang: 'ja' },
  { id: 'ru', title: 'Русский', hint: 'Только треки на русском', mode: 'normal', lang: 'ru' },
  { id: 'latin', title: 'Английский', hint: 'Треки на латинице', mode: 'normal', lang: 'latin' },
];

/** Режим «В стиле артиста» и «По треку» строятся от текущего трека. */
function seedsOf(track: { ref: string; nd_song_id?: string | null; artist_ref?: string | null; artists?: { name: string; ref?: string }[] } | null): Array<{ id: string; title: string; hint: string; seed: WaveSeedIn | null }> {
  if (!track) return [];
  const out: Array<{ id: string; title: string; hint: string; seed: WaveSeedIn | null }> = [];
  const artist = track.artist_ref ?? track.artists?.find((a) => a.ref)?.ref;
  const artistName = track.artists?.[0]?.name;
  if (artist?.startsWith('dz:')) out.push({ id: 'artist', title: `В стиле ${artistName ?? 'артиста'}`, hint: 'Вайб по исполнителю, который играет сейчас', seed: { artist_ref: artist } });
  if (track.nd_song_id) out.push({ id: 'track', title: 'По этому треку', hint: 'Вайб, начатый с текущей песни', seed: { nd_song_id: track.nd_song_id } });
  return out;
}

/** Блок «Мой Вайб» для главной и поиска: горизонтальная лента режимов, свайп в обе стороны. */
export function VibeModes({ origin }: { origin: 'home_card' | 'catalog_card' }) {
  const { title, starting } = useWave();
  const playing = useListen((s) => !!s.track && s.context.startsWith('wave:'));
  const track = useListen((s) => s.track);
  const [index, setIndex] = useState(0);
  if (!canWave()) return null;

  const seeds = seedsOf(track);
  const items = [...MODES.map((m) => ({ ...m, seed: null as WaveSeedIn | null })), ...seeds.map((s) => ({ ...s, mode: 'normal' as MixMode, lang: undefined as WaveLang | undefined }))];
  const current = items[Math.min(index, items.length - 1)];
  const busy = starting === '';
  const on = playing && title === 'Мой Вайб';

  return (
    <section className="mx-4 mt-3 rounded-2xl bg-raised p-4" aria-label="Мой Вайб">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Мой Вайб</h2>
          <p className="text-[13px] text-muted">{busy ? 'Подбираем первые треки…' : on ? 'Играет — подстраивается под каждый пропуск и ♥' : current.hint}</p>
        </div>
        <button
          type="button"
          onClick={() => (on ? toggle() : void startWave(current.seed, origin, { mode: current.mode, lang: current.lang }))}
          disabled={starting !== null}
          aria-label={on ? 'Пауза' : `Запустить: ${current.title}`}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-80"
        >
          {busy ? <Spinner size={24} /> : <Icon name={on ? 'pause' : 'play'} size={24} stroke={2.4} className={on ? '' : 'translate-x-px'} />}
        </button>
      </div>

      <div className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1" role="listbox" aria-label="Режимы">
        {items.map((item, i) => (
          <button
            key={item.id + i}
            type="button"
            role="option"
            aria-selected={i === index}
            onClick={() => setIndex(i)}
            className={`min-w-[9.5rem] snap-start rounded-xl border px-3 py-2.5 text-left text-sm transition ${i === index ? 'border-accent bg-accent/15 text-fg' : 'border-line bg-surface text-muted hover:text-fg'}`}
          >
            <span className="block font-semibold">{item.title}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
