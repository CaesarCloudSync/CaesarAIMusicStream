import { View, Text, ScrollView, FlatList, Image, SafeAreaView } from "react-native";
import NavigationFooter from "../NavigationFooter/NavigationFooter";
import { useEffect, useState } from "react";
import GenreItem from "./GenreItem";
import TrackProgress from "../TrackProgress/TrackProgress";
import { FavouriteAlbums, FavouriteRecommendations, FavouriteRecommendationsHomeScreen } from "./FavouriteRenders";
import { useNetInfo } from "@react-native-community/netinfo";
import ShowCurrentTrack from "../ShowCurrentTrack/ShowCurrentTrack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { genreslist } from "./genres";
import ShowQueue from "../ShowQueue/showqueue";
import { getTopTracks, getTopArtists, normalizeTrack } from "../lastfm/lastfm";

export default function Home({ seek, setSeek }) {
    const netInfo = useNetInfo();
    const [initialfeed, setInitialFeed] = useState([]);
    const [initialrnb, setInitialRNB] = useState([]);
    const [initialhiphop, setInitialHipHop] = useState([]);
    // Last.fm doesn't need an access_token but we keep the state for
    // conditional rendering guards that already exist in JSX.
    const [access_token, setAccessToken] = useState("lastfm");
    const [genres, setGenres] = useState([]);
    const [randomcolors, setRandomColors] = useState([]);

    const chunkcards = (arr, chunksizeval = 6) => {
        const chunkSize = chunksizeval;
        const chunks = [];
        for (let i = 0; i < arr.length; i += chunkSize) {
            chunks.push(arr.slice(i, i + chunkSize));
        }
        return chunks;
    };

    const getintialfeed = async () => {
        // Use Last.fm chart top tracks (first 14) as the "new releases" feed
        const tracks = await getTopTracks(14);
        // Convert tracks to album-card shape (deduplicate by album)
        const seen = new Set();
        const albumCards = [];
        for (const t of tracks) {
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
                    // Store original track id for playback
                    _track_id: t.id,
                    _artist: t.artist,
                });
            }
        }
        await AsyncStorage.setItem("initial_feed", JSON.stringify(albumCards));
        setInitialFeed(albumCards);
    };

    const getinitialrnb = async () => {
        const tracks = await getTopTracks(110);
        // offset 15-62 → chunk into groups of 6
        const slice = tracks.slice(15, 63);
        const chunks = chunkcards(slice);
        await AsyncStorage.setItem("initial_rnb", JSON.stringify(chunks));
        setInitialRNB(chunks);
    };

    const getinitialhiphop = async () => {
        const tracks = await getTopTracks(110);
        const slice = tracks.slice(63, 111);
        const chunks = chunkcards(slice);
        await AsyncStorage.setItem("initial_hiphop", JSON.stringify(chunks));
        setInitialHipHop(chunks);
    };

    const createxpiration = async () => {
        const storageExpirationTimeInMinutes = 120;
        let dt = new Date();
        dt = new Date(dt.getTime() + storageExpirationTimeInMinutes * 60 * 1000);
        await AsyncStorage.setItem("storageWithExpiry", dt.toISOString());
    };

    function parseISOString(s) {
        var b = s.split(/\D+/);
        return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
    }

    const getall = async () => {
        let savedData = await AsyncStorage.getItem("storageWithExpiry");
        const currentTimestamp = new Date().toISOString();

        if (savedData !== null) {
            if (parseISOString(currentTimestamp) >= parseISOString(savedData)) {
                await AsyncStorage.removeItem("storageWithExpiry");
                await AsyncStorage.removeItem("initial_feed");
                await AsyncStorage.removeItem("initial_rnb");
                await AsyncStorage.removeItem("initial_hiphop");
                let keys = await AsyncStorage.getAllKeys();
                await AsyncStorage.multiRemove(keys.filter((key) => key.includes("album:")));
            }
        } else {
            await AsyncStorage.removeItem("storageWithExpiry");
            await AsyncStorage.removeItem("initial_feed");
            await AsyncStorage.removeItem("initial_rnb");
            await AsyncStorage.removeItem("initial_hiphop");
            let keys = await AsyncStorage.getAllKeys();
            await AsyncStorage.multiRemove(keys.filter((key) => key.includes("album:")));
        }

        // Last.fm: no OAuth needed
        setAccessToken("lastfm");

        let cache_initial = await AsyncStorage.getItem("initial_feed");
        if (!cache_initial) {
            await getintialfeed();
            await createxpiration();
        } else {
            setInitialFeed(JSON.parse(cache_initial));
        }

        let cache_rnb = await AsyncStorage.getItem("initial_rnb");
        if (!cache_rnb) {
            await getinitialrnb();
        } else {
            setInitialRNB(JSON.parse(cache_rnb));
        }

        let cache_hiphop = await AsyncStorage.getItem("initial_hiphop");
        if (!cache_hiphop) {
            await getinitialhiphop();
        } else {
            setInitialHipHop(JSON.parse(cache_hiphop));
        }

        const randomcolors = [
            "#3F00BA", "#3200C6", "#2500D2", "#D90025", "#CC0031",
            "#7F007C", "#720088", "#A50056", "#990063", "#8C006F",
            "#3F00BA", "#3200C6", "#650094", "#5900A1", "#4C00AD",
            "#008000", "#006600", "#004C00", "#003300", "#001900",
        ];
        setRandomColors(randomcolors);
        const chunks = chunkcards(genreslist, 20);
        setGenres(chunks);
    };

    useEffect(() => {
        if (netInfo.isInternetReachable === true) {
            getall();
        }
    }, [netInfo]);

    if (netInfo.isInternetReachable === true) {
        return (
            <View style={{ flex: 1, backgroundColor: "#141212" }}>
                {/* Header */}
                <View style={{ flex: 0.08, flexDirection: "row", backgroundColor: "#141212" }}>
                    <View style={{ flex: 1, margin: 10 }}>
                        <Text style={{ fontSize: 20 }}>CaesarAIMusicStream</Text>
                    </View>
                    <View style={{ flex: 0.13, margin: 10 }}>
                        <Image style={{ borderRadius: 5, width: 44, height: 39 }} source={require("../../assets/CaesarAILogo.png")} />
                    </View>
                </View>

                <ScrollView removeClippedSubviews={true} style={{ flex: 1, backgroundColor: "#141212" }}>
                    {initialfeed.length > 0 && access_token !== "" && (
                        <FavouriteAlbums access_token={access_token} favouritecards={true} playlists={initialfeed.slice(0, 8)} />
                    )}
                    {initialfeed.length > 0 && access_token !== "" && (
                        <View style={{ flex: 1 }}>
                            <Text style={{ margin: 15, fontSize: 23, color: "white", fontWeight: "bold" }}>Trending Now</Text>
                        </View>
                    )}
                    {initialfeed.length > 0 && access_token !== "" && (
                        <FavouriteAlbums access_token={access_token} favouritecards={false} playlists={initialfeed.slice(8)} />
                    )}

                    {initialfeed.length > 0 && access_token !== "" && (
                        <View style={{ flex: 1 }}>
                            <Text style={{ margin: 15, fontSize: 23, color: "white", fontWeight: "bold" }}>More Top Tracks</Text>
                        </View>
                    )}
                    {initialrnb.length > 0 &&
                        access_token !== "" &&
                        initialrnb.map((chunk, idx) => (
                            <FavouriteRecommendationsHomeScreen key={idx} access_token={access_token} playlists={chunk} />
                        ))}

                    {initialhiphop.length > 0 && access_token !== "" && (
                        <View style={{ flex: 1 }}>
                            <Text style={{ margin: 15, fontSize: 23, color: "white", fontWeight: "bold" }}>Discover More</Text>
                        </View>
                    )}
                    {initialhiphop.length > 0 &&
                        access_token !== "" &&
                        initialhiphop.map((chunk, idx) => (
                            <FavouriteRecommendationsHomeScreen key={idx} access_token={access_token} playlists={chunk} />
                        ))}

                    {genres.length > 0 &&
                        access_token !== "" &&
                        genres.map((genrelist, indexlist) => (
                            <SafeAreaView key={indexlist} style={{ flex: 1, marginTop: 10 }}>
                                <View style={{ alignItems: "center", justifyContent: "center", flexDirection: "row", flexWrap: "wrap", gap: 20 }}>
                                    <FlatList
                                        data={genrelist}
                                        horizontal={true}
                                        renderItem={({ item, index }) => (
                                            <GenreItem genre={item} randomcolor={randomcolors[index]} />
                                        )}
                                    />
                                </View>
                            </SafeAreaView>
                        ))}
                </ScrollView>

                <ShowCurrentTrack />
                <ShowQueue />

                <View style={{ flex: 0.018, backgroundColor: "#141212", justifyContent: "center", alignItems: "center" }}>
                    <TrackProgress seek={seek} setSeek={setSeek} />
                </View>

                <NavigationFooter currentpage={"home"} />
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
                <ShowCurrentTrack />
                <ShowQueue />
                <TrackProgress seek={seek} setSeek={setSeek} />
                <NavigationFooter currentpage={"home"} />
            </View>
        );
    }
}
