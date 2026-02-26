import { View, Text, ScrollView, FlatList, Image, TextInput, Pressable } from "react-native";
import { useState, useEffect } from "react";
import TrackProgress from "../TrackProgress/TrackProgress";
import NavigationFooter from "../NavigationFooter/NavigationFooter";
import { FavouriteAlbums, FavouriteSearchAlbums } from "../HomeScreen/FavouriteRenders";
import AntDesign from "react-native-vector-icons/AntDesign";
import { useNetInfo } from "@react-native-community/netinfo";
import ShowCurrentTrack from "../ShowCurrentTrack/ShowCurrentTrack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GestureDetector, Gesture, Directions } from "react-native-gesture-handler";
import ArtistCarouselItem from "../HomeScreen/ArtistCarouselItem";
import ShowQueue from "../ShowQueue/showqueue";
import { FavouriteTopTracksAlbums } from "../HomeScreen/FavouriteRenders";
import {
    combinedSearch,
    getTopTracks,
    normalizeTrack,
    normalizeAlbum,
    getSimilarTracks,
} from "../lastfm/lastfm";

export default function Search({ seek, setSeek }) {
    const netInfo = useNetInfo();
    const [text, onChangeText] = useState("");
    const [access_token] = useState("lastfm");
    const [initialfeed, setInitialFeed] = useState([]);
    const [songs, setSongs] = useState([]);
    const [artists, setArtists] = useState([]);
    const [recent_artists, setRecentArtists] = useState([]);
    const [recent_removed, setRecentRemoved] = useState(false);
    const [recentalbums, setRecentAlbums] = useState([]);
    const [playlists, setPlaylists] = useState([]);
    const [tracks, setTracks] = useState([]);

    const fling = Gesture.Fling()
        .direction(Directions.DOWN)
        .onStart(() => { setSongs([]); });

    const createxpiration = async () => {
        const storageExpirationTimeInMinutes = 60;
        let dt = new Date();
        dt = new Date(dt.getTime() + storageExpirationTimeInMinutes * 60 * 1000);
        await AsyncStorage.setItem("storageWithExpiry", dt.toISOString());
    };

    const getinitialfeed = async () => {
        const topTracks = await getTopTracks(50);
        // Deduplicate into album-shaped cards
        const seen = new Set();
        const albumCards = [];
        for (const t of topTracks) {
            const key = `${t.artist}_${t.album_name || t.name}`;
            if (!seen.has(key)) {
                seen.add(key);
                albumCards.push({
                    id: t.album_id || t.id,
                    name: t.album_name || t.name,
                    images: [{ url: t.thumbnail }],
                    artists: [{ name: t.artist }],
                    total_tracks: 0,
                    release_date: "",
                    album_type: "album",
                });
            }
        }
        setInitialFeed(albumCards);
        await AsyncStorage.setItem("initial_search_rnb", JSON.stringify(albumCards));
    };

    const searchsongs = async () => {
        if (!text.trim()) return;
        try {
            const { tracks: foundTracks, albums, artists: foundArtists } = await combinedSearch(text, 20);

            // Shape tracks for FavouriteSearchAlbums
            const shapedTracks = foundTracks.map(t => normalizeTrack(t));
            const shapedAlbums = albums.map(a => normalizeAlbum(a));
            const shapedArtists = foundArtists.map(a => ({
                artist_id: a.artist_id,
                name: a.name || a.artist_name,
                images: a.images?.length ? a.images : [{ url: a.thumbnail }],
            }));

            setTracks(shapedTracks);
            setSongs(shapedAlbums);
            setArtists(shapedArtists);
            setPlaylists([]); // Last.fm has no playlist concept
        } catch (err) {
            console.error("searchsongs error", err);
        }
    };

    function parseISOString(s) {
        var b = s.split(/\D+/);
        return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
    }

    const getinitialrnbfeed = async () => {
        let savedData = await AsyncStorage.getItem("storageWithExpiry");
        const currentTimestamp = new Date().toISOString();

        if (savedData != null) {
            if (parseISOString(currentTimestamp) >= parseISOString(savedData)) {
                await AsyncStorage.removeItem("storageWithExpiry");
                await AsyncStorage.removeItem("initial_search_rnb");
            }
        } else {
            await AsyncStorage.removeItem("storageWithExpiry");
            await AsyncStorage.removeItem("initial_search_rnb");
        }

        let cache_initial = await AsyncStorage.getItem("initial_search_rnb");
        if (!cache_initial) {
            await getinitialfeed();
            await createxpiration();
        } else {
            setInitialFeed(JSON.parse(cache_initial));
        }
    };

    const get_recent_artists = async () => {
        let keys = await AsyncStorage.getAllKeys();
        const items = await AsyncStorage.multiGet(keys.filter(key => key.includes("artist:")));
        setRecentArtists(items);
    };

    const get_recent_albums = async () => {
        let keys = await AsyncStorage.getAllKeys();
        const items = await AsyncStorage.multiGet(keys.filter(key => key.includes("album-recent-load:")));
        const albumsitems = items.map(item => JSON.parse(item[1])).filter(item => item !== null);
        setRecentAlbums(albumsitems);
    };

    useEffect(() => {
        if (netInfo.isInternetReachable === true) {
            getinitialrnbfeed();
            get_recent_albums();
            get_recent_artists();
        }
    }, [netInfo]);

    useEffect(() => { get_recent_artists(); }, [recent_removed]);
    useEffect(() => { get_recent_albums(); }, [recentalbums.length]);

    if (netInfo.isInternetReachable) {
        return (
            <View style={{ flex: 1, backgroundColor: "#141212" }}>
                {/* Header */}
                <View style={{ flex: 0.18, flexDirection: "row", backgroundColor: "#141212" }}>
                    <View style={{ flex: 1, margin: 12, padding: 10, flexDirection: "row" }}>
                        <View style={{ backgroundColor: "white", justifyContent: "center", alignItems: "center", height: 40, borderBottomLeftRadius: 10, borderTopLeftRadius: 10 }}>
                            <AntDesign name="search1" style={{ color: "black", padding: 10 }} />
                        </View>
                        <TextInput
                            onSubmitEditing={searchsongs}
                            placeholder="Search songs, albums, artists…"
                            placeholderTextColor={"black"}
                            style={{ height: 40, flex: 1, borderBottomRightRadius: 10, borderTopRightRadius: 10, backgroundColor: "white", color: "black" }}
                            onChangeText={onChangeText}
                            value={text}
                        />
                    </View>
                    <View style={{ flex: 0.13, margin: 1, marginTop: 22, marginRight: 10 }}>
                        <Image style={{ borderRadius: 5, width: 44, height: 39 }} source={require("../../assets/CaesarAILogo.png")} />
                    </View>
                </View>

                <ScrollView removeClippedSubviews={true} style={{ flex: 1, backgroundColor: "#141212" }}>
                    {recentalbums.length > 0 && (
                        <View>
                            <Text style={{ marginLeft: 10 }}>Recent Albums</Text>
                            <FavouriteAlbums
                                access_token={access_token}
                                favouritecards={true}
                                playlists={recentalbums}
                                recentalbums={recentalbums}
                                setRecentAlbums={setRecentAlbums}
                            />
                        </View>
                    )}

                    {recent_artists.length > 0 && (
                        <View style={{ width: "100%" }}>
                            <Text style={{ marginLeft: 10 }}>Recent Artists</Text>
                            <View style={{ alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 20 }}>
                                {recent_artists.map((artisttuple, index) => {
                                    const artistitems = JSON.parse(artisttuple[1]);
                                    return (
                                        <ArtistCarouselItem
                                            key={index}
                                            favouritecards={true}
                                            artist_id={artistitems.artist_id}
                                            thumbnail={artistitems.thumbnail}
                                            artist_name={artistitems.artist_name}
                                            recent_removed={recent_removed}
                                            setRecentRemoved={setRecentRemoved}
                                        />
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {initialfeed.length > 0 && (
                        <View>
                            <Text style={{ marginLeft: 10 }}>Trending Albums</Text>
                            <FavouriteAlbums access_token={access_token} favouritecards={true} playlists={initialfeed} />
                        </View>
                    )}
                </ScrollView>

                <ShowCurrentTrack searchscreen={true} />
                <ShowQueue />
                <TrackProgress seek={seek} setSeek={setSeek} />
                <NavigationFooter currentpage={"search"} />

                {songs.length !== 0 && artists.length !== 0 && (
                    <View style={{ position: "absolute", height: 550, width: "100%", backgroundColor: "#161616", bottom: 0, borderTopLeftRadius: 10, borderTopRightRadius: 10 }}>
                        <GestureDetector gesture={fling}>
                            <View style={{ width: "100%", justifyContent: "center", alignItems: "center" }}>
                                <View style={{ height: 10, width: 75, backgroundColor: "#d3d3d3", marginTop: 20, borderRadius: 10 }} />
                                <Text style={{ fontSize: 25 }}>Search Results</Text>
                            </View>
                        </GestureDetector>
                        <FavouriteSearchAlbums
                            artists={artists}
                            access_token={access_token}
                            favouritecards={true}
                            albums={songs}
                            playlists={playlists}
                            tracks={tracks}
                        />
                    </View>
                )}
            </View>
        );
    } else {
        return (
            <View style={{ flex: 1, backgroundColor: "#141212" }}>
                <View style={{ flex: 0.08, flexDirection: "row", backgroundColor: "#141212" }}>
                    <View style={{ flex: 1, margin: 10 }}>
                        <Text style={{ fontSize: 20 }}>CaesarAIMusicStream</Text>
                    </View>
                    <View style={{ flex: 0.13, margin: 10 }}>
                        <Image style={{ borderRadius: 5, width: 44, height: 39 }} source={require("../../assets/CaesarAILogo.png")} />
                    </View>
                </View>
                <View style={{ flex: 1, backgroundColor: "#141212", justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ fontSize: 30 }}>No Internet Connection</Text>
                    <Text>Play your Downloads</Text>
                </View>
                <ShowCurrentTrack searchscreen={true} />
                <ShowQueue />
                <TrackProgress seek={seek} setSeek={setSeek} />
                <NavigationFooter currentpage={"search"} />
            </View>
        );
    }
}
