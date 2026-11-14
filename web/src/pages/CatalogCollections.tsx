import { api } from '../api/client';
import type { CatalogGenre, CatalogPlaylist } from '../api/types';
import { TrackRow, playAll } from '../components/catalog';
import { Button, Cover, Empty, ErrorState, Loading, PageHeader, SectionTitle } from '../components/ui';
import { useAsync } from '../lib/hooks';
import { Link, enc } from '../lib/router';

function PlaylistCard({ playlist }: { playlist: CatalogPlaylist }) {
  return (
    <Link to={`/catalog/playlist/${enc(playlist.ref)}`} className="flex min-w-0 items-center gap-3 rounded-xl bg-surface p-3 transition hover:bg-hover">
      <Cover src={playlist.picture_small_url || playlist.picture_url} size={64} alt="" icon="playlist" />
      <span className="min-w-0">
        <span className="block truncate font-medium">{playlist.title}</span>
        <span className="block truncate text-xs text-muted">{[playlist.nb_tracks ? `${playlist.nb_tracks} треков` : null, playlist.creator].filter(Boolean).join(' · ')}</span>
      </span>
    </Link>
  );
}

function GenreCard({ genre }: { genre: CatalogGenre }) {
  return (
    <Link to={`/catalog/genre/${enc(genre.id)}`} className="group relative flex aspect-square items-end overflow-hidden rounded-2xl bg-raised p-4">
      <Cover src={genre.picture_url || genre.picture_small_url} alt="" className="absolute inset-0 h-full w-full rounded-none opacity-55 transition group-hover:scale-105" />
      <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      <span className="relative text-lg font-bold text-white">{genre.name}</span>
    </Link>
  );
}

export function CatalogGenresPage() {
  const res = useAsync((s) => api.catalogGenres(s), []);
  return (
    <div className="pb-6">
      <PageHeader title="Подборки" sub="Жанры и плейлисты Deezer" />
      {res.loading ? <Loading /> : res.error || !res.data ? <ErrorState text={res.error ?? 'Подборки не найдены'} onRetry={() => res.reload()} /> : (
        <>
          {res.data.playlists.length > 0 && <section><SectionTitle>Популярные плейлисты</SectionTitle><div className="grid gap-2 px-4 sm:grid-cols-2">{res.data.playlists.map((p) => <PlaylistCard key={p.ref} playlist={p} />)}</div></section>}
          <section><SectionTitle>Жанры</SectionTitle><div className="grid grid-cols-2 gap-3 px-4 min-[520px]:grid-cols-3 md:grid-cols-4">{res.data.genres.map((g) => <GenreCard key={g.id} genre={g} />)}</div></section>
        </>
      )}
    </div>
  );
}

export function GenrePage({ id }: { id: string }) {
  const res = useAsync((s) => api.genrePlaylists(id, s), [id]);
  return (
    <div className="pb-6">
      <PageHeader title={res.data?.genre.name ?? 'Жанр'} back="/catalog/genres" />
      {res.loading ? <Loading /> : res.error || !res.data ? <ErrorState text={res.error ?? 'Подборки жанра не найдены'} onRetry={() => res.reload()} /> : res.data.playlists.length ? (
        <div className="grid gap-2 px-4 sm:grid-cols-2">{res.data.playlists.map((p) => <PlaylistCard key={p.ref} playlist={p} />)}</div>
      ) : <Empty icon="playlist" title="Плейлистов пока нет" text="Для этого жанра Deezer не вернул редакционные подборки." />}
    </div>
  );
}

export function CatalogPlaylistPage({ refId }: { refId: string }) {
  const res = useAsync((s) => api.catalogPlaylist(refId, s), [refId]);
  if (res.loading) return <><PageHeader title="Плейлист" back="/catalog/genres" /><Loading /></>;
  if (res.error || !res.data) return <><PageHeader title="Плейлист" back="/catalog/genres" /><ErrorState text={res.error ?? 'Плейлист не найден'} onRetry={() => res.reload()} /></>;
  const { playlist, tracks } = res.data;
  return (
    <div className="pb-6">
      <PageHeader title={playlist.title} back="/catalog/genres" sub={playlist.creator || undefined} />
      <div className="flex items-center gap-4 px-4 pb-4">
        <Cover src={playlist.picture_url || playlist.picture_small_url} size={112} alt={playlist.title} icon="playlist" />
        <div><div className="text-sm text-muted">{playlist.nb_tracks ?? tracks.length} треков</div><Button variant="primary" icon="play" className="mt-3" disabled={!tracks.length} onClick={() => playAll(tracks, { context: `catalog-playlist:${playlist.ref}` })}>Слушать</Button><Button small icon="shuffle" className="ml-2 mt-3" disabled={!tracks.length} onClick={() => playAll(tracks, { shuffle: true, context: `catalog-playlist:${playlist.ref}` })}>Перемешать</Button></div>
      </div>
      {tracks.length ? tracks.map((t, i) => <TrackRow key={`${t.ref}:${i}`} track={t} number={i + 1} showAlbum queue={tracks} />) : <Empty icon="playlist" title="Плейлист пуст" />}
    </div>
  );
}
