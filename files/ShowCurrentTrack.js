import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, Image, TouchableOpacity } from "react-native";
import { useProgress } from "react-native-track-player";
import TrackPlayer, { useTrackPlayerEvents, Event } from "react-native-track-player";
import { useNavigate } from "react-router-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { autoplaynextsong } from "../controls/controls";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MusicConnectMQTT from "../musicconnectmqtt/MusicConnectMQTT";
import { getAlbumInfo } from "../lastfm/lastfm";

export default function ShowCurrentTrack({ searchscreen, tracks, setAlbumTracks }) {
    const progress = useProgress();
    const navigate = useNavigate();
    const [currentTrack, setCurrentTrack] = useState(null);

    const getActiveTrackIndex = async () => {
        const currentTrackIndex = await TrackPlayer.getActiveTrackIndex();
        if (currentTrackIndex !== undefined) {
            const track = await TrackPlayer.getTrack(currentTrackIndex);
            setCurrentTrack(track);
        }
    };

    useTrackPlayerEvents([Event.PlaybackActiveTrackChanged], async () => {
        await getActiveTrackIndex();
    });

    useEffect(() => {
        getActiveTrackIndex();
    }, []);

    const getalbumtracks = async () => {
        if (!currentTrack) return;

        try {
            // Case 1: local playlist track
            if ("playlist_name" in currentTrack && "playlist_local" in currentTrack) {
                let keys = await AsyncStorage.getAllKeys();
                const playlist_details = JSON.parse(
                    await AsyncStorage.getItem(`playlist:${currentTrack.playlist_name}`)
                );
                const items = await AsyncStorage.multiGet(
                    keys.filter(key => key.includes(`playlist-track:${currentTrack.playlist_name}`))
                );
                const playlist_tracks = items.map(item => JSON.parse(item[1]));
                navigate("/playlist-tracks", { state: { playlist_details, playlist_tracks } });
                return;
            }

            // Case 2: album track (no playlist_name) — load from stored tracks
            if (!("playlist_name" in currentTrack)) {
                const stored_album_tracks = JSON.parse(await AsyncStorage.getItem("current-tracks"));
                if (stored_album_tracks) {
                    const album_tracks = stored_album_tracks.map(track => ({
                        album_id: stored_album_tracks[0].album_id,
                        album_name: currentTrack.album_name,
                        name: track.name,
                        id: track.id,
                        artist: track.artist,
                        artist_id: track.artist_id,
                        thumbnail: currentTrack.thumbnail,
                        track_number: track.track_number,
                        duration_ms: track.duration_ms,
                    }));
                    navigate("/tracks", { state: { album_tracks } });
                }
                return;
            }

            // Case 3: online playlist track — fetch album from Last.fm
            try {
                const { album_info, tracks: albumTracks } = await getAlbumInfo(
                    currentTrack.artist,
                    currentTrack.album_name || currentTrack.title
                );
                const thumbnail = currentTrack.thumbnail || album_info.images?.[0]?.url || "";
                const album_tracks = albumTracks.map(t => ({
                    playlist_thumbnail: currentTrack.playlist_thumbnail || thumbnail,
                    playlist_id: currentTrack.playlist_id || "",
                    playlist_name: currentTrack.playlist_name,
                    album_id: album_info.id,
                    album_name: album_info.name,
                    name: t.name,
                    id: t.id,
                    artist: currentTrack.artist,
                    artist_id: t.artist_id,
                    thumbnail: t.thumbnail || thumbnail,
                    track_number: t.track_number,
                    duration_ms: t.duration_ms,
                }));
                navigate("/tracks", { state: { album_tracks } });
            } catch (err) {
                console.error("ShowCurrentTrack getalbumtracks (Last.fm) error", err);
            }
        } catch (err) {
            console.error("ShowCurrentTrack getalbumtracks error", err);
        }
    };

    if (currentTrack !== null) {
        return (
            <TouchableOpacity
                onPress={getalbumtracks}
                style={{ flexDirection: "row", backgroundColor: "#141212", margin: !searchscreen ? 5 : 0, marginLeft: 30 }}
            >
                {currentTrack.artwork && (
                    <View style={{ flex: 0.15 }}>
                        <Image
                            style={{ borderRadius: 5, width: 40, height: 40 }}
                            source={{ uri: typeof currentTrack.artwork === "string" ? currentTrack.artwork : currentTrack.artwork.uri }}
                        />
                    </View>
                )}
                <View style={{ flex: 1 }}>
                    <Text>{currentTrack.title}</Text>
                    <Text>{currentTrack.artist}</Text>
                </View>
                <View style={{ justifyContent: "center", alignItems: "center", marginRight: 5 }}>
                    <MusicConnectMQTT />
                </View>
            </TouchableOpacity>
        );
    }

    return null;
}

const styles = StyleSheet.create({
    trackProgress: {
        marginTop: 0,
        textAlign: "center",
        fontSize: 10,
        color: "#eee",
    },
});
