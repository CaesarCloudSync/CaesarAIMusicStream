import { useEffect, useState } from "react";
import { Modal } from "../PlaylistModal/modal";
import { TouchableOpacity, ActivityIndicator, Alert, Linking } from "react-native";
import { Button } from "react-native-elements";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Text, FlatList } from "react-native";
import PlaylistCard from "../PlaylistsScreen/PlaylistCard";
import { useNavigate } from "react-router-native";
import AntDesign from "react-native-vector-icons/AntDesign"
import { TextInput, View } from "react-native";
import Entypo from "react-native-vector-icons/Entypo";
import RNFS from "react-native-fs";
import { Image } from "react-native";
import { convertToValidFilename } from "../tool/tools";
import { get_access_token } from "../access_token/getaccesstoken";
import { getUserAccessToken, getSpotifyBackupConfig } from "../access_token/spotifyBackupHelper";
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import InAppBrowser from 'react-native-inappbrowser-reborn';

export default function AddSpotifyPlaylistModal({isModalVisible, setIsModalVisible, playlistchanged, setPlaylistChanged}) {
    const [playlists, setPlaylists] = useState([]);
    const [userInput, setUserInput] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleModal = () => setIsModalVisible(() => !isModalVisible);

    useEffect(() => {
        if (isModalVisible) {
            checkConnectionAndLoadPlaylists();
        }
    }, [isModalVisible]);

    const checkConnectionAndLoadPlaylists = async () => {
        try {
            setLoading(true);
            const { refreshToken } = await getSpotifyBackupConfig();
            if (!refreshToken) {
                setIsConnected(false);
                setPlaylists([]);
                return;
            }
            setIsConnected(true);
            const token = await getUserAccessToken();
            const resp = await fetch("https://api.spotify.com/v1/me/playlists?limit=50", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (resp.ok) {
                const data = await resp.json();
                setPlaylists(data.items || []);
            } else {
                console.error("Failed to fetch user Spotify playlists:", resp.status);
                setPlaylists([]);
            }
        } catch (error) {
            console.error("Error loading user Spotify playlists:", error);
            setPlaylists([]);
        } finally {
            setLoading(false);
        }
    };

    const storeonlineplaylist = async (album_tracks) => {
        if ("playlist_thumbnail" in album_tracks[0]) {   
            console.log("playlistname");
            const promisestore = album_tracks.map(async (playlist_track) => {
                playlist_track["playlist_local"] = "true";
                await AsyncStorage.setItem(`playlist-track:${playlist_track.playlist_name}-${playlist_track.name}`, JSON.stringify(playlist_track));
            });
            await Promise.all(promisestore);
    
            let keys = await AsyncStorage.getAllKeys();
            const items = await AsyncStorage.multiGet(keys.filter((key) => { return(key.includes(`playlist-track:${album_tracks[0].playlist_name}`)) }));
            const playlist_tracks = items.map((item) => { return(JSON.parse(item[1])) });
            let num_of_tracks = playlist_tracks.length;
            const thumbnail_filePath = RNFS.DocumentDirectoryPath + `/${convertToValidFilename(album_tracks[0].playlist_name)}.jpg`;
            await RNFS.downloadFile({
                fromUrl: album_tracks[0].playlist_thumbnail,
                toFile: thumbnail_filePath,
                background: true,
                discretionary: true,
            });
            await AsyncStorage.setItem(`playlist:${album_tracks[0].playlist_name}`, JSON.stringify({
                "playlist_name": album_tracks[0].playlist_name,
                "playlist_thumbnail": `file://${thumbnail_filePath}`,
                "playlist_size": num_of_tracks,
                "spotify_backup_enabled": true,
                "spotify_playlist_id": album_tracks[0].playlist_id || null
            }));
            const promiseorder = album_tracks.map(async (playlist_track, ind) => {
                await AsyncStorage.setItem(`playlist-track-order:${playlist_track.playlist_name}-${playlist_track.name}`, JSON.stringify({ "name": playlist_track.name, "order": ind }));
            });
            await Promise.all(promiseorder);
            setIsModalVisible(false);
            console.log("playlist stored");
            if (playlistchanged === false) {
                setPlaylistChanged(true);
            } else {
                setPlaylistChanged(false);
            }
        }
    };

    async function openLink() {
        try {
            const isAvailable = await InAppBrowser.isAvailable();
            const url = 'https://open.spotify.com/';
            if (isAvailable) {
                InAppBrowser.open(url, {
                    dismissButtonStyle: 'cancel',
                    preferredBarTintColor: 'gray',
                    preferredControlTintColor: 'white',
                    showTitle: true,
                    toolbarColor: '#6200EE',
                    secondaryToolbarColor: 'black',
                    enableUrlBarHiding: true,
                    enableDefaultShare: true,
                    forceCloseOnRedirection: true,
                });
            } else {
                Linking.openURL(url);
            }
        } catch (error) {
            Alert.alert(error.message);
        }
    }
      
    const storespotifyplaylist = async () => {
        try {
            const match = userInput.match(/playlist\/([a-zA-Z0-9]+)/);
            if (match) {
                const playlist_id = match[1];
                setLoading(true);
                const access_token = await get_access_token();
                const headers = { Authorization: `Bearer ${access_token}` };
                const resp = await fetch(`https://api.spotify.com/v1/playlists/${playlist_id}`, { headers: headers });
                const feedresult = await resp.json();
                
                if (feedresult.error) {
                    throw new Error(feedresult.error.message || "Failed to fetch playlist details");
                }
                
                const playlist_thumbnail = feedresult.images.length > 0 ? feedresult.images[0].url : feedresult.tracks.items[0].track.album.images[0].url;
                const playlist_name = `${feedresult.name} - ${feedresult.owner.display_name}`;
                let album_tracks = feedresult.tracks.items
                    .filter(trackitem => trackitem.track)
                    .map((trackitem) => {
                        let track = trackitem.track;
                        return {
                            "playlist_thumbnail": playlist_thumbnail,
                            "playlist_id": feedresult.id,
                            "playlist_name": playlist_name,
                            "album_id": track.album.id,
                            "album_name": track.album.name,
                            "name": track.name,
                            "id": track.id,
                            "artist": track.artists[0] ? track.artists[0].name : "Unknown Artist",
                            "artist_id": track.artists[0] ? track.artists[0].id : "",
                            "thumbnail": track.album.images[0] ? track.album.images[0].url : "",
                            "track_number": track.track_number,
                            "duration_ms": track.duration_ms
                        };
                    });
                await storeonlineplaylist(album_tracks);
            } else {
                alert("Invalid Spotify Playlist URL: " + userInput);
            }
        } catch (error) {
            console.error("Error fetching Spotify playlist:", error);
            alert("Error fetching Spotify playlist. Please check the URL and try again.");
        } finally {
            setLoading(false);
        }
    };

    const importSpotifyPlaylistById = async (playlist_id) => {
        try {
            setLoading(true);
            const token = await getUserAccessToken();
            const headers = { Authorization: `Bearer ${token}` };
            const resp = await fetch(`https://api.spotify.com/v1/playlists/${playlist_id}`, { headers: headers });
            const feedresult = await resp.json();
            
            if (feedresult.error) {
                throw new Error(feedresult.error.message || "Failed to fetch playlist details");
            }
            
            const playlist_thumbnail = feedresult.images && feedresult.images.length > 0 
                ? feedresult.images[0].url 
                : (feedresult.tracks.items.length > 0 && feedresult.tracks.items[0].track && feedresult.tracks.items[0].track.album.images.length > 0
                    ? feedresult.tracks.items[0].track.album.images[0].url 
                    : "");
            
            const playlist_name = `${feedresult.name} - ${feedresult.owner.display_name}`;
            let album_tracks = feedresult.tracks.items
                .filter(trackitem => trackitem.track)
                .map((trackitem) => {
                    let track = trackitem.track;
                    return {
                        "playlist_thumbnail": playlist_thumbnail,
                        "playlist_id": feedresult.id,
                        "playlist_name": playlist_name,
                        "album_id": track.album.id,
                        "album_name": track.album.name,
                        "name": track.name,
                        "id": track.id,
                        "artist": track.artists[0] ? track.artists[0].name : "Unknown Artist",
                        "artist_id": track.artists[0] ? track.artists[0].id : "",
                        "thumbnail": track.album.images[0] ? track.album.images[0].url : "",
                        "track_number": track.track_number,
                        "duration_ms": track.duration_ms
                    };
                });

            if (album_tracks.length === 0) {
                alert("This playlist has no tracks or tracks could not be loaded.");
                return;
            }
            await storeonlineplaylist(album_tracks);
        } catch (error) {
            console.error("Error importing Spotify playlist by ID:", error);
            alert("Error importing Spotify playlist. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const renderPlaylistItem = ({ item }) => {
        const imageUrl = item.images && item.images.length > 0 ? item.images[0].url : null;
        return (
            <View style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#222",
                paddingHorizontal: 10
            }}>
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    {imageUrl ? (
                        <Image source={{ uri: imageUrl }} style={{ width: 45, height: 45, borderRadius: 5, marginRight: 12 }} />
                    ) : (
                        <View style={{ width: 45, height: 45, borderRadius: 5, marginRight: 12, backgroundColor: "#333", justifyContent: "center", alignItems: "center" }}>
                            <MaterialDesignIcons name="music" size={20} color="grey" />
                        </View>
                    )}
                    <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={{ color: "white", fontSize: 13, fontWeight: "bold" }} numberOfLines={1}>
                            {item.name}
                        </Text>
                        <Text style={{ color: "grey", fontSize: 11, marginTop: 3 }}>
                            {item.tracks ? `${item.tracks.total} tracks` : "0 tracks"}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity 
                    onPress={() => importSpotifyPlaylistById(item.id)}
                    style={{
                        backgroundColor: "#1db954",
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 15
                    }}
                >
                    <Text style={{ color: "white", fontSize: 11, fontWeight: "bold" }}>Import</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <Modal isVisible={isModalVisible}>
            <Modal.Container>
                <Modal.Body>
                    <View style={{ flexDirection: "row", margin: 10, height: 40, alignItems: "center" }}>
                        <Text style={{ color: "white", fontSize: 18, fontWeight: "bold", flex: 1 }}>Import Spotify Playlist</Text>
                        <TouchableOpacity onPress={handleModal}>
                            <Entypo name="cross" size={24} color="white"></Entypo>
                        </TouchableOpacity>
                    </View>
                   
                    <TextInput 
                        style={{
                            height: 50,
                            borderWidth: 1,
                            borderColor: "#333",
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            color: "white",
                            backgroundColor: "#1a1a1a",
                            marginBottom: 8
                        }} 
                        placeholder="Paste Spotify Playlist URL:" 
                        placeholderTextColor="grey"
                        onChangeText={(text) => setUserInput(text)} 
                        onSubmitEditing={storespotifyplaylist}
                    />
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <Text style={{ color: "grey", fontSize: 11 }}>Add public playlist by URL</Text>
                        <TouchableOpacity onPress={openLink}>
                            <MaterialDesignIcons name="web" size={20} color="#1db954" />
                        </TouchableOpacity>
                    </View>

                    <Text style={{ color: "white", fontSize: 15, fontWeight: "bold", marginBottom: 10, borderTopWidth: 1, borderTopColor: "#222", paddingTop: 15 }}>
                        Your Spotify Playlists
                    </Text>

                    {loading ? (
                        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", minHeight: 200 }}>
                            <ActivityIndicator size="large" color="#1db954" />
                        </View>
                    ) : !isConnected ? (
                        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", minHeight: 200, padding: 20 }}>
                            <MaterialDesignIcons name="spotify" size={48} color="grey" style={{ marginBottom: 10 }} />
                            <Text style={{ color: "grey", fontSize: 13, textAlign: "center", marginBottom: 15 }}>
                                Connect your Spotify account under Settings to browse and import your private/custom playlists directly.
                            </Text>
                            <TouchableOpacity 
                                onPress={() => {
                                    handleModal();
                                    navigate("/settings");
                                }}
                                style={{
                                    backgroundColor: "#1db954",
                                    paddingHorizontal: 20,
                                    paddingVertical: 10,
                                    borderRadius: 20
                                }}
                            >
                                <Text style={{ color: "white", fontSize: 13, fontWeight: "bold" }}>Go to Settings</Text>
                            </TouchableOpacity>
                        </View>
                    ) : playlists.length === 0 ? (
                        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", minHeight: 200 }}>
                            <Text style={{ color: "grey", fontSize: 13 }}>No playlists found on your account.</Text>
                        </View>
                    ) : (
                        <FlatList 
                            data={playlists}
                            keyExtractor={(item) => item.id}
                            style={{ flex: 1, maxHeight: 300 }}
                            renderItem={renderPlaylistItem}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        />
                    )}
                </Modal.Body>
            </Modal.Container>
        </Modal>
    );
}