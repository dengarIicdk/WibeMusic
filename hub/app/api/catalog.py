"""Spotify-like artist and album pages with library ownership (FR-4)."""

from __future__ import annotations

import asyncio

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas import (
    AlbumOut,
    ArtistPageOut,
    CatalogGenresOut,
    CatalogPlaylistOut,
    GenrePlaylistsOut,
    TrackOut,
)
from app.auth import current_user
from app.catalog.models import (
    ArtistPage,
    CatalogAlbum,
    CatalogArtist,
    PlaylistPage,
    split_ref,
)
from app.db import get_session
from app.library.owned import annotate_albums, annotate_tracks
from app.models import User
from app.services import svc

router = APIRouter(prefix="/api/catalog", tags=["catalog"])


def _split(ref: str) -> tuple[str, str]:
    try:
        return split_ref(ref)
    except ValueError as e:
        raise HTTPException(400, "Неверная ссылка на каталог") from e


async def get_artist_page(ref: str) -> ArtistPage:
    src, id_ = _split(ref)
    try:
        if src == "dz" and svc.deezer:
            return await svc.deezer.get_artist_page(id_)
        if src == "hm" and svc.hitmoz_catalog:
            return await svc.hitmoz_catalog.get_artist(id_)
    except HTTPException:
        raise
    except Exception as e:
        if type(e).__name__ == "CatalogNotFound":
            raise HTTPException(404, "Исполнитель не найден") from e
        raise HTTPException(502, f"Каталог недоступен: {e}") from e
    raise HTTPException(404, "Исполнитель не найден")


async def get_album(ref: str) -> CatalogAlbum:
    src, id_ = _split(ref)
    try:
        if src == "dz" and svc.deezer:
            return await svc.deezer.get_album(id_)
        if src == "hm" and svc.hitmoz_catalog:
            return await svc.hitmoz_catalog.get_album(id_)
    except Exception as e:
        if type(e).__name__ == "CatalogNotFound":
            raise HTTPException(404, "Альбом не найден") from e
        raise HTTPException(502, f"Каталог недоступен: {e}") from e
    raise HTTPException(404, "Альбом не найден")


@router.get("/artist/{ref}", response_model=ArtistPageOut)
async def artist(ref: str, user: User = Depends(current_user), s: AsyncSession = Depends(get_session, scope="function")):
    page = await get_artist_page(ref)
    albums = await annotate_albums(s, page.albums, user.id)
    albums.sort(key=lambda a: (a.release_date is not None, a.release_date), reverse=True)
    return ArtistPageOut(
        artist=page.artist,
        top_tracks=await annotate_tracks(s, page.top_tracks, user.id),
        albums=[a for a in albums if a.record_type == "album"],
        singles=[a for a in albums if a.record_type in ("single", "ep")],
        compilations=[a for a in albums if a.record_type == "compile"],
    )


@router.get("/artist/{ref}/related", response_model=list[CatalogArtist])
async def artist_related(ref: str, user: User = Depends(current_user)):
    src, id_ = _split(ref)
    if src != "dz" or svc.deezer is None:
        raise HTTPException(404, "Похожие исполнители недоступны")
    try:
        return await svc.deezer.get_artist_related(id_)
    except Exception as e:
        if type(e).__name__ == "CatalogNotFound":
            raise HTTPException(404, "Исполнитель не найден") from e
        raise HTTPException(502, f"Каталог недоступен: {e}") from e


@router.get("/artist/{ref}/radio", response_model=list[TrackOut])
async def artist_radio(ref: str, user: User = Depends(current_user), s: AsyncSession = Depends(get_session, scope="function")):
    src, id_ = _split(ref)
    if src != "dz" or svc.deezer is None:
        raise HTTPException(404, "Радио исполнителя недоступно")
    try:
        tracks = await svc.deezer.get_artist_radio(id_)
    except Exception as e:
        if type(e).__name__ == "CatalogNotFound":
            raise HTTPException(404, "Исполнитель не найден") from e
        raise HTTPException(502, f"Каталог недоступен: {e}") from e
    return await annotate_tracks(s, tracks, user.id)


@router.get("/genres", response_model=CatalogGenresOut)
async def genres(user: User = Depends(current_user)):
    if svc.deezer is None:
        raise HTTPException(502, "Каталог Deezer недоступен")
    try:
        items, playlists = await asyncio.gather(
            svc.deezer.get_genres(), svc.deezer.get_chart_playlists(30)
        )
        return CatalogGenresOut(genres=items, playlists=playlists)
    except Exception as e:
        raise HTTPException(502, f"Каталог недоступен: {e}") from e


@router.get("/genres/{genre_id}/playlists", response_model=GenrePlaylistsOut)
async def genre_playlists(genre_id: str, user: User = Depends(current_user)):
    if not genre_id.isdigit() or svc.deezer is None:
        raise HTTPException(404, "Жанр не найден")
    try:
        all_genres = await svc.deezer.get_genres()
        genre = next((item for item in all_genres if item.id == genre_id), None)
        if genre is None:
            raise HTTPException(404, "Жанр не найден")
        playlists = await svc.deezer.get_editorial_playlists(genre_id, 30)
        return GenrePlaylistsOut(genre=genre, playlists=playlists)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(502, f"Каталог недоступен: {e}") from e


@router.get("/playlist/{ref}", response_model=CatalogPlaylistOut)
async def catalog_playlist(ref: str, user: User = Depends(current_user), s: AsyncSession = Depends(get_session, scope="function")):
    src, id_ = _split(ref)
    if src != "dz" or not id_.isdigit() or svc.deezer is None:
        raise HTTPException(404, "Плейлист не найден")
    try:
        page: PlaylistPage = await svc.deezer.get_playlist(id_)
    except Exception as e:
        if type(e).__name__ == "CatalogNotFound":
            raise HTTPException(404, "Плейлист не найден") from e
        raise HTTPException(502, f"Каталог недоступен: {e}") from e
    return CatalogPlaylistOut(playlist=page.playlist, tracks=await annotate_tracks(s, page.tracks, user.id))


@router.get("/album/{ref}", response_model=AlbumOut)
async def album(ref: str, user: User = Depends(current_user), s: AsyncSession = Depends(get_session, scope="function")):
    a = await get_album(ref)
    return (await annotate_albums(s, [a], user.id))[0]
