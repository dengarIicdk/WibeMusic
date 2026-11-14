import { useState } from 'react';
import { Icon } from '../components/Icon';
import { VibeModes, VIBE_MODES, vibeSeed, type VibeMode } from '../components/VibeModes';
import { PageHeader, Spinner } from '../components/ui';
import { Link } from '../lib/router';
import { toggle, useListen } from '../lib/listen';
import { canWave, startWave, useWave, WAVE_TITLE } from '../lib/wave';

/** «Мой Вайб» as its own screen (the tab in the bottom bar): the modes in a scrolling oval, and «Растрясти вайб» —
 * a fresh wave of the chosen mode, shaken up: the same taste, other tracks. */
export function VibePage() {
  const { title, starting } = useWave();
  const playing = useListen((s) => !!s.track && s.context.startsWith('wave:'));
  const track = useListen((s) => s.track);
  const [mode, setMode] = useState<VibeMode>(VIBE_MODES[0]);
  if (!canWave()) return null;

  const busy = starting === '';
  const on = playing && title === WAVE_TITLE;

  return (
    <div className="pb-4">
      <PageHeader title="Мой Вайб" sub="Бесконечный поток под ваш вкус" />
      <VibeModes origin="catalog_card" selected={mode} onSelect={setMode} />
      <div className="mx-4 mt-5 flex justify-center"><Link to="/catalog/genres" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-5 text-sm font-semibold transition hover:bg-hover"><Icon name="playlist" size={18} />Исследовать подборки</Link></div>
      <div className="mx-4 mt-6 flex flex-col items-center gap-3 text-center">
        <button
          type="button"
          onClick={() => (on ? toggle() : void startWave(vibeSeed(mode, track), 'catalog_card', { mode: mode.mode, lang: mode.lang }))}
          disabled={starting !== null}
          aria-label={on ? 'Пауза' : `Растрясти вайб: ${mode.title}`}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-on-accent shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-80"
        >
          {busy ? <Spinner size={28} /> : <Icon name={on ? 'pause' : 'refresh'} size={30} stroke={2.4} />}
        </button>
        <div className="font-semibold">{on ? 'Играет' : 'Растрясти вайб'}</div>
        <p className="max-w-xs text-[13px] text-muted">{on ? 'Подстраивается под каждый пропуск и ♥' : `${mode.title}: ${mode.hint.toLowerCase()}`}</p>
      </div>
    </div>
  );
}
