import { TouchableHighlight, Text, View, Image, TouchableOpacity, Alert } from "react-native"
import { useNavigate } from "react-router-native";
import Entypo from "react-native-vector-icons/Entypo"
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Gesture, GestureDetector, Swipeable } from "react-native-gesture-handler";
import { useState } from "react";
import TrackPlayer from "react-native-track-player";
import RNFS from "react-native-fs";
import { convertToValidFilename } from "../tool/tools";
import { triggerBackupSync, deleteSpotifyPlaylist } from "../access_token/spotifyBackupHelper";

export default function PlaylistCard({ playlist, index, setPlaylistChanged, playlistchanged, trackforplaylist, handleModal }) {
    const [playliststate, setPlaylistState] = useState(playlist)
    const navigate = useNavigate();
    const getalbumtracks = async (route) => {
        console.log("playlist_hey")
        let keys = await AsyncStorage.getAllKeys()
        const items = await AsyncStorage.multiGet(keys.filter((key) => { return key.includes(`playlist-track:${playliststate.playlist_name}`); }))
        const playlist_tracks = items.map((item) => { return JSON.parse(item[1]); })

        const items_order = await AsyncStorage.multiGet(keys.filter((key) => { return key.includes(`playlist-track-order:${playliststate.playlist_name}`); }))
        const playlist_tracks_order = items_order.map((item) => { return JSON.parse(item[1]); })

        function customSort(a, b) {
            const orderObjA = playlist_tracks_order.find(item => item.name === a.name);
            const orderObjB = playlist_tracks_order.find(item => item.name === b.name);
            const orderA = orderObjA ? orderObjA.order : 0;
            const orderB = orderObjB ? orderObjB.order : 0;
            return orderA - orderB;
        }

        playlist_tracks.sort(customSort);
        navigate(route, { state: { playlist_details: playliststate, playlist_tracks: playlist_tracks } });

    }
    const addtracktoplaylist = async () => {
        const promises = trackforplaylist.map(async (track, index) => {
            track["playlist_local"] = "true"
            track["playlist_name"] = playliststate.playlist_name
            await AsyncStorage.setItem(`playlist-track:${playliststate.playlist_name}-${track.name}`, JSON.stringify(track))
        })
        await Promise.all(promises)
        let keys = await AsyncStorage.getAllKeys()
        const items = await AsyncStorage.multiGet(keys.filter((key) => { return (key.includes(`playlist-track:${playliststate.playlist_name}`)) }))
        const playlist_tracks = items.map((item) => { return (JSON.parse(item[1])) })
        const num_of_tracks = playlist_tracks.length

        // Retain backup status when updating playlist size
        const stored = await AsyncStorage.getItem(`playlist:${playliststate.playlist_name}`);
        const existingDetails = stored ? JSON.parse(stored) : {};
        const newDetails = {
            ...existingDetails,
            "playlist_name": playliststate.playlist_name,
            "playlist_thumbnail": playliststate.playlist_thumbnail,
            "playlist_size": num_of_tracks
        };
        await AsyncStorage.setItem(`playlist:${playliststate.playlist_name}`, JSON.stringify(newDetails))

        const promises_order = trackforplaylist.map(async (track, index) => {
            await AsyncStorage.setItem(`playlist-track-order:${playliststate.playlist_name}-${track.name}`, JSON.stringify({ "name": track.name, "order": (num_of_tracks + index) - 1 }))
        })
        await Promise.all(promises_order)
        setPlaylistState(newDetails)
        const shuffled_tracks = await AsyncStorage.getItem(`shuffled-tracks:${playliststate.playlist_name}`)

        if (shuffled_tracks) {
            const shuffled_tracks_stored = JSON.parse(shuffled_tracks);
            trackforplaylist.map((track) => {
                shuffled_tracks_stored.push(track)

            })

            await AsyncStorage.setItem(`shuffled-tracks:${playliststate.playlist_name}`, JSON.stringify(shuffled_tracks_stored))
        }
        handleModal()
        if (playlistchanged === false) {
            setPlaylistChanged(true)
        }
        else {
            setPlaylistChanged(false)
        }

        // Sync new tracks to Spotify if backup is enabled
        await triggerBackupSync(playliststate.playlist_name);
    }
    const deleteLocalPlaylistOnly = async () => {
        try {
            await RNFS.unlink(`file://${RNFS.DocumentDirectoryPath}/${convertToValidFilename(playliststate.playlist_name)}.jpg`);
        } catch { }
        await AsyncStorage.removeItem(`playlist:${playliststate.playlist_name}`);
        let keys = await AsyncStorage.getAllKeys();
        await AsyncStorage.multiRemove(keys.filter((key) => { return key.includes(`playlist-track:${playliststate.playlist_name}`); }));
        await AsyncStorage.multiRemove(keys.filter((key) => { return key.includes(`playlist-track-order:${playliststate.playlist_name}`); }));
        if (playlistchanged === false) {
            setPlaylistChanged(true);
        } else {
            setPlaylistChanged(false);
        }
    };

    const removeplaylist = async () => {
        if (playliststate.spotify_playlist_id) {
            Alert.alert(
                "Delete Options",
                `Choose deletion type for "${playliststate.playlist_name}":`,
                [
                    {
                        text: "Spotify Backup Only",
                        onPress: async () => {
                            try {
                                await deleteSpotifyPlaylist(playliststate.spotify_playlist_id);
                                const stored = await AsyncStorage.getItem(`playlist:${playliststate.playlist_name}`);
                                const parsed = stored ? JSON.parse(stored) : {};
                                parsed.spotify_backup_enabled = false;
                                parsed.spotify_playlist_id = null;
                                await AsyncStorage.setItem(`playlist:${playliststate.playlist_name}`, JSON.stringify(parsed));
                                setPlaylistState(parsed);
                                Alert.alert("Success", "Spotify playlist backup deleted.");
                            } catch (err) {
                                Alert.alert("Error Deleting Backup", err.message);
                            }
                        }
                    },
                    {
                        text: "Delete Local Only",
                        onPress: async () => {
                            await deleteLocalPlaylistOnly();
                        }
                    },
                    {
                        text: "Delete Both",
                        onPress: async () => {
                            try {
                                await deleteSpotifyPlaylist(playliststate.spotify_playlist_id);
                            } catch (err) {
                                console.warn("Failed to delete Spotify backup:", err);
                            }
                            await deleteLocalPlaylistOnly();
                        },
                        style: "destructive"
                    }
                ],
                { cancelable: true }
            );
        } else {
            // No Spotify backup - delete local immediately without confirmation alert
            await deleteLocalPlaylistOnly();
        }
    };
    return (
        <View key={index} style={{ backgroundColor: "#141212", height: 50, borderRadius: 5, borderWidth: 3, flexBasis: "47%", margin: 5, borderColor: "#141212", flexDirection: "row", }}>

            <View style={{ backgroundColor: "#141212", flexDirection: "row", justifyContent: "center", alignItems: "center", flex: 1 }}>
                <TouchableOpacity onLongPress={() => { removeplaylist() }} style={{ flexDirection: "row", flex: 1 }} onPress={() => { if (!trackforplaylist) { getalbumtracks(`/playlist-tracks`) } else { addtracktoplaylist() } }}>
                    <View style={{ flexDirection: "row", flex: 1 }}>
                        <Image style={{ borderRadius: 5, width: 50, height: 50 }} source={{ uri: playliststate.playlist_thumbnail }}></Image>
                        <Text style={{ color: "white", width: 500, position: "relative", top: 15, left: 10 }}>
                            {playliststate.playlist_name} | {playliststate.playlist_size} Tracks
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    )
}