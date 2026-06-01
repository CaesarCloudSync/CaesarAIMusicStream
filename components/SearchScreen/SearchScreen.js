import { View,Text, ScrollView, FlatList,Image,TextInput, StatusBar,Pressable,TouchableOpacity, Dimensions, Keyboard} from "react-native";
import { useState,useEffect,useRef} from "react";
import { useNavigate } from "react-router-native";
import TrackProgress from "../TrackProgress/TrackProgress";
import NavigationFooter from "../NavigationFooter/NavigationFooter";
import { get_access_token } from "../access_token/getaccesstoken";
import { FavouriteAlbums, FavouriteSearchPlaylists } from "../HomeScreen/FavouriteRenders";
import AntDesign from "react-native-vector-icons/AntDesign"
import axios from "axios";
import * as MIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNetInfo} from "@react-native-community/netinfo";
import ShowCurrentTrack from "../ShowCurrentTrack/ShowCurrentTrack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FavouriteSearchAlbums } from "../HomeScreen/FavouriteRenders";
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Directions } from 'react-native-gesture-handler';
import ArtistCarouselItem from "../HomeScreen/ArtistCarouselItem";
import ShowQueue from "../ShowQueue/showqueue";
import { FavouriteTopTracksAlbums } from "../HomeScreen/FavouriteRenders";
import GenreItem from "../HomeScreen/GenreItem";
import { genreslist } from "../HomeScreen/genres";

const RenderSection = ({ title, items, onPressItem }) => {
    if (items.length === 0) return null;
    return (
        <View style={{ marginBottom: 18 }}>
            <Text style={{ color: "#b3b3b3", fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginLeft: 14, marginBottom: 8 }}>
                {title}
            </Text>
            {items.map((item, idx) => (
                <TouchableOpacity
                    key={(item.id || item.label || idx) + "-" + idx}
                    onPress={() => onPressItem(item)}
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        borderBottomWidth: idx < items.length - 1 ? 0.3 : 0,
                        borderBottomColor: "#222"
                    }}
                >
                    {item.image ? (
                        <Image
                            source={{ uri: item.image }}
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: item.type === "artist" ? 22 : 5,
                                marginRight: 14
                            }}
                        />
                    ) : (
                        <View style={{
                            width: 44,
                            height: 44,
                            borderRadius: item.type === "artist" ? 22 : 5,
                            backgroundColor: "#282828",
                            marginRight: 14,
                            justifyContent: "center",
                            alignItems: "center"
                        }}>
                            <AntDesign 
                                name={item.type === "artist" ? "user" : item.type === "album" ? "folderopen" : item.type === "playlist" ? "bars" : "sound"} 
                                style={{ color: "#b3b3b3", fontSize: 18 }}
                            />
                        </View>
                    )}
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: "white", fontSize: 15, fontWeight: "500" }} numberOfLines={1}>
                            {item.type === "track" || item.type === "album" ? item.label.split(" – ")[0] : item.label}
                        </Text>
                        <Text style={{ color: "#b3b3b3", fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                            {item.type === "track" || item.type === "album" ? item.label.split(" – ")[1] || item.type : item.type}
                        </Text>
                    </View>
                    <AntDesign name="right" style={{ color: "#555", fontSize: 12 }} />
                </TouchableOpacity>
            ))}
        </View>
    );
};

export default function Search({seek, setSeek}){
    const navigate = useNavigate();
    const netInfo = useNetInfo()
    const [text, onChangeText] = useState("")
    const [access_token,setAccessToken] = useState("");
    const [initialfeed,setInitialFeed] = useState([]);
    const [songs,setSongs] = useState([]);
    const [artists,setArtists] = useState([]);
    const [recent_artists,setRecentArtists] = useState([]);
    const [recent_removed,setRecentRemoved] = useState(false)
    const [recentalbums,setRecentAlbums] = useState([]);
    const [playlists,setPlaylists] = useState([]);
    const [tracks,setTracks] = useState([]);
    const [visibleArtistCount, setVisibleArtistCount] = useState(12);
    const [searchHistory, setSearchHistory] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const debounceRef = useRef(null);
    const textInputRef = useRef(null);

    const fling = Gesture.Fling().direction(Directions.DOWN)
    .onStart((e) => {
      setSongs([])
    });
    const createxpiration = async () =>{
        const storageExpirationTimeInMinutes = 60; // in this case, we only want to keep the data for 30min
        //console.log(storageExpirationTimeInMinutes)
        
        let dt= new Date()
        dt = new Date(dt.getTime() + storageExpirationTimeInMinutes * 60 * 1000)
    
      
    
        // store the data with expiration time in there
        await AsyncStorage.setItem(
          "storageWithExpiry",
          dt.toISOString()
        );
    }
    

    const searchsongs = async (queryOverride) =>{
        const q = queryOverride || text;
        if (!q) return;
        const headers = {Authorization: `Bearer ${access_token}`}
        const resp = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&limit=50&type=artist,album,track,playlist`, {headers: headers})
        const feedresult = await resp.json()

        const artists = feedresult.artists.items.map((artist) =>{return({"artist_id":artist.id,"images":artist.images,"name":artist.name})})
        const tracks = feedresult.tracks.items
        const result = feedresult.albums.items.map((album) =>{return({"id":album.id,"name":album.name,"images":[{"url":album.images[0].url}],"artists":[{"name":album.artists[0].name}],"total_tracks":album.total_tracks,"release_date":album.release_date,"album_type":album.album_type})})
        const playlists = feedresult.playlists.items.filter((playlist) =>{return(playlist !== null)}).map((playlist) =>{return({"id":playlist.id,"name":playlist.name,"images":[{"url":playlist.images[0].url}],"total_tracks":playlist.tracks.total,"album_type":playlist.type})})
        setPlaylists(playlists)
        setSongs(result)
        setTracks(tracks)
        setArtists(artists)
    }
    function parseISOString(s) {
        var b = s.split(/\D+/);
        return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
      }
    
    const getinitialrnbfeed = async () =>{
        const access_token = await get_access_token();
        setAccessToken(access_token)
    }
    const get_recent_artists = async () =>{
        let keys = await AsyncStorage.getAllKeys()
        const items = await AsyncStorage.multiGet(keys.filter((key) =>{return(key.includes("artist:"))}))
        setRecentArtists(items)
    }
    const get_recent_albums = async () =>{
        let keys = await AsyncStorage.getAllKeys()
        const items = await AsyncStorage.multiGet(keys.filter((key) =>{return(key.includes("album-recent-load:"))}))
        const albumsitems = items.map((item) =>{return(JSON.parse(item[1]))}).filter((item) =>{return(item !== null)})
        setRecentAlbums(albumsitems)
    }
    const loadSearchHistory = async () => {
        try {
            const raw = await AsyncStorage.getItem("search_history");
            if (raw) setSearchHistory(JSON.parse(raw));
        } catch (e) {}
    }
    const saveToHistory = async (label, type, image, itemData) => {
        try {
            const raw = await AsyncStorage.getItem("search_history");
            let hist = raw ? JSON.parse(raw) : [];
            hist = hist.filter(h => h.label !== label);
            hist.unshift({
                label,
                type,
                image: image || null,
                id: Date.now(),
                targetId: itemData?.id || null,
                album_id: itemData?.album_id || null,
                album_name: itemData?.album_name || null,
                track_name: itemData?.track_name || null,
                artist_name: itemData?.artist_name || null,
                artist_id: itemData?.artist_id || null
            });
            hist = hist.slice(0, 20); // Keep last 20
            await AsyncStorage.setItem("search_history", JSON.stringify(hist));
            setSearchHistory(hist);
        } catch (e) {}
    }
    const removeFromHistory = async (id) => {
        try {
            const updated = searchHistory.filter(h => h.id !== id);
            await AsyncStorage.setItem("search_history", JSON.stringify(updated));
            setSearchHistory(updated);
        } catch (e) {}
    }
    const handleSuggestionTap = async (s) => {
        const targetId = s.targetId || s.id;
        if (!targetId) return;
        if (s.type === "artist") {
            navigate("/artistprofile", {state: {album_tracks: [{artist_id: targetId, artist: s.label}]}});
        } else if (s.type === "album") {
            try {
                const headers = {Authorization: `Bearer ${access_token}`};
                const resp = await fetch(`https://api.spotify.com/v1/albums/${targetId}`, {headers});
                const feedresult = await resp.json();
                let album_tracks = feedresult.tracks.items.map((track) => ({
                    "album_id": feedresult.id,
                    "album_name": feedresult.name,
                    "name": track.name,
                    "id": track.id,
                    "artist": track.artists[0].name,
                    "artist_id": track.artists[0].id,
                    "thumbnail": feedresult.images?.[0]?.url || s.image,
                    "track_number": track.track_number,
                    "duration_ms": track.duration_ms
                }));
                navigate("/tracks", { state: { "album_tracks": album_tracks } });
            } catch(e) { console.log(e); }
        } else if (s.type === "track") {
            try {
                const headers = {Authorization: `Bearer ${access_token}`};
                const resp = await fetch(`https://api.spotify.com/v1/albums/${s.album_id}`, {headers});
                const feedresult = await resp.json();
                let album_tracks = feedresult.tracks.items.map((track) => ({
                    "album_id": feedresult.id,
                    "album_name": feedresult.name,
                    "name": track.name,
                    "id": track.id,
                    "artist": track.artists[0].name,
                    "artist_id": track.artists[0].id,
                    "thumbnail": feedresult.images?.[0]?.url || s.image,
                    "track_number": track.track_number,
                    "duration_ms": track.duration_ms
                }));
                navigate("/tracks", { state: { "current_single": s.track_name, "album_tracks": album_tracks } });
            } catch(e) { console.log(e); }
        } else if (s.type === "playlist") {
            try {
                const headers = {Authorization: `Bearer ${access_token}`};
                const resp = await fetch(`https://api.spotify.com/v1/playlists/${targetId}`, {headers});
                const feedresult = await resp.json();
                let playlist_tracks = feedresult.tracks.items.map((item) => {
                    const track = item.track;
                    return {
                        "album_id": track.album?.id,
                        "album_name": track.album?.name,
                        "name": track.name,
                        "id": track.id,
                        "artist": track.artists?.[0]?.name,
                        "artist_id": track.artists?.[0]?.id,
                        "thumbnail": track.album?.images?.[0]?.url || s.image,
                        "duration_ms": track.duration_ms
                    };
                });
                const playlist_details = {
                    playlist_name: feedresult.name,
                    playlist_thumbnail: feedresult.images?.[0]?.url || s.image,
                    playlist_size: playlist_tracks.length
                };
                navigate("/playlist-tracks", { state: { playlist_details, playlist_tracks } });
            } catch(e) { console.log(e); }
        }
    }
    const fetchSuggestions = async (query) => {
        if (!query || !access_token) { setSuggestions([]); return; }
        try {
            const headers = {Authorization: `Bearer ${access_token}`};
            const resp = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist,track,album,playlist&limit=50`, {headers});
            const data = await resp.json();
            const artistSugs = (data.artists?.items || []).filter(Boolean).slice(0, 12).map(a => ({
                label: a.name,
                type: "artist",
                id: a.id,
                image: a.images?.[0]?.url || null
            }));
            const trackSugs = (data.tracks?.items || []).filter(Boolean).slice(0, 10).map(t => ({
                label: `${t.name} – ${t.artists?.[0]?.name || 'Unknown Artist'}`,
                type: "track",
                id: t.id,
                image: t.album?.images?.[0]?.url || null,
                album_id: t.album?.id,
                album_name: t.album?.name,
                track_name: t.name,
                artist_name: t.artists?.[0]?.name || 'Unknown Artist',
                artist_id: t.artists?.[0]?.id || null
            }));
            const albumSugs = (data.albums?.items || []).filter(Boolean).slice(0, 20).map(al => ({
                label: `${al.name} – ${al.artists?.[0]?.name || 'Unknown Artist'}`,
                type: "album",
                id: al.id,
                image: al.images?.[0]?.url || null
            }));
            const playlistSugs = (data.playlists?.items || []).filter(Boolean).slice(0, 15).map(pl => ({
                label: pl.name,
                type: "playlist",
                id: pl.id,
                image: pl.images?.[0]?.url || null
            }));
            setSuggestions([...artistSugs, ...trackSugs, ...albumSugs, ...playlistSugs]);
        } catch (e) { setSuggestions([]); }
    }
    useEffect(() =>{
        if (netInfo.isInternetReachable === true){
            getinitialrnbfeed()
            get_recent_albums()
            get_recent_artists()
            loadSearchHistory()
        }


    },[netInfo])
    useEffect(()=>{
        get_recent_artists()
        
    },[recent_removed])
    useEffect(()=>{
        get_recent_albums()
    },[recentalbums])


    if (netInfo.isInternetReachable){
    return(
        <View style={{flex:1,backgroundColor:"#141212"}}>
            {/*Header */}
            <View style={{backgroundColor:"#141212",flexDirection:"row", paddingTop: 10, paddingBottom: 6}}>
                <View style={{flex:1, marginHorizontal: 12, flexDirection:"row"}}>
                    <View style={{backgroundColor:"white",justifyContent:"center",alignItems:"center",height:42,borderBottomLeftRadius:10,borderTopLeftRadius:10}}>
                        <AntDesign name="search1" style={{color:"black",padding:10}}/>
                    </View>
                    <TextInput
                        ref={textInputRef}
                        onSubmitEditing={() =>{ saveToHistory(text, "query"); }}
                        placeholder="Artists, songs, podcasts..."
                        placeholderTextColor={"#888"}
                        returnKeyType="search"
                        style={{
                            height: 42,
                            flex: 1,
                            borderBottomRightRadius: 10,
                            borderTopRightRadius: 10,
                            backgroundColor: "white",
                            color: "black",
                            paddingHorizontal: 10,
                        }}
                        onFocus={() => setIsSearchFocused(true)}
                        onChangeText={(t) => {
                            onChangeText(t);
                            if (debounceRef.current) clearTimeout(debounceRef.current);
                            if (t.length > 1) {
                                debounceRef.current = setTimeout(() => fetchSuggestions(t), 350);
                            } else {
                                setSuggestions([]);
                            }
                        }}
                        value={text}
                    />
                    {(text.length > 0 || isSearchFocused) && (
                        <TouchableOpacity
                            onPress={() => {
                                onChangeText("");
                                setSuggestions([]);
                                setIsSearchFocused(false);
                                Keyboard.dismiss();
                            }}
                            style={{position:"absolute", right: 10, top: 10}}
                        >
                            <AntDesign name="close" style={{color:"#555", fontSize: 18}}/>
                        </TouchableOpacity>
                    )}
                </View>
                <View style={{flex:0.13,margin:1,marginTop:4,marginRight:10}}>
                    <Image style={{borderRadius:5,width:44,height:39}} source={require('../../assets/CaesarAILogo.png')} />
                </View>
            </View>

            {/* Main Content Area */}
            {isSearchFocused || text.length > 0 ? (
                /* Inline Suggestions & Search History */
                <ScrollView 
                    key="search-active-scrollview"
                    keyboardShouldPersistTaps="handled"
                    onScrollBeginDrag={Keyboard.dismiss}
                    showsVerticalScrollIndicator={false}
                    style={{flex:1, backgroundColor:"#141212", marginTop: 8}}
                >
                    {text.length > 1 && suggestions.length > 0 ? (
                        <View key="suggestions-active-view" style={{ paddingBottom: 100 }}>
                            <RenderSection 
                                title="Artists" 
                                items={suggestions.filter(s => s.type === "artist")} 
                                onPressItem={(item) => {
                                    handleSuggestionTap(item);
                                    saveToHistory(item.label, item.type, item.image, item);
                                }}
                            />
                            <RenderSection 
                                title="Songs" 
                                items={suggestions.filter(s => s.type === "track")} 
                                onPressItem={(item) => {
                                    handleSuggestionTap(item);
                                    saveToHistory(item.label, item.type, item.image, item);
                                }}
                            />
                            <RenderSection 
                                title="Albums" 
                                items={suggestions.filter(s => s.type === "album")} 
                                onPressItem={(item) => {
                                    handleSuggestionTap(item);
                                    saveToHistory(item.label, item.type, item.image, item);
                                }}
                            />
                            <RenderSection 
                                title="Playlists" 
                                items={suggestions.filter(s => s.type === "playlist")} 
                                onPressItem={(item) => {
                                    handleSuggestionTap(item);
                                    saveToHistory(item.label, item.type, item.image, item);
                                }}
                            />
                        </View>
                    ) : text.length === 0 && searchHistory.length > 0 ? (
                        <View key="history-active-view" style={{ paddingBottom: 100 }}>
                            <View style={{flexDirection:"row", justifyContent:"space-between", alignItems:"center", paddingHorizontal:14, paddingVertical:10}}>
                                <Text style={{color:"#b3b3b3", fontSize:12, fontWeight:"700", textTransform:"uppercase", letterSpacing:0.8}}>Recent Searches</Text>
                                <TouchableOpacity onPress={async () => { await AsyncStorage.removeItem("search_history"); setSearchHistory([]); }}>
                                    <Text style={{color:"#b3b3b3", fontSize:12}}>Clear all</Text>
                                </TouchableOpacity>
                            </View>
                            {searchHistory.map((h, i) => (
                                <TouchableOpacity
                                    key={h.id + "-" + i}
                                    onPress={() => {
                                        handleSuggestionTap(h);
                                    }}
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        paddingVertical: 9,
                                        paddingHorizontal: 12,
                                        borderTopWidth: 0.5,
                                        borderTopColor: "#2a2a2a"
                                    }}
                                >
                                    {h.image ? (
                                        <Image
                                            source={{uri: h.image}}
                                            style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: h.type === "artist" ? 20 : 5,
                                                marginRight: 12
                                            }}
                                        />
                                    ) : (
                                        <View style={{width: 40, height: 40, borderRadius: 5, backgroundColor: "#333", marginRight: 12, justifyContent: "center", alignItems: "center"}}>
                                            <AntDesign name="search1" style={{color:"#555", fontSize:14}}/>
                                        </View>
                                    )}
                                    <View style={{ flex: 1 }}>
                                        <Text style={{color:"white", fontSize:14}} numberOfLines={1}>
                                            {h.type === "track" || h.type === "album" ? h.label.split(" – ")[0] : h.label}
                                        </Text>
                                        <Text style={{ color: "#b3b3b3", fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                                            {h.type === "track" || h.type === "album" ? h.label.split(" – ")[1] || h.type : h.type}
                                        </Text>
                                    </View>
                                    <TouchableOpacity onPress={() => removeFromHistory(h.id)} hitSlop={{top:10,bottom:10,left:10,right:10}}>
                                        <AntDesign name="close" style={{color:"#666", fontSize:14}}/>
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : null}
                </ScrollView>
            ) : (
                /* Default View (Recent Artists, Browse All Genres) */
                <ScrollView key="search-default-scrollview" removeClippedSubviews={true} style={{flex:1,backgroundColor:"#141212"}}>
                    {recentalbums.length > 0 && access_token !== ""  && 
                    <View>
                    <Text  style={{marginLeft:10}}>Recent Albums</Text>
                    <FavouriteAlbums access_token={access_token} favouritecards={true} playlists={recentalbums} recentalbums={recentalbums} setRecentAlbums={setRecentAlbums}/>
                    </View>}

                    {recent_artists.length > 0 && access_token !== "" && (
                        <View style={{width: "100%", marginBottom: 6, paddingHorizontal: 14}}>
                            <View style={{flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, marginTop: 8}}>
                                <Text style={{color: "white", fontSize: 17, fontWeight: "bold"}}>Recent Artists</Text>
                                {visibleArtistCount < recent_artists.length ? (
                                    <Text
                                        onPress={() => setVisibleArtistCount(c => c + 6)}
                                        style={{color: "#b3b3b3", fontSize: 13, fontWeight: "600"}}
                                    >
                                        See {Math.min(6, recent_artists.length - visibleArtistCount)} more
                                    </Text>
                                ) : visibleArtistCount > 4 ? (
                                    <Text
                                        onPress={() => setVisibleArtistCount(4)}
                                        style={{color: "#b3b3b3", fontSize: 13, fontWeight: "600"}}
                                    >
                                        Show less
                                    </Text>
                                ) : null}
                            </View>
                            <View style={{flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between"}}>
                                {recent_artists.slice(0, visibleArtistCount).map((artisttuple, index) => {
                                    let artistitems = JSON.parse(artisttuple[1]);
                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            onPress={() => navigate("/artistprofile", {state: {album_tracks: [{artist_id: artistitems.artist_id, artist: artistitems.artist_name}]}})}
                                            onLongPress={async () => {
                                                await AsyncStorage.removeItem(`artist:${artistitems.artist_name}`);
                                                setRecentRemoved(prev => !prev);
                                            }}
                                            style={{
                                                width: "46%",
                                                height: 65,
                                                borderRadius: 5,
                                                borderWidth: 3,
                                                borderColor: "#141212",
                                                margin: 5,
                                                backgroundColor: "#141212",
                                                flexDirection: "row",
                                                alignItems: "stretch",
                                                overflow: "hidden",
                                            }}
                                        >
                                            <View style={{flex: 0}}>
                                                <Image
                                                    source={artistitems.thumbnail ? {uri: artistitems.thumbnail} : require('../../assets/CaesarAILogo.png')}
                                                    style={{borderRadius: 3, width: 60, height: "100%"}}
                                                />
                                            </View>
                                            <Text style={{color: "white", marginLeft: 10, width: 90, alignSelf: "center", fontSize: 13}} numberOfLines={2}>
                                                {artistitems.artist_name}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    )}
                        
                    {initialfeed.length > 0 && access_token !== ""  && 
                    <View>
                    <Text  style={{marginLeft:10}}>Latest Albums</Text>
                    <FavouriteAlbums access_token={access_token} favouritecards={true} playlists={initialfeed}/>
                    </View>}

                    {access_token !== "" && (
                        <View style={{flex: 1, paddingHorizontal: 12, marginTop: 20, marginBottom: 30}}>
                            <Text style={{
                                marginHorizontal: 6,
                                marginBottom: 16,
                                fontSize: 22,
                                color: "white",
                                fontWeight: "bold"
                            }}>
                                Browse All Genres
                            </Text>
                            <View style={{
                                flexDirection: "row",
                                flexWrap: "wrap",
                                justifyContent: "space-between",
                                paddingHorizontal: 2
                            }}>
                                {genreslist.map((genre, idx) => (
                                    <GenreItem key={idx} genre={genre} />
                                ))}
                            </View>
                        </View>
                    )}
                </ScrollView>
            )}

            <ShowCurrentTrack searchscreen={true}/>
            <ShowQueue/>
            <TrackProgress seek={seek} setSeek={setSeek}/>
            <NavigationFooter currentpage={"search"}/>
            
          


 
        </View>
    )}
    else{
        return(
            <View style={{flex:1,backgroundColor:"#141212"}}>
                {/*Header */}
                <View  style={{flex:0.08,backgroundColor:"green",flexDirection:"row",backgroundColor:"#141212"}}>
                    <View style={{flex:1,margin:10}}>
                    <Text style={{fontSize:20}}>CaesarAIMusicStream</Text>
                    
                    </View>
                    <View style={{flex:0.13,margin:10}}>
                    <Image style={{borderRadius:5,width:44,height:39}} source={require('../../assets/CaesarAILogo.png')} />
                    </View>

                </View>
                {/* No Internet Main Body */}
                <View style={{flex:1,backgroundColor:"#141212",justifyContent:"center",alignItems:"center"}}>
                    <Text style={{fontSize:30}}>No Internet Connection</Text>
                    <Text>
                    Play your Downloads
                    </Text>
                </View>

                {/*Song Progress Tracker */}
                <ShowCurrentTrack searchscreen={true}/>
                <ShowQueue/>
                <TrackProgress seek={seek} setSeek={setSeek}/>

              

                {/*Navigation Footer*/}
                <NavigationFooter currentpage={"search"}/>

            </View>
        )
        
    }
}