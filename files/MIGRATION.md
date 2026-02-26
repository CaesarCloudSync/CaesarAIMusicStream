# Spotify → Last.fm Migration

## What was replaced

| File | Change |
|---|---|
| `components/access_token/getaccesstoken.js` | Removed OAuth client_credentials flow. Now exports `LASTFM_API_KEY` + `buildLastFmUrl` helper. |
| `components/lastfm/lastfm.js` | **NEW** — Central Last.fm API module. Mirrors all Spotify endpoints used in the app. |
| `components/HomeScreen/HomeScreen.js` | `browse/new-releases` → `chart.gettoptracks` |
| `components/HomeScreen/CarouselItem.js` | `albums/{id}` → `album.getinfo` |
| `components/HomeScreen/PlaylistCarouselItem.js` | `playlists/{id}` → `album.getinfo` |
| `components/HomeScreen/FavouriteRenders.js` | Null-safe, works with Last.fm data shapes |
| `components/ArtistProfile/ArtistProfile.js` | `artists/{id}`, `artists/{id}/albums`, `artists/{id}/top-tracks`, `artists/{id}/albums?include_groups=appears_on` → `artist.getinfo`, `artist.gettopalbums`, `artist.gettoptracks`, `artist.getsimilar` |
| `components/SearchScreen/SearchScreen.js` | `search?type=artist,album,track,playlist` → `track.search` + `album.search` + `artist.search` |
| `components/GenrePage/GenrePage.js` | `search?type=artist,playlist` → `tag.gettopalbums` + `tag.gettopartists` |
| `components/ShowCurrentTrack/ShowCurrentTrack.js` | `playlists/{id}` → `album.getinfo` |
| `components/PlaylistsScreen/AddSpotifyModal.js` | Spotify playlist URL import → Last.fm artist/tag import |
| `components/Tracks/Tracks.js` | `playlists/{id}` for storeonlineplaylist removed; uses local data |
| `components/Tracks/getrecommendations.js` | CaesarAI recommendation service + Spotify search → `track.getsimilar` + `track.getInfo` |
| `components/controls/controls.js` | `albums/{id}` for thumbnail → `artist.getinfo` from Last.fm |

## Setup

1. Get a free Last.fm API key at https://www.last.fm/api/account/create
2. Open `components/access_token/getaccesstoken.js`
3. Replace `"YOUR_LASTFM_API_KEY_HERE"` with your actual key

```js
export const LASTFM_API_KEY = "abc123yourkeyhere";
```

## Data shape mapping

Last.fm data is normalised into the same shapes the app already uses:

```
Spotify album  →  { id, name, images:[{url}], artists:[{name}], total_tracks, release_date, album_type }
Spotify track  →  { id, name, artist, artist_id, album_id, album_name, thumbnail, track_number, duration_ms }
Spotify artist →  { artist_id, artist_name, thumbnail, images:[{url}] }
```

All normalisation happens in `components/lastfm/lastfm.js` via `normalizeAlbum()`, `normalizeTrack()`, and `pickImage()`.

## Files NOT changed

These files had no Spotify API calls and are unchanged:
- `App.js`
- `trackPlayerServices.js`
- `components/Tracks/TrackItem.js`
- `components/Tracks/getstreamlinks.js` (still uses CaesarAI YouTube service)
- `components/Tracks/DownloadSong.js`
- `components/PlaylistsScreen/PlaylistTracks.js`
- `components/PlaylistsScreen/PlaylistScreen.js`
- `components/PlaylistsScreen/PlaylistCard.js`
- `components/Downloads/*.js`
- `components/LibraryScreen/*.js`
- `components/NavigationFooter/NavigationFooter.js`
- `components/Settings/Settings.js`
- `components/ShowQueue/QueueModal.js`
- `components/mqttclient/mqttclient.js`
- `components/musicconnectmqtt/MusicConnectMQTT.js`
- `components/CustomYTModal/customytmodal.js`

## Notes

- Last.fm has **no playlist concept** — the "Add Spotify Playlist" modal is replaced with an "Import by Artist" or "Import by Genre/Tag" flow
- Last.fm track `duration` is in **seconds** not milliseconds; `normalizeTrack()` multiplies by 1000
- Last.fm doesn't always return album tracks for every album (depends on data completeness)
- The `access_token` prop is still passed around for backward-compat but Last.fm needs no OAuth token
