import axios from "axios";
import { getSimilarTracks, getTrackInfo, normalizeTrack } from "../lastfm/lastfm";
import { remove_recommend_next_played } from "../../trackPlayerServices";
import { get_recommended_songs } from "../controls/controls";

/**
 * Get recommendations for the currently playing track using Last.fm similar tracks.
 * Returns an array of track objects in the shape used by QueueModal / controls.
 */
export async function getrecommendations(current_track, max_songs = 10) {
    if (!current_track) return null;

    try {
        const artist = current_track.artist;
        const track_name = current_track.title;

        const similar = await getSimilarTracks(track_name, artist, max_songs);
        // Shape each similar track to match the yt-recommendation format
        // that the rest of the app already handles:
        // { title, artists: [{name}], thumbnail: [{url}], ... }
        return similar.map(t => ({
            title: t.name,
            artists: [{ name: t.artist }],
            thumbnail: [{ url: t.thumbnail }],
            // Carry through Last.fm fields for downstream use
            id: t.id,
            artist: t.artist,
            artist_id: t.artist_id,
            album_id: t.album_id,
            album_name: t.album_name,
            duration_ms: t.duration_ms,
            track_number: t.track_number,
        }));
    } catch (err) {
        console.error("getrecommendations error", err);
        return null;
    }
}

export const getrecommendation = async (current_track) => {
    const results = await getrecommendations(current_track, 1);
    return results?.[0] || null;
};

/**
 * Search Last.fm for a specific track by name + artist and return:
 *   [result_track, all_album_tracks]
 * where result_track matches the internal track shape.
 */
export const searchsongsrecommend = async (song_name, artist_name) => {
    try {
        const trackInfo = await getTrackInfo(song_name, artist_name);
        if (!trackInfo) {
            console.warn("searchsongsrecommend: no track found for", song_name, artist_name);
            const recommend_songs = await get_recommended_songs();
            if (recommend_songs) await remove_recommend_next_played(recommend_songs);
            return null;
        }

        const result_track = {
            id: trackInfo.id,
            name: trackInfo.name,
            artist: trackInfo.artist,
            artist_id: trackInfo.artist_id,
            album_id: trackInfo.album_id,
            album_name: trackInfo.album_name,
            thumbnail: trackInfo.thumbnail,
            track_number: trackInfo.track_number,
            duration_ms: trackInfo.duration_ms,
        };

        // For the album_tracks list (used for navigation context),
        // return a single-element array since Last.fm track.getInfo
        // doesn't always return the full album tracklist.
        const album_tracks = [result_track];

        return [result_track, album_tracks];
    } catch (err) {
        console.warn("searchsongsrecommend error:", err.message);
        try {
            const recommend_songs = await get_recommended_songs();
            if (recommend_songs) await remove_recommend_next_played(recommend_songs);
        } catch (_) {}
        return null;
    }
};
