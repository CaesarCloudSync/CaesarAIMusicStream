import { View, Text, ScrollView, FlatList, Image, SafeAreaView, RefreshControl, ActivityIndicator } from "react-native";

import NavigationFooter from "../NavigationFooter/NavigationFooter";
import { useEffect, useState } from "react";
import GenreItem from "./GenreItem";
import TrackProgress from "../TrackProgress/TrackProgress";
import FavouriteItem from "./FavouriteItem";
import { get_access_token } from "../access_token/getaccesstoken";
import { FavouriteAlbums, FavouriteRecommendations, FavouriteRecommendationsHomeScreen, FavouritePlaylistsHomeScreen } from "./FavouriteRenders";
import { useNetInfo } from "@react-native-community/netinfo";
import ShowCurrentTrack from "../ShowCurrentTrack/ShowCurrentTrack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Await, json } from "react-router-native";
import { genreslist } from "./genres";
import ShowQueue from "../ShowQueue/showqueue";
import { Button } from "react-native-elements";
import { getdownloadedmetadata } from "../scripts/MusicInternalToSDCard";
import { requestStoragePermission } from "../Tracks/askpermission";

const GENRES = [
    {
        id: "rnb",
        defaultTitle: "Contemporary R&B",
        pool: ["Frank Ocean", "SZA", "Brent Faiyaz", "The Weeknd", "Bryson Tiller", "Summer Walker", "Daniel Caesar", "Giveon", "Kehlani", "Steve Lacy", "Drake"]
    },
    {
        id: "hiphop",
        defaultTitle: "Contemporary Hip-Hop",
        pool: ["Drake", "Travis Scott", "Kendrick Lamar", "J. Cole", "Future", "21 Savage", "Playboi Carti", "Lil Uzi Vert", "Metro Boomin", "Kanye West", "Tyler, the Creator", "Lil Baby", "Waka Flocka Flame"]
    },
    {
        id: "dancehall",
        defaultTitle: "Vibrant Dancehall",
        pool: ["Vybz Kartel", "Popcaan", "Spice", "Shenseea", "Skillibeng", "Masicka", "Alkaline", "Sean Paul", "Shaggy", "Koffee", "Dexta Daps", "Teejay"]
    },
    {
        id: "afrobeats",
        defaultTitle: "Global Afrobeats",
        pool: ["Burna Boy", "Wizkid", "Davido", "Rema", "Asake", "Tems", "Ayra Starr", "Fireboy DML", "Omah Lay", "Tiwa Savage", "CKay"]
    },
    {
        id: "soca",
        defaultTitle: "Soca Carnival",
        pool: ["Machel Montano", "Kes the Band", "Bunji Garlin", "Fay-Ann Lyons", "Patrice Roberts", "Skinny Fabulous", "Destra Garcia", "Lyrikal", "Nailah Blackman", "Voice"]
    }
];

// L1 Cache (In-Memory Storage for instantaneous tab transition loads)
let l1InitialFeed = null;
let l1DynamicFeeds = null;

export default function Home({ seek, setSeek }) {
    const netInfo = useNetInfo();
    const [initialfeed, setInitialFeed] = useState([]);
    const [dynamicFeeds, setDynamicFeeds] = useState([]);
    const [savedArtists, setSavedArtists] = useState([]);
    const [access_token, setAccessToken] = useState("");
    const [genres, setGenres] = useState([]);
    const [randomcolors, setRandomColors] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        // Evict L1 and L2 caches completely on manual Pull-To-Refresh
        l1InitialFeed = null;
        l1DynamicFeeds = null;
        await AsyncStorage.removeItem("storageWithExpiry");
        await AsyncStorage.removeItem("initial_feed");
        await AsyncStorage.removeItem("dynamic_feeds_cache");
        await getall(true); // Forced hard refresh
        setRefreshing(false);
    };

    const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
        const paddingToBottom = 150; // Trigger 150px before reaching the end for a seamless scroll feel
        return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    };

    const loadMoreSections = async () => {
        if (loadingMore || !access_token) return;
        setLoadingMore(true);

        try {
            // --- Weighted Genre Priority System ---
            // R&B: 40, Hip-Hop: 40, Dancehall: 8, Afrobeats: 6, Soca: 4, Other: 2
            const rand = Math.random() * 100;
            let genre;
            let isOtherGenre = false;
            let otherGenreQuery = "";

            if (rand < 40) {
                genre = GENRES.find(g => g.id === "rnb");
            } else if (rand < 80) {
                genre = GENRES.find(g => g.id === "hiphop");
            } else if (rand < 88) {
                genre = GENRES.find(g => g.id === "dancehall");
            } else if (rand < 94) {
                genre = GENRES.find(g => g.id === "afrobeats");
            } else if (rand < 98) {
                genre = GENRES.find(g => g.id === "soca");
            } else {
                // Rare "other" — pull from the broader genreslist pool for variety
                isOtherGenre = true;
                const otherExcluded = ["r-n-b", "hip-hop", "dancehall", "afrobeat", "soca"];
                const otherPool = genreslist.filter(g => !otherExcluded.includes(g));
                otherGenreQuery = otherPool[Math.floor(Math.random() * otherPool.length)];
            }

            let title = "";
            let searchQuery = "";
            let fallbackQuery = "";
            const headers = { Authorization: `Bearer ${access_token}` };

            if (isOtherGenre) {
                // Occasional genre — use genre name as the query
                const label = otherGenreQuery.replace(/-/g, " ");
                title = `Exploring: ${label.charAt(0).toUpperCase() + label.slice(1)}`;
                searchQuery = otherGenreQuery;
                fallbackQuery = otherGenreQuery;
            } else {
                // Priority genre — pick a personalized artist from pool
                let candidates = [...new Set([...savedArtists, ...genre.pool])];

                // Deduplicate against already-displayed artists
                let displayedArtists = dynamicFeeds.map(f => {
                    for (const prefix of ["Because you like ", "Recommended for fans of ", "Dancehall Anthems: ", "Afrobeats Riddims: ", "Soca Carnival: ", "Exploring: "]) {
                        if (f.title.startsWith(prefix)) return f.title.replace(prefix, "");
                    }
                    return "";
                }).filter(Boolean);

                let remainingCandidates = candidates.filter(c => !displayedArtists.includes(c));
                let selectedArtist = remainingCandidates.length > 0
                    ? remainingCandidates[Math.floor(Math.random() * remainingCandidates.length)]
                    : candidates[Math.floor(Math.random() * candidates.length)];

                if (genre.id === "rnb") title = `Because you like ${selectedArtist}`;
                else if (genre.id === "hiphop") title = `Recommended for fans of ${selectedArtist}`;
                else if (genre.id === "dancehall") title = `Dancehall Anthems: ${selectedArtist}`;
                else if (genre.id === "afrobeats") title = `Afrobeats Riddims: ${selectedArtist}`;
                else if (genre.id === "soca") title = `Soca Carnival: ${selectedArtist}`;

                searchQuery = selectedArtist;
                fallbackQuery = genre.id === "rnb" ? "rnb r&b" : genre.id === "hiphop" ? "hiphop rap" : genre.defaultTitle;
            }

            const resp = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=playlist&limit=24&offset=0`, { headers });
            const result = await resp.json();
            let playlists = result.playlists?.items || [];

            if (playlists.length === 0) {
                const randomOffset = Math.floor(Math.random() * 15);
                const fallbackResp = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(fallbackQuery)}&type=playlist&limit=24&offset=${randomOffset}`, { headers });
                const fallbackResult = await fallbackResp.json();
                playlists = fallbackResult.playlists?.items || [];
                if (!isOtherGenre) title = genre.defaultTitle;
            }

            const chunks = chunkcards(playlists);
            const newSection = {
                id: `${isOtherGenre ? otherGenreQuery : genre.id}_${Date.now()}`,
                title: title,
                chunks: chunks
            };

            setDynamicFeeds(prev => [...prev, newSection]);
        } catch (err) {
            console.error("Error loading more infinite sections:", err);
        } finally {
            setLoadingMore(false);
        }
    };




    const chunkcards = (arr, chunksizeval = 6) => {
        const chunkSize = chunksizeval;
        const chunks = [];

        for (let i = 0; i < arr.length; i += chunkSize) {
            const chunk = arr.slice(i, i + chunkSize);
            chunks.push(chunk);
        }
        return chunks
    }

    const generaterandomcolors = (array) => {
        const colors = [];

        for (let i = 0; i < array.length; i++) {
            const randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16);
            colors.push(randomColor);
        }

        return colors
    }


    const createxpiration = async () => {
        const storageExpirationTimeInMinutes = 30; // 30 minutes caching to avoid Spotify rate limits
        console.log(storageExpirationTimeInMinutes)

        let dt = new Date()
        dt = new Date(dt.getTime() + storageExpirationTimeInMinutes * 60 * 1000)

        // store the data with expiration time in there
        await AsyncStorage.setItem(
            "storageWithExpiry",
            dt.toISOString()
        );
    }
    function parseISOString(s) {
        var b = s.split(/\D+/);
        return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
    }


    const getall = async (force = false) => {
        // Fetch library/playlists metadata from AsyncStorage to build dynamic feeds
        let keys = await AsyncStorage.getAllKeys();
        let libraryKeys = keys.filter(k => k.includes("library:") || k.includes("playlist-track:"));
        let allSavedTracks = [];
        if (libraryKeys.length > 0) {
            let items = await AsyncStorage.multiGet(libraryKeys);
            for (let item of items) {
                try {
                    let parsed = JSON.parse(item[1]);
                    if (Array.isArray(parsed)) {
                        allSavedTracks.push(...parsed);
                    } else if (parsed && parsed.name) {
                        allSavedTracks.push(parsed);
                    }
                } catch (e) {
                    console.error("Error parsing saved track:", e);
                }
            }
        }
        let savedArtists = [...new Set(allSavedTracks.map(t => t.artist).filter(Boolean))];
        setSavedArtists(savedArtists);

        // STALE-WHILE-REVALIDATE: Load L1 or L2 instantly first, unless forced!
        if (!force) {
            // L1 HIT (In-Memory Cache): Instantaneous (0ms)
            if (l1InitialFeed && l1DynamicFeeds) {
                console.log("L1 Cache Hit: Rendering discovery feed instantly.");
                setInitialFeed(l1InitialFeed);
                setDynamicFeeds(l1DynamicFeeds);
            } else {
                // L2 HIT (AsyncStorage Persistent Disk Cache): Blazing fast
                let l2Feed = await AsyncStorage.getItem("initial_feed");
                let l2Dynamic = await AsyncStorage.getItem("dynamic_feeds_cache");
                if (l2Feed && l2Dynamic) {
                    try {
                        console.log("L2 Cache Hit: Rendering discovery feed from disk.");
                        let parsedFeed = JSON.parse(l2Feed);
                        let parsedDynamic = JSON.parse(l2Dynamic);
                        setInitialFeed(parsedFeed);
                        setDynamicFeeds(parsedDynamic);
                        // Populate L1 cache for future navigations
                        l1InitialFeed = parsedFeed;
                        l1DynamicFeeds = parsedDynamic;
                    } catch (e) {
                        console.error("Error loading L2 Cache:", e);
                    }
                }
            }
        }

        // Now, asynchronously refresh the feed from the network in the background (SWR pattern)
        const access_token = await get_access_token();
        setAccessToken(access_token)

        // Dynamic hash-based change detection (Evicts cache if library updates)
        let lastArtistsHash = await AsyncStorage.getItem("saved_artists_hash");
        let currentArtistsHash = JSON.stringify(savedArtists);
        let forceRefresh = force;
        if (lastArtistsHash !== currentArtistsHash) {
            console.log("Library update detected! Rebuilding home feed recommendations.");
            await AsyncStorage.removeItem("storageWithExpiry");
            await AsyncStorage.removeItem("initial_feed");
            await AsyncStorage.removeItem("dynamic_feeds_cache");
            await AsyncStorage.setItem("saved_artists_hash", currentArtistsHash);
            forceRefresh = true;
            l1InitialFeed = null;
            l1DynamicFeeds = null;
        }

        let savedData = forceRefresh ? null : await AsyncStorage.getItem("storageWithExpiry");
        const currentTimestamp = new Date().toISOString()

        // Remove the saved data if it expires.
        if (savedData !== null) {
            if (parseISOString(currentTimestamp) >= parseISOString(savedData)) {
                await AsyncStorage.removeItem("storageWithExpiry");
                await AsyncStorage.removeItem("initial_feed");
                await AsyncStorage.removeItem("dynamic_feeds_cache");
                let keys2 = await AsyncStorage.getAllKeys()
                await AsyncStorage.multiRemove(keys2.filter((key) => { return (key.includes("album:")) }))
                l1InitialFeed = null;
                l1DynamicFeeds = null;
            }
        }

        // Fetch fresh initial feed if needed (we'll save it to L2 and L1)
        let freshFeed = null;
        let cache_initial = forceRefresh ? null : await AsyncStorage.getItem("initial_feed")
        if (!cache_initial) {
            // Fetch initial albums feed
            const headers = { Authorization: `Bearer ${access_token}` }
            const randomOffset = Math.floor(Math.random() * 40);
            const resp = await fetch(`https://api.spotify.com/v1/browse/new-releases?limit=14&offset=${randomOffset}`, { headers: headers })
            const feedresult = await resp.json()
            freshFeed = feedresult.albums.items;
            await AsyncStorage.setItem("initial_feed", JSON.stringify(freshFeed));
            await createxpiration();
            setInitialFeed(freshFeed);
            l1InitialFeed = freshFeed;
        }
        else {
            freshFeed = JSON.parse(cache_initial);
            setInitialFeed(freshFeed);
            l1InitialFeed = freshFeed;
        }

        // Curated Pools for five genres (R&B, Hip-Hop, Dancehall, Afrobeats, Soca)
        const GENRES = [
            {
                id: "rnb",
                defaultTitle: "Contemporary R&B",
                pool: ["Frank Ocean", "SZA", "Brent Faiyaz", "The Weeknd", "Bryson Tiller", "Summer Walker", "Daniel Caesar", "Giveon", "Kehlani", "Steve Lacy", "Drake"]
            },
            {
                id: "hiphop",
                defaultTitle: "Contemporary Hip-Hop",
                pool: ["Drake", "Travis Scott", "Kendrick Lamar", "J. Cole", "Future", "21 Savage", "Playboi Carti", "Lil Uzi Vert", "Metro Boomin", "Kanye West", "Tyler, the Creator", "Lil Baby", "Waka Flocka Flame"]
            },
            {
                id: "dancehall",
                defaultTitle: "Vibrant Dancehall",
                pool: ["Vybz Kartel", "Popcaan", "Spice", "Shenseea", "Skillibeng", "Masicka", "Alkaline", "Sean Paul", "Shaggy", "Koffee", "Dexta Daps", "Teejay"]
            },
            {
                id: "afrobeats",
                defaultTitle: "Global Afrobeats",
                pool: ["Burna Boy", "Wizkid", "Davido", "Rema", "Asake", "Tems", "Ayra Starr", "Fireboy DML", "Omah Lay", "Tiwa Savage", "CKay"]
            },
            {
                id: "soca",
                defaultTitle: "Soca Carnival",
                pool: ["Machel Montano", "Kes the Band", "Bunji Garlin", "Fay-Ann Lyons", "Patrice Roberts", "Skinny Fabulous", "Destra Garcia", "Lyrikal", "Nailah Blackman", "Voice"]
            }
        ];

        // Fetch fresh 5 dynamic shelves in parallel concurrently (SWR revalidation)
        try {
            const fetchFeeds = GENRES.map(async (genre) => {
                let candidates = [...new Set([...savedArtists, ...genre.pool])];
                let selectedArtist = candidates[Math.floor(Math.random() * candidates.length)];

                let title = "";
                if (genre.id === "rnb") title = `Because you like ${selectedArtist}`;
                else if (genre.id === "hiphop") title = `Recommended for fans of ${selectedArtist}`;
                else if (genre.id === "dancehall") title = `Dancehall Anthems: ${selectedArtist}`;
                else if (genre.id === "afrobeats") title = `Afrobeats Riddims: ${selectedArtist}`;
                else if (genre.id === "soca") title = `Soca Carnival: ${selectedArtist}`;

                const headers = { Authorization: `Bearer ${access_token}` }
                const resp = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(selectedArtist)}&type=playlist&limit=24&offset=0`, { headers: headers });
                const result = await resp.json();
                let playlists = result.playlists?.items || [];

                if (playlists.length === 0) {
                    const fallbackQuery = genre.id === "rnb" ? 'rnb OR "r%26b"' : (genre.id === "hiphop" ? 'hiphop OR rap' : genre.id);
                    const randomOffset = Math.floor(Math.random() * 15);
                    const fallbackResp = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(fallbackQuery)}&type=playlist&limit=24&offset=${randomOffset}`, { headers: headers });
                    const fallbackResult = await fallbackResp.json();
                    playlists = fallbackResult.playlists?.items || [];
                    title = genre.defaultTitle;
                }

                const chunks = chunkcards(playlists);
                return {
                    id: genre.id,
                    title: title,
                    chunks: chunks
                };
            });

            const completedFeeds = await Promise.all(fetchFeeds);

            // Render fresh feeds dynamically to user
            setDynamicFeeds(completedFeeds);

            // Populate L1 and L2 caches concurrently!
            l1DynamicFeeds = completedFeeds;
            await AsyncStorage.setItem("dynamic_feeds_cache", JSON.stringify(completedFeeds));
        } catch (err) {
            console.error("Error loading dynamic genre feeds:", err);
        }

        const randomcolors = [
            "#3F00BA", "#3200C6", "#2500D2", "#D90025", "#CC0031",
            "#7F007C", "#720088", "#A50056", "#990063", "#8C006F",
            "#3F00BA", "#3200C6", "#650094", "#5900A1", "#4C00AD",
            "#008000", "#006600", "#004C00", "#003300", "#001900"
        ]
        setRandomColors(randomcolors)
        const chunks = chunkcards(genreslist, chunksizeval = 20);
        setGenres(chunks)
    }
    useEffect(() => {
        //console.log(netInfo)
        if (netInfo.isInternetReachable === true) {
            getall()
        }


    }, [netInfo])
    useEffect(() => {
        requestStoragePermission();
    }, []);
    if (netInfo.isInternetReachable === true) {
        return (
            <View style={{ flex: 1, backgroundColor: "#141212" }}>
                {/*Header */}
                <View style={{ flex: 0.08, backgroundColor: "green", flexDirection: "row", backgroundColor: "#141212" }}>
                    <View style={{ flex: 1, margin: 10 }}>
                        <Text style={{ fontSize: 20 }}>CaesarAIMusicStream</Text>

                    </View>
                    <View style={{ flex: 0.13, margin: 10 }}>
                        <Image style={{ borderRadius: 5, width: 44, height: 39 }} source={require('../../assets/CaesarAILogo.png')} />
                    </View>

                </View>
                {/*Main Scroll Body*/}
                <ScrollView
                    removeClippedSubviews={true}
                    style={{ flex: 1, backgroundColor: "#141212" }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="white" />
                    }
                    scrollEventThrottle={400}
                    onScroll={({ nativeEvent }) => {
                        if (isCloseToBottom(nativeEvent)) {
                            loadMoreSections();
                        }
                    }}
                >
                    {/* Favourite Playlists */}
                    {initialfeed.length > 0 && access_token !== "" && <FavouriteAlbums access_token={access_token} favouritecards={true} playlists={initialfeed.slice(0, 8)} />}
                    {initialfeed.length > 0 && access_token !== "" &&
                        <View style={{ flex: 1 }}>
                            <Text style={{ margin: 15, fontSize: 23, color: "white", fontWeight: 'bold' }}>Latest Playlists</Text>
                        </View>
                    }
                    {initialfeed.length > 0 && access_token !== "" && <FavouriteAlbums access_token={access_token} favouritecards={false} playlists={initialfeed.slice(8,)} />}

                    {/* Dynamic recommendation feeds — always at the bottom so infinite scroll appends below */}
                    {dynamicFeeds.length > 0 && access_token !== "" &&
                        dynamicFeeds.map((feed) => {
                            return (
                                <View key={feed.id} style={{ flex: 1 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ margin: 15, fontSize: 23, color: "white", fontWeight: "bold" }}>
                                            {feed.title}
                                        </Text>
                                    </View>
                                    {feed.chunks.map((carousel, idx) => (
                                        <FavouritePlaylistsHomeScreen
                                            key={idx}
                                            access_token={access_token}
                                            playlists={carousel}
                                        />
                                    ))}
                                </View>
                            );
                        })
                    }

                    {/* Infinite scroll loader — always the very last element */}
                    {loadingMore && (
                        <View style={{ marginVertical: 30, justifyContent: "center", alignItems: "center" }}>
                            <ActivityIndicator size="large" color="#1DB954" />
                        </View>
                    )}
                </ScrollView>
                {/*Song Progress Tracker */}

                <ShowCurrentTrack />
                <ShowQueue />


                {/*Song Progress Tracker */}
                <View style={{ flex: 0.018, backgroundColor: "#141212", justifyContent: "center", alignItems: "center" }}>
                    <TrackProgress seek={seek} setSeek={setSeek} />

                </View>

                {/*Navigation Footer*/}
                <NavigationFooter currentpage={"home"} />



            </View>
        )
    }
    else {
        return (
            <View style={{ flex: 1, backgroundColor: "#141212" }}>
                {/*Header */}
                <View style={{ flex: 0.08, backgroundColor: "green", flexDirection: "row", backgroundColor: "#141212" }}>
                    <View style={{ flex: 1, margin: 10 }}>
                        <Text style={{ fontSize: 20 }}>CaesarAIMusicStream</Text>

                    </View>
                    <View style={{ flex: 0.13, margin: 10 }}>
                        <Image style={{ borderRadius: 5, width: 44, height: 39 }} source={require('../../assets/CaesarAILogo.png')} />
                    </View>

                </View>
                {/* No Internet Main Body */}
                <View style={{ flex: 1, backgroundColor: "#141212", justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ fontSize: 30 }}>No Internet Connection</Text>
                    <Text>
                        Play your Downloads
                    </Text>
                </View>
                {/*Song Progress Tracker */}
                <ShowCurrentTrack />
                <ShowQueue />
                <TrackProgress seek={seek} setSeek={setSeek} />

                {/*Navigation Footer*/}
                <NavigationFooter currentpage={"home"} />

            </View>
        )

    }
}

/*
                <View style={{flex:1}}>
                    <Text style={{margin:15,fontSize:23,color:"white",fontWeight: 'bold'}}>Latest HipHop</Text>
                </View>
                {initialhiphop !== undefined && initialhiphop.length > 0 && 
                initialhiphop.map((hiphopcarousel) =>{
                    return(
                        <FavouriteRecommendations favouritecards={false} playlists={hiphopcarousel}/>
                    )
                })

                } */