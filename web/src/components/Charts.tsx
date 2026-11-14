import { api } from '../api/client';
import type { CatalogArtist } from '../api/types';
import { useAsync } from '../lib/hooks';
import { ArtistBubble } from './catalog';
import { ErrorState, SectionTitle, Spinner } from './ui';

/** «Чарты»: the Deezer chart of artists (the taste onboarding's suggestions) as a row of bubbles. Shown on the home
 * screen and in an empty search, so a new account has something to press at once. */
export function ChartsRow() {
  const res = useAsync((s) => api.tasteOnboarding(undefined, s), []);
  if (res.loading) return <div className="flex justify-center py-6"><Spinner className="text-accent" /></div>;
  if (res.error) return <ErrorState text={res.error} onRetry={() => res.reload()} />;
  const artists: CatalogArtist[] = (res.data?.suggestions ?? []).slice(0, 20);
  if (!artists.length) return null;
  return (
    <section aria-label="Чарты">
      <SectionTitle>Чарты</SectionTitle>
      <div className="flex gap-4 overflow-x-auto px-4 pb-2 pt-1">
        {artists.map((a) => <ArtistBubble key={a.ref} artist={a} />)}
      </div>
    </section>
  );
}
