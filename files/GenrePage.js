import { useEffect, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { useLocation, useNavigate } from "react-router-native";
import AntDesign from "react-native-vector-icons/AntDesign";
import { FavouriteGenreRecommendations } from "../HomeScreen/FavouriteRenders";
import NavigationFooter from "../NavigationFooter/NavigationFooter";
import ShowCurrentTrack from "../ShowCurrentTrack/ShowCurrentTrack";
import ShowQueue from "../ShowQueue/showqueue";
import TrackProgress from "../TrackProgress/TrackProgress";
import { getTagTopAlbums, getTagTopArtists } from "../lastfm/lastfm";

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export default function GenrePage({ seek, setSeek }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [genre] = useState(location.state?.genre);
    const [playlists, setPlaylists] = useState([]);
    const [artists, setArtists] = useState([]);
    const [loaded, setLoaded] = useState(false);

    const searchgenre = async () => {
        try {
            // Use Last.fm tag API to get top albums + artists for the genre/tag
            const [albums, tagArtists] = await Promise.all([
                getTagTopAlbums(genre, 30),
                getTagTopArtists(genre, 20),
            ]);

            // Normalise albums into the shape FavouriteGenreRecommendations expects
            const albumCards = albums.map(a => ({
                id: a.id,
                name: a.name,
                images: [{ url: a.thumbnail || a.images?.[0]?.url || "" }],
                artists: [{ name: a.artists?.[0]?.name || "" }],
                total_tracks: a.total_tracks || 0,
                release_date: a.release_date || "",
                album_type: "album",
            }));

            // Normalise artists
            const artistCards = tagArtists.map(a => ({
                artist_id: a.artist_id,
                artist_name: a.artist_name || a.name,
                name: a.artist_name || a.name,
                thumbnail: a.thumbnail,
                images: [{ url: a.thumbnail }],
            }));

            setPlaylists(albumCards);
            setArtists(artistCards);
            setLoaded(true);
        } catch (err) {
            console.error("GenrePage searchgenre error", err);
        }
    };

    useEffect(() => {
        searchgenre();
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: "#141212" }}>
            {loaded && (
                <View style={{ flex: 0.2, justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ fontSize: 30 }}>{capitalizeFirstLetter(genre)}</Text>
                </View>
            )}

            {loaded && (
                <View style={{ flex: 1 }}>
                    <FavouriteGenreRecommendations
                        access_token={"lastfm"}
                        favouritecards={true}
                        playlists={playlists}
                        artists={artists}
                    />
                </View>
            )}

            {loaded && <ShowCurrentTrack />}
            {loaded && <ShowQueue />}
            {loaded && (
                <View style={{ flex: 0.018, backgroundColor: "#141212", justifyContent: "center", alignItems: "center" }}>
                    <TrackProgress seek={seek} setSeek={setSeek} />
                </View>
            )}
            {loaded && <NavigationFooter currentpage={"search"} />}
        </View>
    );
}
