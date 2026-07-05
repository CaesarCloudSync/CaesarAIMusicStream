import { View,Text, ScrollView, FlatList,Image,SafeAreaView,TouchableOpacity} from "react-native";
import AntDesign from "react-native-vector-icons/AntDesign"
import NavigationFooter from "../NavigationFooter/NavigationFooter";
import { useEffect, useState } from "react";
import { useLocation,useNavigate } from "react-router-native"
import TrackProgress from "../TrackProgress/TrackProgress";
//import FavouriteItem from "./FavouriteItem";
import { get_access_token } from "../access_token/getaccesstoken";
import { FavouriteAlbums,FavouriteTopTracksAlbums} from "../HomeScreen/FavouriteRenders";
import ShowCurrentTrack from "../ShowCurrentTrack/ShowCurrentTrack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ShowQueue from "../ShowQueue/showqueue";
export default function ArtistProfile({seek, setSeek}){
    const [access_token,setAccessToken] = useState("")
    const location = useLocation();
    const navigate = useNavigate();
    const [album_tracks,setAlbumTracks] = useState(location.state?.album_tracks);
    const [all_album_tracks,setAllAlbumTracks] = useState([]);
    const [artistThumbnail,setArtistThumbnail] = useState("");
    const [compilations,setCompilations] = useState([]);
    const [appears_on,setAppearsOn] = useState([]);
    const [top_tracks,setTopTracks] = useState([]);
    const [singles,setSingles] = useState([]);
    const [artistname,setArtistName] = useState("");

    const get_artist_thumbnail = async (headers) => {
        try {
            if (!album_tracks || album_tracks.length === 0) return;
            const artistId = album_tracks[0].artist_id;
            let artist = null;

            if (artistId) {
                console.log("Fetching artist by ID:", artistId);
                const resp = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, { headers: headers });
                if (resp.ok) {
                    artist = await resp.json();
                }
            }

            // Fallback search if ID fetch failed or returned nothing
            if (!artist || !artist.id) {
                console.log("Fallback search for artist:", album_tracks[0].artist);
                const resp = await fetch(`https://api.spotify.com/v1/search?q=artist:"${encodeURIComponent(album_tracks[0].artist)}"&type=artist&limit=20`, { headers: headers });
                const feedresult = await resp.json();
                if (feedresult && feedresult.artists && feedresult.artists.items && feedresult.artists.items.length > 0) {
                    artist = feedresult.artists.items.find(
                        (a) => a.name.toLowerCase() === album_tracks[0].artist.toLowerCase()
                    ) || feedresult.artists.items[0];
                }
            }

            if (artist) {
                const artistNameVal = artist.name || album_tracks[0].artist;
                const thumbnailUrlVal = (artist.images && artist.images[0]) ? artist.images[0].url : "";
                
                await AsyncStorage.setItem(
                    `artist:${artistNameVal}`,
                    JSON.stringify({ "artist_id": artist.id, "artist_name": artistNameVal, "thumbnail": thumbnailUrlVal })
                );
                setArtistName(artistNameVal);
                setArtistThumbnail(thumbnailUrlVal);
            } else {
                setArtistName(album_tracks[0].artist);
            }
        } catch (err) {
            console.error("Error in get_artist_thumbnail:", err);
            if (album_tracks && album_tracks[0]) {
                setArtistName(album_tracks[0].artist);
            }
        }
    };

function processAlbums(items, artistName, sortOrder = "desc", albumType = "album") {
  // normalize for safe comparisons
  const target = artistName.toLowerCase().trim();

  // keep only albums of selected type AND matching artist
  const filtered = items.filter(item =>
    item &&
    item.album_type === albumType &&
    item.artists &&
    item.artists.some(a => a.name.toLowerCase().trim() === target)
  );

  // remove duplicates by album name
  const uniqueAlbums = Array.from(
    new Map(filtered.map(album => [album.name.toLowerCase(), album])).values()
  );

  // sort by release date
  uniqueAlbums.sort((a, b) => {
    const dateA = new Date(a.release_date);
    const dateB = new Date(b.release_date);
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  return uniqueAlbums;
}

    const get_albums_compilations = async (headers) => {
        try {
            if (!album_tracks || album_tracks.length === 0) return;
            const artistId = album_tracks[0].artist_id;
            let items = [];

            if (artistId) {
                console.log("Fetching albums by artist ID:", artistId);
                const resp = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums?limit=50&include_groups=album,single`, { headers: headers });
                if (resp.ok) {
                    const data = await resp.json();
                    items = data.items || [];
                }
            }

            // Fallback search if ID fetch failed or returned nothing
            if (items.length === 0) {
                console.log("Fallback search for albums by artist name:", album_tracks[0].artist);
                const resp = await fetch(`https://api.spotify.com/v1/search?q=artist:"${encodeURIComponent(album_tracks[0].artist)}"&type=album&limit=50`, { headers: headers });
                const feedresult = await resp.json();
                items = (feedresult && feedresult.albums && feedresult.albums.items) ? feedresult.albums.items : [];
            }

            const cleanedAlbums = processAlbums(items, album_tracks[0].artist, "desc", "album");
            const cleanedSingles = processAlbums(items, album_tracks[0].artist, "desc", "single");
            setAllAlbumTracks(cleanedAlbums);
            setSingles(cleanedSingles);
        } catch (err) {
            console.error("Error in get_albums_compilations:", err);
        }
    };

    const get_appears_on = async (headers) => {
        try {
            if (!album_tracks || album_tracks.length === 0) return;
            const artistId = album_tracks[0].artist_id;
            if (!artistId) return;
            const resp = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=appears_on&limit=50`, { headers: headers });
            if (resp.ok) {
                const feedresult = await resp.json();
                let artist_items = feedresult.items || [];
                //setAppearsOn(artist_items)
            }
        } catch (err) {
            console.error("Error in get_appears_on:", err);
        }
    };

    const get_top_tracks = async (headers) => {
        try {
            if (!album_tracks || album_tracks.length === 0) return;
            const artistId = album_tracks[0].artist_id;
            let tracks = [];

            if (artistId) {
                console.log("Fetching top tracks by artist ID:", artistId);
                const resp = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, { headers: headers });
                if (resp.ok) {
                    const data = await resp.json();
                    tracks = data.tracks || [];
                }
            }

            // Fallback search if ID fetch failed or returned nothing
            if (tracks.length === 0) {
                console.log("Fallback search for top tracks by artist name:", album_tracks[0].artist);
                const resp = await fetch(`https://api.spotify.com/v1/search?q=artist:"${encodeURIComponent(album_tracks[0].artist)}"&type=track&limit=20`, { headers: headers });
                const feedresult = await resp.json();
                tracks = (feedresult && feedresult.tracks && feedresult.tracks.items) ? feedresult.tracks.items : [];
            }

            setTopTracks(tracks);
        } catch (err) {
            console.error("Error in get_top_tracks:", err);
        }
    };

    const getall = async () => {
        if (!album_tracks || album_tracks.length === 0) return;
        const access_token = await get_access_token();
        setAccessToken(access_token);
        const headers = { Authorization: `Bearer ${access_token}` };
        await get_artist_thumbnail(headers);
        await get_albums_compilations(headers);
        await get_top_tracks(headers);
    };

    useEffect(() => {
        getall();
    }, []);
    //console.log(album_tracks[0])
    return(
        <View style={{flex:1,backgroundColor:"#141212"}}>
            {/*Header */}
            <View style={{flexDirection:"row"}}>
            <TouchableOpacity style={{flex:1}} onPress={() =>{navigate(-1)}}>
            <AntDesign name="arrowleft" style={{fontSize:30}}/>
            </TouchableOpacity>
    
            </View>
            {artistThumbnail !== ""&&
                        <TouchableOpacity style={{justifyContent:"center",alignItems:"center",flex:0.4}}>
                        <Image style={{borderRadius:5,width: 175, height: 175}} source={{uri:artistThumbnail}}></Image>
        
                    </TouchableOpacity>}
            
            <View style={{flex:0.1,justifyContent:"center",alignItems:"center"}}>
                    <Text style={{color:"white",fontSize:20}}>{artistname}</Text>
            </View>
            {/*Main Scroll Body*/}

            <ScrollView removeClippedSubviews={true} style={{flex:1,backgroundColor:"#141212"}}>
            {all_album_tracks.length > 0 && access_token !== ""  &&<View style={{flex:0.1,justifyContent:"flex-start",alignItems:"flex-start",marginLeft:20}}>
                    <Text style={{color:"white",fontSize:20}}>Albums</Text>
            </View>
            }
            {all_album_tracks.length > 0 && access_token !== ""  && <FavouriteAlbums access_token={access_token} favouritecards={true} playlists={all_album_tracks}/>}

            {top_tracks.length > 0 && access_token !== ""  &&<View style={{flex:0.1,justifyContent:"flex-start",alignItems:"flex-start",marginLeft:20}}>
                    <Text style={{color:"white",fontSize:20}}>Top Tracks</Text>
            </View>
            }
            {top_tracks.length > 0 && access_token !== ""  && <FavouriteTopTracksAlbums access_token={access_token} favouritecards={true} playlists={top_tracks} />}             
            
            {singles.length > 0 && access_token !== ""  &&<View style={{flex:0.1,justifyContent:"flex-start",alignItems:"flex-start",marginLeft:20}}>
                    <Text style={{color:"white",fontSize:20}}>Singles</Text>
            </View>
            }
            {singles.length > 0 && access_token !== ""  && <FavouriteAlbums access_token={access_token} favouritecards={true} playlists={singles}/>}

            {compilations.length > 0 && access_token !== ""  &&                    
            <View style={{flex:0.1,justifyContent:"flex-start",alignItems:"flex-start",marginLeft:20}}>
                    <Text style={{color:"white",fontSize:20}}>Compilations</Text>
            </View>
            }
            {compilations.length > 0 && access_token !== ""  && <FavouriteAlbums access_token={access_token} favouritecards={true} playlists={compilations}/>}
            
            {appears_on.length > 0 && access_token !== ""  &&                    
            <View style={{flex:0.1,justifyContent:"flex-start",alignItems:"flex-start",marginLeft:20}}>
                    <Text style={{color:"white",fontSize:20}}>Appears On</Text>
            </View>
            }
            {appears_on.length > 0 && access_token !== ""  && <FavouriteAlbums access_token={access_token} favouritecards={true} playlists={appears_on}/>}
                                        
   




 

            </ScrollView>
                  
            <ShowCurrentTrack/>
            <ShowQueue/>


            
                            
            <View style={{flex:0.010,backgroundColor:"#141212",justifyContent:"center",alignItems:"center"}}>
                <TrackProgress seek={seek} setSeek={setSeek}/>

            </View>


            <NavigationFooter />

        </View>
    )
}

/*
                     
 
            
            
              */

        /*
                        
                        {initialfeed.length > 0 && access_token !== ""  && <FavouriteAlbums access_token={access_token} favouritecards={true} playlists={initialfeed.slice(0,8)}/>}
                        {initialfeed.length > 0 && access_token !== ""  &&
                        <View style={{flex:1}}>
                            <Text style={{margin:15,fontSize:23,color:"white",fontWeight: 'bold'}}>Latest Playlists</Text>
                        </View>
                        }
                        {initialfeed.length > 0 && access_token !== ""  && <FavouriteAlbums access_token={access_token} favouritecards={false} playlists={initialfeed.slice(8,)}/>}
        
                        {initialfeed.length > 0 && access_token !== ""  && 
                        <View style={{flex:1}}>
                            <Text style={{margin:15,fontSize:23,color:"white",fontWeight: 'bold'}}>Latest RnB and HipHop</Text>
                        </View>
                        }
                        
                        {top_tracks.length > 0 && access_token !== ""  && 
                        top_tracks.map((rnbcarousel) =>{
                            return(
                                <FavouriteRecommendations access_token={access_token}  playlists={rnbcarousel}/>
                            )
                        })
        
                        }
                        {initialhiphop.length > 0 && access_token !== "" && <View style={{flex:1}}>
                            <Text style={{margin:15,fontSize:23,color:"white",fontWeight: 'bold'}}>Latest HipHop</Text>
                        </View>}
                        {initialhiphop.length > 0 && access_token !== ""   && 
                        initialhiphop.map((hiphopcarousel) =>{
                            return(
                                <FavouriteRecommendations access_token={access_token}  playlists={hiphopcarousel}/>
                            )
                        })
        
                        } */