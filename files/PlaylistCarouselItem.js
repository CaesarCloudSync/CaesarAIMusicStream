import { View, Text, Image } from "react-native";
import { useState } from "react";
import { useNavigate } from "react-router-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { getAlbumInfo } from "../lastfm/lastfm";

/**
 * PlaylistCarouselItem
 *
 * Previously fetched a Spotify playlist by ID. Now uses the album_name +
 * artist_name (stored in the playlist object) to load tracks from Last.fm.
 *
 * The `playlistid` prop is kept for backward-compat but is now used as a
 * cache key rather than a Spotify ID.
 */
export default function PlaylistCarouselItem({
    access_token,
    favouritecards,
    playlistid,
    thumbnail,
    playlist_name,
    total_tracks,
    album_type,
    // Last.fm extras (passed from search/genre pages)
    artist_name = "",
    album_name = "",
}) {
    const [addingtolibrary, setAddingToLibrary] = useState(false);
    const navigate = useNavigate();

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    /**
     * Build track list. If we have artist + album, use Last.fm album.getinfo.
     * Otherwise, navigate with empty tracks so the Tracks screen can handle it.
     */
    const getalbumtracks = async (route) => {
        try {
            const resolvedArtist = artist_name || playlist_name;
            const resolvedAlbum = album_name || playlist_name;
            const { album_info, tracks } = await getAlbumInfo(resolvedArtist, resolvedAlbum);
            const thumb = thumbnail || album_info.images[0]?.url || "";
            const album_tracks = tracks.map((t) => ({
                playlist_thumbnail: thumb,
                playlist_id: playlistid,
                playlist_name,
                album_id: album_info.id,
                album_name: resolvedAlbum,
                name: t.name,
                id: t.id,
                artist: resolvedArtist,
                artist_id: t.artist_id,
                thumbnail: t.thumbnail || thumb,
                track_number: t.track_number,
                duration_ms: t.duration_ms,
            }));
            navigate(route, { state: { album_tracks } });
        } catch (err) {
            console.error("PlaylistCarouselItem getalbumtracks error", err);
            // Navigate anyway with minimal data
            navigate(route, { state: { album_tracks: [] } });
        }
    };

    const singleTap = Gesture.Tap().onEnd((_event, success) => {
        if (success) getalbumtracks("/tracks");
    });

    const longPress = Gesture.LongPress().onStart(async (_event, success) => {
        const album_card = {
            name: playlist_name,
            id: playlistid,
            images: [{ url: thumbnail }],
            artists: [{ name: artist_name || playlist_name }],
            album_type: album_type || "playlist",
        };
        await AsyncStorage.setItem(`album-recent-load:${artist_name}_${playlist_name}`, JSON.stringify(album_card));
        navigate("/search");
    });

    return (
        <View key={playlist_name} style={{ backgroundColor: "#141212", width: 200, height: 50, borderRadius: 5, borderWidth: 3, flexBasis: "47%", margin: 5, borderColor: "#141212" }}>
            <GestureDetector gesture={Gesture.Exclusive(longPress, singleTap)}>
                <View style={{ backgroundColor: !addingtolibrary ? "#141212" : "grey", flexDirection: "row", justifyContent: "center", alignItems: "center", flex: 1 }}>
                    <View style={{ flex: 0.5 }}>
                        <Image style={{ borderRadius: 2, width: "100%", height: "100%" }} source={{ uri: thumbnail }} />
                    </View>
                    <View style={{ padding: 10 }} />
                    <Text style={{ color: "white", flex: 1 }}>
                        {playlist_name} | {capitalizeFirstLetter(album_type || "album")}
                    </Text>
                </View>
            </GestureDetector>
        </View>
    );
}
