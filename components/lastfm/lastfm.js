/**
 * lastfm.js
 * Centralized Last.fm API helpers that mirror the shape of data
 * previously returned by the Spotify API so the rest of the app
 * needs minimal changes.
 *
 * Last.fm docs: https://www.last.fm/api
 */

import { LASTFM_API_KEY, LASTFM_BASE_URL, buildLastFmUrl } from "../access_token/getaccesstoken";

// ─── Generic fetch wrapper ────────────────────────────────────────────────────
const lfmFetch = async (params) => {
    const url = buildLastFmUrl(params);
    const resp = await fetch(url);
    console.log(`Last.fm API call: ${params.method}`, params, "Response:", await resp.clone().json().results?.trackmatches?.track?.[0]);
    if (!resp.ok) throw new Error(`Last.fm fetch failed: ${resp.status}`);
    return resp.json();
};

// ─── Image helpers ────────────────────────────────────────────────────────────
/**
 * Pick the largest available image from a Last.fm image array.
 * Falls back to a placeholder if none found.
 */
export const pickImage = (images = [], fallback = "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png") => {
    //console.log("pickImage input", images);
    if (!images || images.length === 0) return fallback;
    // Last.fm image sizes: small, medium, large, extralarge, mega
    const preferred = ["mega", "extralarge", "large", "medium", "small"];
    for (const size of preferred) {
        const img = images.find(i => i.size === size);
        if (img && img["#text"]) return img["#text"];
    }
    // fallback: last non-empty
    const any = [...images].reverse().find(i => i["#text"]);
    return any ? any["#text"] : fallback;
};

// ─── Artist ───────────────────────────────────────────────────────────────────

/**
 * Get artist info (thumbnail, bio, etc.) by artist name.
 * Returns shape: { artist_id, artist_name, thumbnail, bio }
 */
export const getArtistInfo = async (artistName) => {
    const data = await lfmFetch({ method: "artist.getinfo", artist: artistName });
    const a = data.artist;
    return {
        artist_id: a.mbid || artistName,
        artist_name: a.name,
        thumbnail: pickImage(a.image),
        bio: a.bio?.summary || "",
    };
};

/**
 * Get artist info by MusicBrainz ID (mbid).
 */
export const getArtistInfoByMbid = async (mbid) => {
    const data = await lfmFetch({ method: "artist.getinfo", mbid });
    const a = data.artist;
    return {
        artist_id: a.mbid || mbid,
        artist_name: a.name,
        thumbnail: pickImage(a.image),
        bio: a.bio?.summary || "",
    };
};

/**
 * Get top albums for an artist.
 * Returns array of album objects shaped like Spotify album cards.
 */
export const getArtistTopAlbums = async (artistName, limit = 20) => {
    const data = await lfmFetch({ method: "artist.gettopalbums", artist: artistName, limit });
    const albums = data.topalbums?.album || [];
    return albums.map(normalizeAlbum);
};

/**
 * Get top tracks for an artist.
 * Returns array shaped like Spotify top tracks.
 */
export const getArtistTopTracks = async (artistName, limit = 20) => {
    const data = await lfmFetch({ method: "artist.gettoptracks", artist: artistName, limit });
    const tracks = data.toptracks?.track || [];
    return tracks.map((t, idx) => normalizeTrack(t, idx));
};

/**
 * Get similar artists.
 */
export const getSimilarArtists = async (artistName, limit = 10) => {
    const data = await lfmFetch({ method: "artist.getsimilar", artist: artistName, limit });
    const artists = data.similarartists?.artist || [];
    return artists.map(a => ({
        artist_id: a.mbid || a.name,
        artist_name: a.name,
        thumbnail: pickImage(a.image),
        images: [{ url: pickImage(a.image) }],
        name: a.name,
    }));
};

// ─── Album ────────────────────────────────────────────────────────────────────

/**
 * Get album info + track list.
 * Returns { album_info, tracks[] } where tracks match the shape
 * used throughout the app.
 */
export const getAlbumInfo = async (artistName, albumName) => {
    const data = await lfmFetch({ method: "album.getinfo", artist: artistName, album: albumName });
    const a = data.album;
    const thumbnail = pickImage(a.image);
    const rawTracks = a.tracks?.track || [];
    // Last.fm sometimes returns a single object instead of array
    const tracksArr = Array.isArray(rawTracks) ? rawTracks : [rawTracks];
    const tracks = tracksArr.map((t, idx) => ({
        id: t.mbid || `${a.mbid || albumName}_${idx}`,
        name: t.name,
        artist: a.artist,
        artist_id: a.mbid || a.artist,
        album_id: a.mbid || albumName,
        album_name: a.name,
        thumbnail,
        track_number: t["@attr"]?.rank || idx + 1,
        duration_ms: (parseInt(t.duration, 10) || 0) * 1000,
    }));
    return {
        album_info: normalizeAlbum({ name: a.name, artist: { name: a.artist }, image: a.image, mbid: a.mbid }),
        tracks,
    };
};

// ─── Search ───────────────────────────────────────────────────────────────────

/**
 * Search tracks.
 */
export const searchTracks = async (query, limit = 30) => {
    const data = await lfmFetch({ method: "track.search", track: query, limit });
    const matches = data.results?.trackmatches?.track || [];
    return matches.map((t, idx) => normalizeTrack(t, idx));
};

/**
 * Search albums.
 */
export const searchAlbums = async (query, limit = 20) => {
    const data = await lfmFetch({ method: "album.search", album: query, limit });
    const matches = data.results?.albummatches?.album || [];
    return matches.map(normalizeAlbum);
};

/**
 * Search artists.
 */
export const searchArtists = async (query, limit = 20) => {
    const data = await lfmFetch({ method: "artist.search", artist: query, limit });
    const matches = data.results?.artistmatches?.artist || [];
    return matches.map(a => ({
        artist_id: a.mbid || a.name,
        artist_name: a.name,
        name: a.name,
        thumbnail: pickImage(a.image),
        images: [{ url: pickImage(a.image) }],
    }));
};

/**
 * Combined search (tracks + albums + artists) matching the shape
 * previously returned by Spotify's /search endpoint.
 */
export const combinedSearch = async (query, limit = 20) => {
    const [tracks, albums, artists] = await Promise.all([
        searchTracks(query, limit),
        searchAlbums(query, limit),
        searchArtists(query, limit),
    ]);
    return { tracks, albums, artists, playlists: [] };
};

// ─── Charts / Discovery ───────────────────────────────────────────────────────

/**
 * Get top tracks globally (replaces Spotify new-releases for the home feed).
 * Returns array shaped like Spotify album cards (grouped by album).
 */
export const getTopTracks = async (limit = 50) => {
    const data = await lfmFetch({ method: "chart.gettoptracks", limit });
    const tracks = data.tracks?.track || [];
    return tracks.map((t, idx) => normalizeTrack(t, idx));
};

/**
 * Get top artists globally.
 */
export const getTopArtists = async (limit = 20) => {
    const data = await lfmFetch({ method: "chart.gettopartists", limit });
    const artists = data.artists?.artist || [];
    return artists.map(a => ({
        artist_id: a.mbid || a.name,
        artist_name: a.name,
        name: a.name,
        thumbnail: pickImage(a.image),
        images: [{ url: pickImage(a.image) }],
    }));
};

/**
 * Get tag/genre top tracks.
 * Replaces Spotify genre search.
 */
export const getTagTopTracks = async (tag, limit = 50) => {
    const data = await lfmFetch({ method: "tag.gettoptracks", tag, limit });
    const tracks = data.tracks?.track || [];
    return tracks.map((t, idx) => normalizeTrack(t, idx));
};

/**
 * Get tag/genre top albums.
 */
export const getTagTopAlbums = async (tag, limit = 20) => {
    const data = await lfmFetch({ method: "tag.gettopalbums", tag, limit });
    const albums = data.albums?.album || [];
    return albums.map(normalizeAlbum);
};

/**
 * Get tag/genre top artists.
 */
export const getTagTopArtists = async (tag, limit = 20) => {
    const data = await lfmFetch({ method: "tag.gettopartists", tag, limit });
    const artists = data.topartists?.artist || [];
    return artists.map(a => ({
        artist_id: a.mbid || a.name,
        artist_name: a.name,
        name: a.name,
        thumbnail: pickImage(a.image),
        images: [{ url: pickImage(a.image) }],
    }));
};

/**
 * Get similar tracks (for recommendations).
 */
export const getSimilarTracks = async (trackName, artistName, limit = 10) => {
    const data = await lfmFetch({ method: "track.getsimilar", track: trackName, artist: artistName, limit });
    const tracks = data.similartracks?.track || [];
    return tracks.map((t, idx) => normalizeTrack(t, idx));
};

// ─── Track info ───────────────────────────────────────────────────────────────

/**
 * Get full track info including album art.
 */
export const getTrackInfo = async (trackName, artistName) => {
    const data = await lfmFetch({ method: "track.getInfo", track: trackName, artist: artistName });
    const t = data.track;
    if (!t) return null;
    const thumbnail = pickImage(t.album?.image || t.image);
    return {
        id: t.mbid || `${artistName}_${trackName}`,
        name: t.name,
        artist: t.artist?.name || artistName,
        artist_id: t.artist?.mbid || artistName,
        album_id: t.album?.mbid || t.album?.title || "",
        album_name: t.album?.title || "",
        thumbnail,
        track_number: parseInt(t.album?.["@attr"]?.position, 10) || 1,
        duration_ms: (parseInt(t.duration, 10) || 0),
    };
};

// ─── Normalisers ─────────────────────────────────────────────────────────────

/**
 * Normalise a raw Last.fm album object into the shape the app expects.
 * Matches Spotify album card shape: { id, name, images, artists, total_tracks, release_date, album_type }
 */
export const normalizeAlbum = (a) => {
    const thumbnail = pickImage(a.image);
    const artistName = typeof a.artist === "string" ? a.artist : (a.artist?.name || "");
    return {
        id: a.mbid || `${artistName}_${a.name}`,
        name: a.name,
        images: [{ url: thumbnail }],
        artists: [{ name: artistName }],
        total_tracks: a.tracks?.["@attr"]?.total || 0,
        release_date: a.releasedate || "",
        album_type: "album",
        // extras
        artist_id: a.artist?.mbid || artistName,
        thumbnail,
    };
};

/**
 * Normalise a raw Last.fm track object.
 * Matches shape used throughout the app.
 */
export const normalizeTrack = (t, idx = 0) => {
    const artistName = typeof t.artist === "string" ? t.artist : (t.artist?.name || "");
    const thumbnail = pickImage(t.image || t.album?.image || []);
    return {
        id: t.mbid || `${artistName}_${t.name}_${idx}`,
        name: t.name,
        artist: artistName,
        artist_id: t.artist?.mbid || artistName,
        album_id: t.album?.mbid || t.album?.title || "",
        album_name: t.album?.title || "",
        thumbnail,
        track_number: idx + 1,
        duration_ms: (parseInt(t.duration, 10) || 0) * 1000,
        // For top-track display in CarouselItem / FavouriteTopTracksAlbums
        album: {
            id: t.album?.mbid || t.album?.title || `${artistName}_${t.name}`,
            name: t.album?.title || t.name,
            images: [{ url: thumbnail }],
            artists: [{ name: artistName }],
            total_tracks: 0,
            release_date: "",
            album_type: "single",
        },
    };
};
