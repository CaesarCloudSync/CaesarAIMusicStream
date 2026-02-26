import { View, Text, ScrollView, Image, SafeAreaView, TouchableOpacity } from "react-native";
import AntDesign from "react-native-vector-icons/AntDesign";
import NavigationFooter from "../NavigationFooter/NavigationFooter";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-native";
import TrackProgress from "../TrackProgress/TrackProgress";
import { FavouriteAlbums, FavouriteTopTracksAlbums } from "../HomeScreen/FavouriteRenders";
import ShowCurrentTrack from "../ShowCurrentTrack/ShowCurrentTrack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ShowQueue from "../ShowQueue/showqueue";
import {
    getArtistInfo,
    getArtistInfoByMbid,
    getArtistTopAlbums,
    getArtistTopTracks,
    getSimilarArtists,
    normalizeAlbum,
    normalizeTrack,
    pickImage,
} from "../lastfm/lastfm";

export default function ArtistProfile({ seek, setSeek }) {
    const location = useLocation();
    const navigate = useNavigate();

    // album_tracks[0].artist_id is the mbid OR artist name passed from navigation
    const [album_tracks] = useState(location.state?.album_tracks);
    const [artistThumbnail, setArtistThumbnail] = useState("");
    const [all_album_tracks, setAllAlbumTracks] = useState([]);
    const [compilations, setCompilations] = useState([]);
    const [appears_on, setAppearsOn] = useState([]);
    const [top_tracks, setTopTracks] = useState([]);
    const [singles, setSingles] = useState([]);
    const [artistname, setArtistName] = useState("");
    // Last.fm doesn't need an access token, but we keep state for render guards
    const [access_token] = useState("lastfm");

    const resolveArtistId = () => {
        // artist_id can be an mbid (UUID) or an artist name string
        return album_tracks?.[0]?.artist_id || album_tracks?.[0]?.artist || "";
    };

    const get_artist_info = async (artistId) => {
        try {
            let info;
            // UUID mbid check (8-4-4-4-12 hex pattern)
            const isMbid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(artistId);
            if (isMbid) {
                info = await getArtistInfoByMbid(artistId);
            } else {
                info = await getArtistInfo(artistId);
            }
            setArtistName(info.artist_name);
            setArtistThumbnail(info.thumbnail);
            // Cache for recent artists
            await AsyncStorage.setItem(
                `artist:${info.artist_name}`,
                JSON.stringify({
                    artist_id: info.artist_id,
                    artist_name: info.artist_name,
                    thumbnail: info.thumbnail,
                })
            );
            return info.artist_name;
        } catch (err) {
            console.error("get_artist_info error", err);
            return artistId;
        }
    };

    const get_albums = async (resolvedName) => {
        try {
            const albums = await getArtistTopAlbums(resolvedName, 50);
            // Last.fm doesn't distinguish album/single/compilation, so put all in albums
            setAllAlbumTracks(albums);
        } catch (err) {
            console.error("get_albums error", err);
        }
    };

    const get_top_tracks = async (resolvedName) => {
        try {
            const tracks = await getArtistTopTracks(resolvedName, 20);
            setTopTracks(tracks);
        } catch (err) {
            console.error("get_top_tracks error", err);
        }
    };

    const get_similar = async (resolvedName) => {
        try {
            const similar = await getSimilarArtists(resolvedName, 10);
            // Show similar artists as "Appears On" section
            setAppearsOn(similar.map(a => ({
                id: a.artist_id,
                name: a.artist_name,
                images: [{ url: a.thumbnail }],
                artists: [{ name: a.artist_name }],
                total_tracks: 0,
                release_date: "",
                album_type: "artist",
            })));
        } catch (err) {
            console.error("get_similar error", err);
        }
    };

    const getall = async () => {
        const artistId = resolveArtistId();
        const resolvedName = await get_artist_info(artistId);
        await Promise.all([
            get_albums(resolvedName),
            get_top_tracks(resolvedName),
            get_similar(resolvedName),
        ]);
    };

    useEffect(() => {
        getall();
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: "#141212" }}>
            {/* Header */}
            <View style={{ flexDirection: "row" }}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => navigate(-1)}>
                    <AntDesign name="arrowleft" style={{ fontSize: 30 }} />
                </TouchableOpacity>
            </View>

            {artistThumbnail !== "" && (
                <TouchableOpacity style={{ justifyContent: "center", alignItems: "center", flex: 0.4 }}>
                    <Image style={{ borderRadius: 5, width: 175, height: 175 }} source={{ uri: artistThumbnail }} />
                </TouchableOpacity>
            )}

            <View style={{ flex: 0.1, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ color: "white", fontSize: 20 }}>{artistname}</Text>
            </View>

            <ScrollView removeClippedSubviews={true} style={{ flex: 1, backgroundColor: "#141212" }}>
                {all_album_tracks.length > 0 && (
                    <View style={{ flex: 0.1, justifyContent: "flex-start", alignItems: "flex-start", marginLeft: 20 }}>
                        <Text style={{ color: "white", fontSize: 20 }}>Albums</Text>
                    </View>
                )}
                {all_album_tracks.length > 0 && (
                    <FavouriteAlbums access_token={access_token} favouritecards={true} playlists={all_album_tracks} />
                )}

                {top_tracks.length > 0 && (
                    <View style={{ flex: 0.1, justifyContent: "flex-start", alignItems: "flex-start", marginLeft: 20 }}>
                        <Text style={{ color: "white", fontSize: 20 }}>Top Tracks</Text>
                    </View>
                )}
                {top_tracks.length > 0 && (
                    <FavouriteTopTracksAlbums access_token={access_token} favouritecards={true} playlists={top_tracks} />
                )}

                {appears_on.length > 0 && (
                    <View style={{ flex: 0.1, justifyContent: "flex-start", alignItems: "flex-start", marginLeft: 20 }}>
                        <Text style={{ color: "white", fontSize: 20 }}>Similar Artists</Text>
                    </View>
                )}
                {appears_on.length > 0 && (
                    <FavouriteAlbums access_token={access_token} favouritecards={true} playlists={appears_on} />
                )}
            </ScrollView>

            <ShowCurrentTrack />
            <ShowQueue />

            <View style={{ flex: 0.01, backgroundColor: "#141212", justifyContent: "center", alignItems: "center" }}>
                <TrackProgress seek={seek} setSeek={setSeek} />
            </View>

            <NavigationFooter />
        </View>
    );
}
