import CarouselItem from "./CarouselItem";
import { View, Text, SafeAreaView, FlatList, ScrollView } from "react-native";
import ArtistCarouselItem from "./ArtistCarouselItem";
import PlaylistCarouselItem from "./PlaylistCarouselItem";

// ─── Albums grid ──────────────────────────────────────────────────────────────
export function FavouriteAlbums({ favouritecards, playlists, access_token, recentalbums, setRecentAlbums }) {
    if (!playlists || playlists.length === 0) return null;
    return (
        <View key={playlists[0].name} style={{ justifyContent: "center", marginTop: 10 }}>
            <View style={{ alignItems: "center", justifyContent: "center", flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {playlists.map((album, index) => (
                    <CarouselItem
                        key={index}
                        toptrack={album.name}
                        access_token={access_token}
                        favouritecards={favouritecards}
                        spotifyid={album.id}
                        thumbnail={album.images?.[0]?.url || ""}
                        album_name={album.name}
                        artist_name={album.artists?.[0]?.name || ""}
                        total_tracks={album.total_tracks}
                        release_date={album.release_date}
                        album_type={album.album_type || "album"}
                        recentalbums={recentalbums}
                        setRecentAlbums={setRecentAlbums}
                    />
                ))}
            </View>
        </View>
    );
}

// ─── Top-tracks list (each item has a nested .album) ─────────────────────────
export function FavouriteTopTracksAlbums({ favouritecards, playlists, access_token }) {
    if (!playlists || playlists.length === 0) return null;
    return (
        <View key={playlists[0].name} style={{ justifyContent: "center", marginTop: 10 }}>
            <View style={{ alignItems: "center", justifyContent: "center", flexDirection: "row", flexWrap: "wrap", gap: 20 }}>
                {playlists.map((track, index) => {
                    // Last.fm normaliseTrack puts album info at track.album
                    const album = track.album || {};
                    return (
                        <CarouselItem
                            key={index}
                            toptrack={track.name}
                            access_token={access_token}
                            favouritecards={favouritecards}
                            spotifyid={album.id || track.id}
                            thumbnail={album.images?.[0]?.url || track.thumbnail || ""}
                            album_name={album.name || track.album_name || track.name}
                            artist_name={album.artists?.[0]?.name || track.artist || ""}
                            total_tracks={album.total_tracks || 0}
                            release_date={album.release_date || ""}
                            album_type={album.album_type || "single"}
                            single={true}
                        />
                    );
                })}
            </View>
        </View>
    );
}

// ─── Search playlists (Last.fm doesn't have playlists, show as album cards) ──
export function FavouriteSearchPlaylists({ favouritecards, playlists, access_token }) {
    if (!playlists || playlists.length === 0) return null;
    return (
        <View key={playlists[0].name} style={{ justifyContent: "center", marginTop: 10 }}>
            <View style={{ alignItems: "center", justifyContent: "center", flexDirection: "row", flexWrap: "wrap", gap: 20 }}>
                {playlists.map((playlist, index) => (
                    <PlaylistCarouselItem
                        key={index}
                        access_token={access_token}
                        favouritecards={favouritecards}
                        playlistid={playlist.id}
                        thumbnail={playlist.images?.[0]?.url || ""}
                        playlist_name={playlist.name}
                        total_tracks={playlist.total_tracks || 0}
                        album_type={playlist.album_type || "album"}
                        artist_name={playlist.artists?.[0]?.name || ""}
                        album_name={playlist.name}
                    />
                ))}
            </View>
        </View>
    );
}

// ─── Full search results (tracks + albums + artists + playlists) ──────────────
export function FavouriteSearchAlbums({ favouritecards, albums, access_token, artists, playlists, tracks }) {
    if (!albums || albums.length === 0) return null;
    return (
        <ScrollView removeClippedSubviews={true} key={albums[0].name} style={{ marginTop: 10 }}>
            <Text style={{ marginLeft: 10, fontSize: 16 }}>Tracks</Text>
            <View style={{ alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 20 }}>
                {(tracks || []).slice(0, 13).map((track, index) => {
                    const album = track.album || {};
                    return (
                        <CarouselItem
                            key={index}
                            toptrack={track.name}
                            access_token={access_token}
                            favouritecards={favouritecards}
                            spotifyid={album.id || track.id}
                            thumbnail={album.images?.[0]?.url || track.thumbnail || ""}
                            album_name={album.name || track.album_name || track.name}
                            artist_name={album.artists?.[0]?.name || track.artist || ""}
                            total_tracks={album.total_tracks || 0}
                            release_date={album.release_date || ""}
                            album_type={album.album_type || "single"}
                            single={true}
                        />
                    );
                })}
            </View>

            <Text style={{ marginLeft: 10, fontSize: 16 }}>Albums</Text>
            <View style={{ alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 20 }}>
                {albums.slice(0, 17).map((album, index) => (
                    <CarouselItem
                        key={index}
                        toptrack={album.name}
                        access_token={access_token}
                        favouritecards={favouritecards}
                        spotifyid={album.id}
                        thumbnail={album.images?.[0]?.url || ""}
                        album_name={album.name}
                        artist_name={album.artists?.[0]?.name || ""}
                        total_tracks={album.total_tracks || 0}
                        release_date={album.release_date || ""}
                        album_type={album.album_type || "album"}
                    />
                ))}
            </View>

            <Text style={{ marginLeft: 10, fontSize: 16 }}>Artists</Text>
            <View style={{ alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 20 }}>
                {(artists || []).slice(0, 13).map((artist, index) => {
                    if (!artist.images || artist.images.length === 0) return null;
                    return (
                        <ArtistCarouselItem
                            key={index}
                            favouritecards={favouritecards}
                            artist_id={artist.artist_id}
                            thumbnail={artist.images[0].url}
                            artist_name={artist.name || artist.artist_name}
                        />
                    );
                })}
            </View>

            <Text style={{ marginLeft: 10, fontSize: 16 }}>Similar / Related</Text>
            <View style={{ alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 20 }}>
                {(playlists || []).map((playlist, index) => (
                    <PlaylistCarouselItem
                        key={index}
                        access_token={access_token}
                        favouritecards={favouritecards}
                        playlistid={playlist.id}
                        thumbnail={playlist.images?.[0]?.url || ""}
                        playlist_name={playlist.name}
                        total_tracks={playlist.total_tracks || 0}
                        album_type={playlist.album_type || "album"}
                        artist_name={playlist.artists?.[0]?.name || ""}
                        album_name={playlist.name}
                    />
                ))}
            </View>
        </ScrollView>
    );
}

// ─── Genre page results ───────────────────────────────────────────────────────
export function FavouriteGenreRecommendations({ favouritecards, artists, playlists, access_token }) {
    if (!playlists || playlists.length === 0) return null;
    return (
        <ScrollView removeClippedSubviews={true} key={playlists[0].name} style={{ marginTop: 10 }}>
            <Text style={{ marginLeft: 10, fontSize: 16 }}>Albums</Text>
            <View style={{ alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 20 }}>
                {playlists.map((playlist, index) => (
                    <PlaylistCarouselItem
                        key={index}
                        access_token={access_token}
                        favouritecards={favouritecards}
                        playlistid={playlist.id}
                        thumbnail={playlist.images?.[0]?.url || ""}
                        playlist_name={playlist.name}
                        total_tracks={playlist.total_tracks || 0}
                        album_type={playlist.album_type || "album"}
                        artist_name={playlist.artists?.[0]?.name || ""}
                        album_name={playlist.name}
                    />
                ))}
            </View>

            <Text style={{ marginLeft: 10, fontSize: 16 }}>Artists</Text>
            <View style={{ alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 20 }}>
                {(artists || []).map((artist, index) => {
                    if (!artist.images || artist.images.length === 0) return null;
                    return (
                        <ArtistCarouselItem
                            key={index}
                            favouritecards={favouritecards}
                            artist_id={artist.artist_id}
                            thumbnail={artist.images[0].url}
                            artist_name={artist.name || artist.artist_name}
                        />
                    );
                })}
            </View>
        </ScrollView>
    );
}

// ─── Horizontal carousels ─────────────────────────────────────────────────────
export function FavouriteRecommendations({ favouritecards, playlists, access_token }) {
    if (!playlists || playlists.length === 0) return null;
    return (
        <SafeAreaView style={{ flex: 1, marginTop: 10 }}>
            <View style={{ alignItems: "center", justifyContent: "center", flexDirection: "row", flexWrap: "wrap", gap: 20 }}>
                <FlatList
                    data={playlists}
                    horizontal={true}
                    renderItem={({ item, index }) => (
                        <CarouselItem
                            key={index}
                            access_token={access_token}
                            favouritecards={favouritecards}
                            spotifyid={item.album?.id || item.id}
                            thumbnail={item.album?.images?.[0]?.url || item.thumbnail || ""}
                            album_name={item.album?.name || item.album_name || item.name}
                            artist_name={item.album?.artists?.[0]?.name || item.artist || ""}
                            total_tracks={item.album?.total_tracks || 0}
                            release_date={item.album?.release_date || ""}
                            album_type={item.album?.album_type || "album"}
                        />
                    )}
                />
            </View>
        </SafeAreaView>
    );
}

export function FavouriteRecommendationsHomeScreen({ favouritecards, playlists, access_token }) {
    if (!playlists || playlists.length === 0) return null;
    return (
        <SafeAreaView style={{ flex: 1, marginTop: 10 }}>
            <View style={{ alignItems: "center", justifyContent: "center", flexDirection: "row", flexWrap: "wrap", gap: 20 }}>
                <FlatList
                    data={playlists}
                    horizontal={true}
                    renderItem={({ item, index }) => (
                        <CarouselItem
                            key={index}
                            access_token={access_token}
                            favouritecards={favouritecards}
                            spotifyid={item.id}
                            thumbnail={item.images?.[0]?.url || item.thumbnail || ""}
                            album_name={item.name || item.album_name}
                            artist_name={item.artists?.[0]?.name || item.artist || ""}
                            total_tracks={item.total_tracks || 0}
                            release_date={item.release_date || ""}
                            album_type={item.album_type || "album"}
                        />
                    )}
                />
            </View>
        </SafeAreaView>
    );
}
