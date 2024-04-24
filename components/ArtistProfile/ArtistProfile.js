import { View,Text, ScrollView, FlatList,Image,SafeAreaView,TouchableOpacity} from "react-native";
import AntDesign from "react-native-vector-icons/AntDesign"
import NavigationFooter from "../NavigationFooter/NavigationFooter";
import { useEffect, useState } from "react";
import { useLocation,useNavigate } from "react-router-native"
import TrackProgress from "../TrackProgress/TrackProgress";
//import FavouriteItem from "./FavouriteItem";
import { get_access_token } from "../access_token/getaccesstoken";
import { FavouritePlaylists,FavouriteTopTracksPlaylists} from "../HomeScreen/FavouriteRenders";
import ShowCurrentTrack from "../ShowCurrentTrack/ShowCurrentTrack";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ArtistProfile({seek, setSeek}){
    const [access_token,setAccessToken] = useState("")
    const location = useLocation();
    const navigate = useNavigate();
    const [album_tracks,setAlbumTracks] = useState(location.state);
    const [all_album_tracks,setAllAlbumTracks] = useState([]);
    const [artistThumbnail,setArtistThumbnail] = useState("");
    const [compilations,setCompilations] = useState([]);
    const [appears_on,setAppearsOn] = useState([]);
    const [top_tracks,setTopTracks] = useState([]);
    const [singles,setSingles] = useState([]);
    const [artistname,setArtistName] = useState("");

    const get_artist_thumbnail = async (headers) =>{
        const resp = await fetch(`https://api.spotify.com/v1/artists/${album_tracks[0].artist_id}`, {headers: headers})
        const feedresult = await resp.json();
        //console.log(feedresult)
        await AsyncStorage.setItem(`artist:${feedresult.name}`,JSON.stringify({"artist_id":album_tracks[0].artist_id,"artist_name":feedresult.name,"thumbnail":feedresult.images[0].url}))
        setArtistName(feedresult.name)
        setArtistThumbnail(feedresult.images[0].url)
    }
    const get_albums_compilations = async (headers) =>{
        const resp = await fetch(`https://api.spotify.com/v1/artists/${album_tracks[0].artist_id}/albums?include_groups=album,compilation,single&limit=50`, {headers: headers})
        const feedresult = await resp.json();
        let artist_items = feedresult.items
        const all_album_tracks = artist_items.filter((item) =>{return(item.album_type === "album")})
        setAllAlbumTracks(all_album_tracks)
        const compilations = artist_items.filter((item) =>{return(item.album_type === "compilation")})
        const singles = artist_items.filter((item) =>{return(item.album_type === "single")})
        //console.log(compilations)
        setSingles(singles)
        setCompilations(compilations)
    }
    const get_appears_on = async (headers) =>{
        const resp = await fetch(`https://api.spotify.com/v1/artists/${album_tracks[0].artist_id}/albums?include_groups=appears_on&limit=50`, {headers: headers})
        const feedresult = await resp.json();
        let artist_items = feedresult.items
        setAppearsOn(artist_items)

    }
    const get_top_tracks = async (headers) =>{
        const resp = await fetch(`https://api.spotify.com/v1/artists/${album_tracks[0].artist_id}/top-tracks`, {headers: headers})
        const feedresult = await resp.json()
 
        
        setTopTracks(feedresult.tracks)
        //console.log(feedresult)
    
    }
    const getall = async() => {
        const access_token = await get_access_token();
        setAccessToken(access_token)
        const headers = {Authorization: `Bearer ${access_token}`}
        await get_artist_thumbnail(headers)
        await get_albums_compilations(headers)
        await get_top_tracks(headers)
        await get_appears_on(headers)
        

        
    }

    useEffect(()=>{
        getall()
    },[])
    console.log(album_tracks[0])
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
                        <Image style={{width: 175, height: 175}} source={{uri:artistThumbnail}}></Image>
        
                    </TouchableOpacity>}
            
            <View style={{flex:0.1,justifyContent:"center",alignItems:"center"}}>
                    <Text style={{color:"white",fontSize:20}}>{artistname}</Text>
            </View>
            {/*Main Scroll Body*/}

            <ScrollView style={{flex:1,backgroundColor:"#141212"}}>
            {all_album_tracks.length > 0 && access_token !== ""  &&<View style={{flex:0.1,justifyContent:"flex-start",alignItems:"flex-start",marginLeft:20}}>
                    <Text style={{color:"white",fontSize:20}}>Albums</Text>
            </View>
            }
            {all_album_tracks.length > 0 && access_token !== ""  && <FavouritePlaylists access_token={access_token} favouritecards={true} playlists={all_album_tracks}/>}

            {top_tracks.length > 0 && access_token !== ""  &&<View style={{flex:0.1,justifyContent:"flex-start",alignItems:"flex-start",marginLeft:20}}>
                    <Text style={{color:"white",fontSize:20}}>Top Tracks</Text>
            </View>
            }
            {top_tracks.length > 0 && access_token !== ""  && <FavouriteTopTracksPlaylists access_token={access_token} favouritecards={true} playlists={top_tracks} />}             
            
            {singles.length > 0 && access_token !== ""  &&<View style={{flex:0.1,justifyContent:"flex-start",alignItems:"flex-start",marginLeft:20}}>
                    <Text style={{color:"white",fontSize:20}}>Singles</Text>
            </View>
            }
            {singles.length > 0 && access_token !== ""  && <FavouritePlaylists access_token={access_token} favouritecards={true} playlists={singles}/>}

            {compilations.length > 0 && access_token !== ""  &&                    
            <View style={{flex:0.1,justifyContent:"flex-start",alignItems:"flex-start",marginLeft:20}}>
                    <Text style={{color:"white",fontSize:20}}>Compilations</Text>
            </View>
            }
            {compilations.length > 0 && access_token !== ""  && <FavouritePlaylists access_token={access_token} favouritecards={true} playlists={compilations}/>}
            
            {appears_on.length > 0 && access_token !== ""  &&                    
            <View style={{flex:0.1,justifyContent:"flex-start",alignItems:"flex-start",marginLeft:20}}>
                    <Text style={{color:"white",fontSize:20}}>Appears On</Text>
            </View>
            }
            {appears_on.length > 0 && access_token !== ""  && <FavouritePlaylists access_token={access_token} favouritecards={true} playlists={appears_on}/>}
                                        
   




 

            </ScrollView>
                  
            <ShowCurrentTrack/>

            
                            
            <View style={{flex:0.018,backgroundColor:"#141212",justifyContent:"center",alignItems:"center"}}>
                <TrackProgress seek={seek} setSeek={setSeek}/>

            </View>


            <NavigationFooter />

        </View>
    )
}

/*
                     
 
            
            
              */

        /*
                        
                        {initialfeed.length > 0 && access_token !== ""  && <FavouritePlaylists access_token={access_token} favouritecards={true} playlists={initialfeed.slice(0,8)}/>}
                        {initialfeed.length > 0 && access_token !== ""  &&
                        <View style={{flex:1}}>
                            <Text style={{margin:15,fontSize:23,color:"white",fontWeight: 'bold'}}>Latest Playlists</Text>
                        </View>
                        }
                        {initialfeed.length > 0 && access_token !== ""  && <FavouritePlaylists access_token={access_token} favouritecards={false} playlists={initialfeed.slice(8,)}/>}
        
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