import { TouchableHighlight,Text,View,Image,TouchableOpacity } from "react-native"
import { useNavigate } from "react-router-native";
import Entypo from "react-native-vector-icons/Entypo"
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Gesture,GestureDetector,Swipeable } from "react-native-gesture-handler";

export default function PlaylistCard({playlist,index,setPlaylistChanged,playlistchanged,trackforplaylist}){
    //console.log(album)



    const navigate = useNavigate();
    const getalbumtracks = async (route) =>{
        console.log(playlist)
        let keys = await AsyncStorage.getAllKeys()
        const items = await AsyncStorage.multiGet(keys.filter((key) =>{return(key.includes(`playlist-track:${playlist.playlist_name}`))}))
        const playlist_tracks = items.map((item) =>{return(JSON.parse(item[1]))})
        console.log(playlist_tracks)
        navigate(route, { state: {playlist_details:playlist,playlist_tracks:playlist_tracks}});

    }
    const addtracktoplaylist = async () =>{
        
            await AsyncStorage.setItem(`playlist:${playlist.playlist_name}`,JSON.stringify({"playlist_name":playlist.playlist_name,"playlist_thumbnail":playlist.playlist_thumbnail,"playlist_size":playlist.playlist_size + 1}))
            await AsyncStorage.setItem(`playlist-track:${playlist.playlist_name}-${trackforplaylist.name}`,JSON.stringify(trackforplaylist))
            navigate("/playlists")
    
        
    }
    const removeplaylist = async () =>{
        //console.log( await AsyncStorage.multiGet(keys.filter((key) =>{return(key.includes("playlist:"))})))
        // {"playlist_name": "Jam", "playlist_size": 1, "playlist_thumbnail": "https://i.scdn.co/image/ab67616d0000b2733b9f8b18cc685e1502128aa8"} 
        await AsyncStorage.removeItem(`playlist:${playlist.playlist_name}`)
        let keys = await AsyncStorage.getAllKeys()
        await AsyncStorage.multiRemove(keys.filter((key) =>{return(key.includes(`playlist-track:${playlist.playlist_name}`))})) 
        if (playlistchanged === false){
            setPlaylistChanged(true)
        }
        else{
            setPlaylistChanged(false)
        }

    }
    return(
        <View key={index}style={{backgroundColor:"#141212",height:50,borderRadius: 5,borderWidth: 3,flexBasis:"47%",margin:5,borderColor:"#141212",flexDirection:"row",}}>
            
        <View   style={{backgroundColor:"#141212",flexDirection:"row",justifyContent:"center",alignItems:"center",flex:1}}>
            <TouchableOpacity onLongPress={() =>{removeplaylist()}} style={{flexDirection:"row",flex:1}} onPress={() =>{  if (!trackforplaylist){getalbumtracks(`/playlist-tracks`)}else{addtracktoplaylist()}}}>
            <View style={{flexDirection:"row",flex:1}}>
            <Image style={{width: 50, height: 50}} source={{uri:playlist.playlist_thumbnail}}></Image>
            <Text style={{color:"white",width:500,position:"relative",top:15,left:10}}>
                    {playlist.playlist_name} | {playlist.playlist_size} Tracks
            </Text>
  
            

            </View>
            </TouchableOpacity>




        </View>



            


       
    </View>
    )
}

/*

                <GestureDetector gesture={Gesture.Exclusive(doubleTap,longPress,singleTap)}>
                    <View  key={album_name} style={{backgroundColor:"#141212",flexDirection:favouritecards === true ? "row":"column",justifyContent:favouritecards === true ? "flex-start":"flex-start",alignItems:favouritecards === true ? "stretch": "stretch",flex:1}}>
                        <View style={{flex:favouritecards === true ? 0.5 : (favouritecards === false ? 1 : 1)}}>
                            <Image style={{width: '100%', height: '100%'}} source={{uri:thumbnail}}></Image>
                        </View>
                        <View style={{padding:10}}>
                        </View>
                        <Text style={{color:"white"}}>
                            {album[0].album_name} | {album[0].artist}
                        </Text>
                        <Text>
                            Artist: {artist_name}
                        </Text>
                        {favouritecards !== true&&
                        <View>
        
                        <Text>
                            Total Tracks: {total_tracks}
                        </Text>
                        <Text>
                            Release Date: {release_date}
                        </Text>
    
                            </View>}
        
        
                    
        
        
                    </View>
                
                        
        
            </GestureDetector>*/