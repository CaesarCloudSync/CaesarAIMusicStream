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

    const get_artist_thumbnail = async (headers) =>{
        const resp = await fetch(`https://api.spotify.com/v1/search?q=artist:"${encodeURIComponent(album_tracks[0].artist)}"&type=artist&limit=20`, {headers: headers})
        const feedresult = await resp.json();
        console.log(feedresult)
        const artist = feedresult.artists.items.find((artist) => artist.name.toLowerCase() === album_tracks[0].artist.toLowerCase())
        await AsyncStorage.setItem(`artist:${artist.name}`,JSON.stringify({"artist_id":artist.id,"artist_name":artist.name,"thumbnail":artist.images[0].url}))
        setArtistName(artist.name)
        setArtistThumbnail(artist.images[0].url)
    }
function processAlbums(items, artistName, sortOrder = "desc", albumType = "album") {
  // normalize for safe comparisons
  const target = artistName.toLowerCase().trim();

  // keep only albums of selected type AND matching artist
  const filtered = items.filter(item =>
    item.album_type === albumType &&
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

    const get_albums_compilations = async (headers) =>{
        const resp = await fetch(`https://api.spotify.com/v1/search?q=artist:"${encodeURIComponent(album_tracks[0].artist)}"&type=album&limit=50`, {headers: headers})
        const feedresult = await resp.json();
        let artist_items = feedresult.albums.items
        const cleanedAlbums = processAlbums(feedresult.albums.items, album_tracks[0].artist, "desc","album");
        const cleanedSingles = processAlbums(feedresult.albums.items, album_tracks[0].artist, "desc","single");
        setAllAlbumTracks(cleanedAlbums)
        //const compilations = artist_items.filter((item) =>{return(item.album_type === "compilation")})
        //const singles = artist_items.filter((item) =>{return(item.album_type === "single")})
        //console.log(compilations)
        setSingles(cleanedSingles)
        //setCompilations(compilations)
    }
    const get_appears_on = async (headers) =>{
        const resp = await fetch(`https://api.spotify.com/v1/artists/${album_tracks[0].artist_id}/albums?include_groups=appears_on&limit=50`, {headers: headers})
        const feedresult = await resp.json();
        let artist_items = feedresult.items
        //setAppearsOn(artist_items)

    }
    const get_top_tracks = async (headers) =>{
        console.log(album_tracks[0].artist)
        
        const resp = await fetch(`https://api.spotify.com/v1/search?q=artist:"${encodeURIComponent(album_tracks[0].artist)}"&type=track&limit=20`, {headers: headers})
        const feedresult = await resp.json()
        console.log(feedresult)
 
        
        setTopTracks(feedresult.tracks.items)
        //console.log(feedresult)
    
    }
    const getall = async() => {
        const access_token = await get_access_token();
        setAccessToken(access_token)
        const headers = {Authorization: `Bearer ${access_token}`}
        await get_artist_thumbnail(headers)
        await get_albums_compilations(headers)
        await get_top_tracks(headers)
        //await get_appears_on(headers)
        

        
    }

    useEffect(()=>{
        getall()
    },[])
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