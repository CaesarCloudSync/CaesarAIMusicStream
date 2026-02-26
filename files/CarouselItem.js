import { View, Text, Image, TouchableOpacity } from "react-native";
import { useState } from "react";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useNavigate } from "react-router-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Gesture, GestureDetector, Directions } from "react-native-gesture-handler";
import { getAlbumInfo, pickImage } from "../lastfm/lastfm";

export default function CarouselItem({
    spotifyid,       // now treated as "artist_album_key" or mbid
    access_token,    // kept for API compat but unused (Last.fm needs no token)
    favouritecards,
    thumbnail,
    album_name,
    artist_name,
    total_tracks,
    release_date,
    album_type,
    toptrack,
    recentalbums,
    setRecentAlbums,
    single,
}) {
    const [addingtolibrary, setAddingToLibrary] = useState(false);
    const navigate = useNavigate();

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    /**
     * Fetch album tracks from Last.fm and navigate to the given route.
     */
    const getalbumtracks = async (route) => {
        try {
            const { album_info, tracks } = await getAlbumInfo(artist_name, album_name);
            const album_thumbnail = thumbnail || album_info.images[0]?.url || "";
            const album_tracks = tracks.map((t) => ({
                album_id: album_info.id,
                album_name: album_name,
                name: t.name,
                id: t.id,
                artist: artist_name,
                artist_id: t.artist_id,
                thumbnail: album_thumbnail,
                track_number: t.track_number,
                duration_ms: t.duration_ms,
            }));
            navigate(route, { state: { current_single: toptrack, album_tracks } });
        } catch (err) {
            console.error("getalbumtracks error", err);
        }
    };

    const addtolibrary = async () => {
        setAddingToLibrary(true);
        try {
            const { album_info, tracks } = await getAlbumInfo(artist_name, album_name);
            const album_thumbnail = thumbnail || album_info.images[0]?.url || "";
            const album_tracks = tracks.map((t) => ({
                album_id: album_info.id,
                album_name: album_name,
                name: t.name,
                id: t.id,
                artist: artist_name,
                artist_id: t.artist_id,
                thumbnail: album_thumbnail,
                track_number: t.track_number,
                duration_ms: t.duration_ms,
            }));
            const libraryKey = `library:${album_name}|${artist_name}`;
            const existing = await AsyncStorage.getItem(libraryKey);
            if (!existing) {
                await AsyncStorage.setItem(libraryKey, JSON.stringify(album_tracks));
            }
        } catch (err) {
            console.error("addtolibrary error", err);
        } finally {
            setAddingToLibrary(false);
        }
        navigate("/library");
    };

    const singleTap = Gesture.Tap().onEnd((_event, success) => {
        if (success) getalbumtracks("/tracks");
    });

    const flingleft = Gesture.Fling()
        .direction(Directions.LEFT)
        .onEnd(() => { addtolibrary(); });

    const doubleTap = Gesture.Tap().numberOfTaps(2).onEnd((_event, success) => {
        if (success) getalbumtracks("/artistprofile");
    });

    const longPress = Gesture.LongPress().onStart(async (_event, success) => {
        if (recentalbums) {
            await AsyncStorage.removeItem(`album-recent-load:${artist_name}_${album_name}`);
            const leftover = recentalbums.filter((obj) => obj.name !== album_name);
            setRecentAlbums(leftover);
        } else {
            const album_card = {
                name: album_name,
                id: spotifyid,
                images: [{ url: thumbnail }],
                artists: [{ name: artist_name }],
                album_type,
            };
            await AsyncStorage.setItem(`album-recent-load:${artist_name}_${album_name}`, JSON.stringify(album_card));
            navigate("/search");
        }
    });

    if (favouritecards !== true) {
        return (
            <View style={{ backgroundColor: "#141212", width: favouritecards === true ? 50 : 185, height: favouritecards === true ? 50 : 300, borderRadius: 5, borderWidth: 3, margin: 5, borderColor: "#141212" }}>
                <GestureDetector gesture={Gesture.Exclusive(doubleTap, longPress, singleTap)}>
                    <View key={album_name} style={{ backgroundColor: "#141212", flexDirection: "column", flex: 1 }}>
                        <View style={{ flex: 1 }}>
                            <Image style={{ borderRadius: 5, width: "100%", height: "100%" }} source={{ uri: thumbnail }} />
                        </View>
                        <View style={{ padding: 10 }} />
                        <Text style={{ color: "white" }}>
                            {album_name} | {single === true ? "SINGLE" : capitalizeFirstLetter(album_type)}
                        </Text>
                        <Text>Artist: {artist_name}</Text>
                        <View>
                            <Text>Total Tracks: {total_tracks}</Text>
                            <Text>Release Date: {release_date}</Text>
                        </View>
                    </View>
                </GestureDetector>
            </View>
        );
    } else {
        return (
            <View key={album_name} style={{ backgroundColor: "#141212", width: 200, height: 50, borderRadius: 5, borderWidth: 3, flexBasis: "47%", margin: 5, borderColor: "#141212" }}>
                <GestureDetector gesture={Gesture.Exclusive(flingleft, doubleTap, longPress, singleTap)}>
                    <View style={{ backgroundColor: !addingtolibrary ? "#141212" : "grey", flexDirection: "row", justifyContent: "center", alignItems: "center", flex: 1 }}>
                        <View style={{ flex: 0.5 }}>
                            <Image style={{ borderRadius: 2, width: "100%", height: "100%" }} source={{ uri: thumbnail }} />
                        </View>
                        <View style={{ padding: 10 }} />
                        <Text style={{ color: "white", flex: 1 }}>
                            {toptrack !== undefined ? toptrack : album_name} | {single === true ? "SINGLE" : capitalizeFirstLetter(album_type)}
                        </Text>
                    </View>
                </GestureDetector>
            </View>
        );
    }
}
