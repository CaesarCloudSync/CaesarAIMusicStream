/**
 * AddPlaylistModal (was AddSpotifyModal)
 *
 * Spotify playlist import is replaced with a Last.fm "tag/artist top albums"
 * import. The user can now:
 *  1. Enter a Last.fm artist name  → imports their top albums as a playlist.
 *  2. Enter a Last.fm tag/genre    → imports the tag's top tracks as a playlist.
 *
 * Storage format is unchanged so the rest of the app works without modification.
 */
import { useEffect, useState } from "react";
import { Modal } from "../PlaylistModal/modal";
import { TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Text, FlatList } from "react-native";
import { useNavigate } from "react-router-native";
import AntDesign from "react-native-vector-icons/AntDesign";
import { TextInput, View } from "react-native";
import Entypo from "react-native-vector-icons/Entypo";
import RNFS from "react-native-fs";
import { convertToValidFilename } from "../tool/tools";
import { getArtistTopAlbums, getTagTopTracks, getArtistInfo, normalizeTrack } from "../lastfm/lastfm";

export default function AddPlaylistModal({ isModalVisible, setIsModalVisible, playlistchanged, setPlaylistChanged }) {
    const [userInput, setUserInput] = useState("");
    const [importMode, setImportMode] = useState("artist"); // "artist" | "tag"
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const handleModal = () => setIsModalVisible(!isModalVisible);

    /**
     * Store a flat list of tracks as a local playlist.
     */
    const storeasplaylist = async (playlist_name, thumbnail_url, album_tracks) => {
        if (!album_tracks || album_tracks.length === 0) {
            Alert.alert("No tracks found for this search.");
            return;
        }
        // Download thumbnail
        const thumbnail_filePath = RNFS.DocumentDirectoryPath + `/${convertToValidFilename(playlist_name)}.jpg`;
        try {
            await RNFS.downloadFile({
                fromUrl: thumbnail_url,
                toFile: thumbnail_filePath,
                background: true,
                discretionary: true,
            }).promise;
        } catch (_) { /* thumbnail optional */ }

        const promisestore = album_tracks.map(async (track, ind) => {
            track["playlist_local"] = "true";
            track["playlist_name"] = playlist_name;
            await AsyncStorage.setItem(`playlist-track:${playlist_name}-${track.name}`, JSON.stringify(track));
            await AsyncStorage.setItem(
                `playlist-track-order:${playlist_name}-${track.name}`,
                JSON.stringify({ name: track.name, order: ind })
            );
        });
        await Promise.all(promisestore);

        await AsyncStorage.setItem(
            `playlist:${playlist_name}`,
            JSON.stringify({
                playlist_name,
                playlist_thumbnail: `file://${thumbnail_filePath}`,
                playlist_size: album_tracks.length,
            })
        );

        setIsModalVisible(false);
        setPlaylistChanged(!playlistchanged);
        navigate("/playlists");
    };

    const importArtistPlaylist = async () => {
        if (!userInput.trim()) return;
        setLoading(true);
        try {
            const info = await getArtistInfo(userInput.trim());
            const albums = await getArtistTopAlbums(info.artist_name, 20);
            // Flatten albums into a track list (one entry per album)
            const tracks = albums.map((a, idx) => ({
                id: a.id,
                name: a.name,
                artist: info.artist_name,
                artist_id: info.artist_id,
                album_id: a.id,
                album_name: a.name,
                thumbnail: a.images?.[0]?.url || info.thumbnail,
                track_number: idx + 1,
                duration_ms: 0,
            }));
            await storeasplaylist(`${info.artist_name} - Top Albums`, info.thumbnail, tracks);
        } catch (err) {
            Alert.alert("Error", `Could not import artist: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const importTagPlaylist = async () => {
        if (!userInput.trim()) return;
        setLoading(true);
        try {
            const rawTracks = await getTagTopTracks(userInput.trim(), 30);
            const tracks = rawTracks.map(t => ({
                id: t.id,
                name: t.name,
                artist: t.artist,
                artist_id: t.artist_id,
                album_id: t.album_id,
                album_name: t.album_name || t.name,
                thumbnail: t.thumbnail,
                track_number: t.track_number,
                duration_ms: t.duration_ms,
            }));
            const thumb = tracks[0]?.thumbnail || "";
            await storeasplaylist(`${userInput.trim()} Mix`, thumb, tracks);
        } catch (err) {
            Alert.alert("Error", `Could not import tag: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isVisible={isModalVisible}>
            <Modal.Container>
                <Modal.Body>
                    <View style={{ flexDirection: "row", margin: 10, height: 50, justifyContent: "flex-end" }}>
                        <TouchableOpacity onPress={handleModal} style={{ top: 10 }}>
                            <Entypo name="cross" size={20} />
                        </TouchableOpacity>
                    </View>

                    {/* Mode toggle */}
                    <View style={{ flexDirection: "row", gap: 10, marginBottom: 15, marginTop: 5 }}>
                        <TouchableOpacity
                            onPress={() => setImportMode("artist")}
                            style={{ flex: 1, borderWidth: 1, borderColor: importMode === "artist" ? "white" : "#555", borderRadius: 5, padding: 8, alignItems: "center" }}
                        >
                            <Text style={{ color: "white" }}>By Artist</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setImportMode("tag")}
                            style={{ flex: 1, borderWidth: 1, borderColor: importMode === "tag" ? "white" : "#555", borderRadius: 5, padding: 8, alignItems: "center" }}
                        >
                            <Text style={{ color: "white" }}>By Genre/Tag</Text>
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={{ height: 60, justifyContent: "center", borderWidth: 1, borderColor: "white", borderRadius: 5, padding: 10, color: "white" }}
                        placeholder={importMode === "artist" ? "Artist name (e.g. Frank Ocean)" : "Genre/tag (e.g. hip-hop)"}
                        placeholderTextColor="#888"
                        onChangeText={setUserInput}
                        onSubmitEditing={importMode === "artist" ? importArtistPlaylist : importTagPlaylist}
                    />
                    <Text style={{ color: "white", fontSize: 10, marginLeft: 10, marginTop: 5 }}>
                        {importMode === "artist"
                            ? "Import this artist's top albums as a playlist."
                            : "Import top tracks for this Last.fm tag/genre."}
                    </Text>

                    <TouchableOpacity
                        onPress={importMode === "artist" ? importArtistPlaylist : importTagPlaylist}
                        style={{ marginTop: 20, borderWidth: 1, borderColor: "white", borderRadius: 5, padding: 12, alignItems: "center" }}
                    >
                        <Text style={{ color: "white" }}>{loading ? "Importing…" : "Import Playlist"}</Text>
                    </TouchableOpacity>
                </Modal.Body>
            </Modal.Container>
        </Modal>
    );
}
