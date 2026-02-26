import { getstreaminglink } from "../Tracks/getstreamlinks";
import TrackPlayer from "react-native-track-player";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RNFS from "react-native-fs";
import { convertToValidFilename } from "../tool/tools";
import { sendmusicconnect } from "../mqttclient/mqttclient";
import { VolumeManager } from "react-native-volume-manager";
import { MUSICSDCARDPATH } from "../constants/constants";
import { searchsongsrecommend } from "../Tracks/getrecommendations";
import { getsongrecommendation, remove_recommend_next_played } from "../../trackPlayerServices";
import { getArtistInfo, pickImage } from "../lastfm/lastfm";

/**
 * Fetch the best available thumbnail for a track using Last.fm.
 * Falls back to the track's stored thumbnail if Last.fm fails.
 */
const get_thumbnail = async (album_track) => {
    // If already a local file, return as-is
    if (album_track?.thumbnail?.startsWith("file://")) {
        return album_track.thumbnail;
    }
    // Try to get a better image from Last.fm artist info
    try {
        if (album_track?.artist) {
            const info = await getArtistInfo(album_track.artist);
            if (info.thumbnail) return info.thumbnail;
        }
    } catch (_) {}
    // Fallback: use whatever thumbnail is already on the track
    return album_track?.thumbnail || "";
};

const get_prefetched_song = async (nextsong) => {
    const current_prefetched = await AsyncStorage.getItem("current-prefetched-nextsong");
    if (current_prefetched) {
        const current_prefetched_nextsong = JSON.parse(current_prefetched);
        const nextsong_key = `${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`;
        const prefetched_key = `${current_prefetched_nextsong.artist}-${current_prefetched_nextsong.album_name}-${current_prefetched_nextsong.name}`;
        if (nextsong_key === prefetched_key) {
            await AsyncStorage.removeItem("current-prefetched-nextsong");
            return [current_prefetched_nextsong.streaming_link, current_prefetched_nextsong.name];
        } else {
            console.warn("Prefetch not cleaned correctly");
            return await getstreaminglink(nextsong);
        }
    }
    return await getstreaminglink(nextsong);
};

export const prefetchsong = async (nextsong) => {
    const [streaming_link] = await getstreaminglink(nextsong);
    nextsong["streaming_link"] = streaming_link;
    await AsyncStorage.setItem("current-prefetched-nextsong", JSON.stringify(nextsong));
};

export const skipToTrack = async (nextsong, player_ind) => {
    let queue = await TrackPlayer.getQueue();
    let next_exists_queue = queue.filter(track => track.id === nextsong.id);

    if (next_exists_queue.length === 0) {
        const track_downloaded = await AsyncStorage.getItem(
            `downloaded-track:${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`
        );
        let [streaming_link] = !track_downloaded
            ? await get_prefetched_song(nextsong)
            : [`file://${MUSICSDCARDPATH}/${convertToValidFilename(`${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`)}.mp3`, undefined];

        // Thumbnail: prefer local downloaded, then Last.fm
        let thumbnail = track_downloaded
            ? `file://${RNFS.DocumentDirectoryPath}/${convertToValidFilename(`${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`)}.jpg`
            : nextsong.ytcustom
                ? nextsong.thumbnail
                : await get_thumbnail(nextsong);

        const streaming_type = streaming_link?.includes(".m3u8") ? "hls" : "default";

        const baseTrackObj = {
            index: player_ind,
            album_id: nextsong.album_id,
            album: nextsong.album_name,
            album_name: nextsong.album_name,
            thumbnail,
            isActive: true,
            id: nextsong.id,
            url: streaming_link,
            title: nextsong.name,
            artist_id: nextsong.artist_id,
            artist: nextsong.artist,
            artwork: thumbnail,
            duration: nextsong.duration_ms / 1000,
            mediastatus: "online",
            type: streaming_type,
        };
        const dummyTrackObj = { ...baseTrackObj, id: nextsong.id + "dummy", url: "dummy" };

        if ("playlist_thumbnail" in nextsong && !("playlist_local" in nextsong)) {
            await TrackPlayer.add([{ ...baseTrackObj, playlist_thumbnail: nextsong.playlist_thumbnail, playlist_id: nextsong.playlist_id, playlist_name: nextsong.playlist_name }]);
            await TrackPlayer.add([{ ...dummyTrackObj, playlist_thumbnail: nextsong.playlist_thumbnail, playlist_id: nextsong.playlist_id, playlist_name: nextsong.playlist_name }]);
        } else if ("playlist_local" in nextsong) {
            await TrackPlayer.add([{ ...baseTrackObj, playlist_local: nextsong.playlist_local, playlist_name: nextsong.playlist_name }]);
            await TrackPlayer.add([{ ...dummyTrackObj, playlist_local: nextsong.playlist_local, playlist_name: nextsong.playlist_name }]);
        } else {
            await TrackPlayer.add([baseTrackObj]);
            await TrackPlayer.add([dummyTrackObj]);
        }

        await TrackPlayer.skip(queue.length);

        const music_connected = await AsyncStorage.getItem("music_connected");
        if (!music_connected) {
            await TrackPlayer.setVolume(1);
            await TrackPlayer.play();
        } else {
            // MusicConnect: resolve online URL if needed
            let connect_url = streaming_link;
            if (connect_url?.includes("file://")) {
                [connect_url] = await getstreaminglink(nextsong);
            }
            nextsong.url = connect_url;

            let connect_thumb = thumbnail;
            if (connect_thumb?.includes("file://")) {
                connect_thumb = nextsong.ytcustom ? "" : await get_thumbnail(nextsong);
            }
            nextsong.thumbnail = connect_thumb;
            nextsong.volume = (await VolumeManager.getVolume()).volume;
            await AsyncStorage.setItem("music_connect_next_track", JSON.stringify(nextsong));
            await sendmusicconnect();
        }

        // Handle queue / recommend context
        const queue_current_track = await AsyncStorage.getItem(
            `queue-current-track-${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`
        );
        if (queue_current_track) {
            await AsyncStorage.setItem("current-track", JSON.stringify(nextsong));
            await AsyncStorage.setItem("current-tracks", queue_current_track);
        }
        const recommend_current_track = await AsyncStorage.getItem("current-recommend-sp");
        if (recommend_current_track) {
            await AsyncStorage.setItem("current-track", JSON.stringify(nextsong));
            await AsyncStorage.setItem("current-tracks", recommend_current_track);
        }
    } else {
        // Track already in queue — skip to it
        const elementPos = queue.findIndex(track => track.id === nextsong.id && track.url !== "dummy");
        await TrackPlayer.skip(elementPos);

        const music_connected = await AsyncStorage.getItem("music_connected");
        if (music_connected) {
            let connect_url = queue[elementPos].url;
            if (connect_url?.includes("file://")) {
                [connect_url] = await getstreaminglink(nextsong);
            }
            nextsong.url = connect_url;

            let connect_thumb = queue[elementPos].thumbnail;
            if (connect_thumb?.includes("file://")) {
                connect_thumb = await get_thumbnail(nextsong);
            }
            nextsong.thumbnail = connect_thumb;
            nextsong.volume = (await VolumeManager.getVolume()).volume;
            await AsyncStorage.setItem("music_connect_next_track", JSON.stringify(nextsong));
            await sendmusicconnect();
        } else {
            await TrackPlayer.setVolume(1);
            await TrackPlayer.play();
        }

        const queue_current_track = await AsyncStorage.getItem(
            `queue-current-track-${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`
        );
        if (queue_current_track) {
            await AsyncStorage.setItem("current-track", JSON.stringify(nextsong));
            await AsyncStorage.setItem("current-tracks", queue_current_track);
        }
        const recommend_current_track = await AsyncStorage.getItem("current-recommend-sp");
        if (recommend_current_track) {
            await AsyncStorage.setItem("current-track", JSON.stringify(nextsong));
            await AsyncStorage.setItem("current-tracks", recommend_current_track);
        }
    }
};

// ─── All remaining helpers are unchanged from original ───────────────────────

export const get_next_ind_in_album = async () => {
    const stored_album_tracks = await AsyncStorage.getItem("current-tracks");
    const album_tracks = JSON.parse(stored_album_tracks);
    let num_of_tracks = album_tracks.length - 1;
    let currentTrackInd = await TrackPlayer.getActiveTrackIndex();
    let currentTrack = await TrackPlayer.getTrack(currentTrackInd);
    let player_ind = (currentTrack.index + 1) >= num_of_tracks ? 0 : currentTrack.index + 1;
    const currentTrackIndexInaAlbum = album_tracks.findIndex(track => track.id == currentTrack.id);
    let next_ind_in_album = (currentTrackIndexInaAlbum + 1) >= num_of_tracks ? 0 : currentTrackIndexInaAlbum + 1;
    return [next_ind_in_album, num_of_tracks, currentTrackIndexInaAlbum, player_ind, album_tracks];
};

export const get_next_song = async (track_after_queue, album_tracks, next_ind_in_album) => {
    return track_after_queue ? album_tracks[parseInt(track_after_queue)] : album_tracks[next_ind_in_album];
};

export const play_next_queued_song = async (newqueue, player_ind) => {
    let queue_json = JSON.parse(newqueue);
    let nextsongqueue = queue_json[0];
    await skipToTrack(nextsongqueue, player_ind);
    queue_json.shift();
    if (queue_json.length !== 0) {
        await AsyncStorage.setItem("queue", JSON.stringify(queue_json));
    } else {
        await AsyncStorage.removeItem("queue");
    }
};

export const play_next_song_after_queue = async (album_tracks, next_ind_in_album, player_ind) => {
    await AsyncStorage.removeItem("track_after_queue");
    await skipToTrack(album_tracks[next_ind_in_album], player_ind);
};

export const play_next_song = async (nextsong, player_ind, track_after_queue) => {
    await skipToTrack(nextsong, player_ind);
    if (track_after_queue) await AsyncStorage.removeItem("track_after_queue");
};

export const get_new_queue = async () => AsyncStorage.getItem("queue");
export const get_track_after_queue = async () => AsyncStorage.getItem("track_after_queue");
export const get_recommended_songs = async () => AsyncStorage.getItem("current-recommendations");

export const play_recommended_next_song = async (player_ind) => {
    let nextsongsrecommend;
    const current_prefetched = await AsyncStorage.getItem("current-prefetched-nextsong");
    if (current_prefetched) {
        nextsongsrecommend = JSON.parse(current_prefetched);
    } else {
        nextsongsrecommend = await getsongrecommendation();
    }
    await skipToTrack(nextsongsrecommend, player_ind);
    const recommended_songs = await get_recommended_songs();
    await remove_recommend_next_played(recommended_songs);
};

export const get_recommend_mode = async () => AsyncStorage.getItem("recommendation-mode");
export const get_next_song_in_recommend_queue = async (recommended_songs) => JSON.parse(recommended_songs)[0];
export const store_current_recommended_yt_to_spotify = async (album_tracks_recommend) => {
    await AsyncStorage.setItem("current-recommend-sp", JSON.stringify(album_tracks_recommend));
};
export const changerecommendyt = async () => {
    const current_recommendations = await AsyncStorage.getItem("current-recommendations");
    const recommend_json = JSON.parse(current_recommendations);
    recommend_json.shift();
    if (recommend_json.length !== 0) {
        await AsyncStorage.setItem("current-recommendations", JSON.stringify(recommend_json));
    } else {
        await AsyncStorage.removeItem("current-recommendations");
    }
};
export const find_recommended_song = async (title, artist, recommended_songs) => {
    const json = JSON.parse(recommended_songs);
    return json.find(song => song.title === title && song.artists[0].name === artist);
};

export const autoplaynextsong = async () => {
    const [next_ind_in_album, num_of_tracks, currentTrackIndexInaAlbum, player_ind, album_tracks] = await get_next_ind_in_album();
    const newqueue = await get_new_queue();
    const recommend_mode = await get_recommend_mode();

    if (newqueue) {
        await play_next_queued_song(newqueue, player_ind);
    } else if (recommend_mode && !newqueue) {
        await play_recommended_next_song(player_ind);
    } else {
        const track_after_queue = await get_track_after_queue();
        const nextsong = await get_next_song(track_after_queue, album_tracks, next_ind_in_album);
        if (nextsong === undefined) {
            await play_next_song_after_queue(album_tracks, next_ind_in_album, player_ind);
        } else {
            await play_next_song(nextsong, player_ind, track_after_queue);
        }
    }
};

export const autoplayprevioussong = async () => {
    const stored_album_tracks = await AsyncStorage.getItem("current-tracks");
    const album_tracks = JSON.parse(stored_album_tracks);
    let num_of_tracks = album_tracks.length;
    let currentTrackInd = await TrackPlayer.getActiveTrackIndex();
    let currentTrack = await TrackPlayer.getTrack(currentTrackInd);
    let player_ind = (currentTrack.index + 1) >= num_of_tracks ? 0 : currentTrack.index + 1;
    const currentTrackIndexInaAlbum = album_tracks.findIndex(track => track.id == currentTrack.id);
    let next_ind_in_album = (currentTrackIndexInaAlbum - 1) <= 0 ? 0 : currentTrackIndexInaAlbum - 1;
    await skipToTrack(album_tracks[next_ind_in_album], player_ind);
};
