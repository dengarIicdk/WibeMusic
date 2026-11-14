import { EMBEDDED } from '../lib/embedded';
import { Link } from '../lib/router';
import { useActiveDownloads } from '../lib/notify';
import { Icon, type IconName } from './Icon';
import { cx } from './ui';

export type Tab = 'home' | 'search' | 'downloads' | 'library' | 'assistant' | 'more';

/** Only a plain browser draws it (inside the app the app's tabs open the routes): the whole service, «Главная»
 * first, the assistant under «Ещё». */
const TABS: Array<{ id: Tab; to: string; label: string; icon: IconName }> = [
  { id: 'home', to: '/home', label: 'Главная', icon: 'home' },
  { id: 'search', to: '/search', label: 'Поиск', icon: 'search' },
  { id: 'library', to: '/library', label: 'Библиотека', icon: 'library' },
  { id: 'downloads', to: '/downloads', label: 'Загрузки', icon: 'download' },
  { id: 'more', to: '/more', label: 'Ещё', icon: 'more' },
];

/** The tab a route's own tab shows under: the assistant lives in «Ещё» of a browser. */
const shownTab = (t: Tab | null): Tab | null => (t && !TABS.some((x) => x.id === t) ? 'more' : t);

/** Wide screens: a left column with the same sections (the tab bar is hidden there). */
export function Sidebar({ active: routeTab, last }: { active: Tab | null; last: Partial<Record<Tab, string>> }) {
  const activeDownloads = useActiveDownloads();
  if (EMBEDDED) return null;
  const active = shownTab(routeTab);

  return (
    <nav className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-line bg-[#0b0b0b] px-3 py-5 md:flex" aria-label="Разделы">
      <div className="mb-6 px-3 text-lg font-bold tracking-tight text-accent">WibeMusic</div>
      <ul className="flex flex-col gap-1">
        {TABS.map((t) => {
          const on = active === t.id;
          return (
            <li key={t.id}>
              <Link
                to={on ? t.to : (last[t.id] ?? t.to)}
                aria-current={on ? 'page' : undefined}
                className={cx('flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] transition-colors', on ? 'bg-raised text-fg font-semibold' : 'text-muted hover:bg-hover hover:text-fg')}
              >
                <span className="relative">
                  <Icon name={t.icon} size={22} stroke={on ? 2.4 : 2} />
                  {t.id === 'downloads' && activeDownloads > 0 && (
                    <span className="absolute -right-2.5 -top-1.5 min-w-4 rounded-full bg-accent px-1 text-center text-[10px] font-bold leading-4 text-on-accent">
                      {activeDownloads > 99 ? '99+' : activeDownloads}
                    </span>
                  )}
                </span>
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function TabBar({ active: routeTab, last }: { active: Tab | null; last: Partial<Record<Tab, string>> }) {
  const activeDownloads = useActiveDownloads();
  if (EMBEDDED) return null; // the Android app shows its own navigation
  const active = shownTab(routeTab);

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-[#0b0b0b]/95 backdrop-blur md:hidden" aria-label="Разделы">
      <ul className="mx-auto flex max-w-2xl">
        {TABS.map((t) => {
          const on = active === t.id;
          return (
            <li key={t.id} className="flex-1">
              <Link
                to={on ? t.to : (last[t.id] ?? t.to)}
                aria-current={on ? 'page' : undefined}
                className={cx('relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] transition-colors', on ? 'text-fg' : 'text-dim hover:text-muted')}
              >
                <span className="relative">
                  <Icon name={t.icon} size={24} stroke={on ? 2.4 : 2} />
                  {t.id === 'downloads' && activeDownloads > 0 && (
                    <span className="absolute -right-2.5 -top-1.5 min-w-4 rounded-full bg-accent px-1 text-center text-[10px] font-bold leading-4 text-on-accent">
                      {activeDownloads > 99 ? '99+' : activeDownloads}
                    </span>
                  )}
                </span>
                <span className={on ? 'font-semibold' : ''}>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
