import { useState } from "react"
import { View,Text, FlatList,Image, TouchableOpacity} from "react-native"
import { useLocation,useNavigate } from "react-router-native"
import NavigationFooter from "../NavigationFooter/NavigationFooter";
import TrackItem from "./TrackItem";
import AntDesign from "react-native-vector-icons/AntDesign"
import { getaudio } from "./getstreamlinks";
import TrackPlayer,{ useTrackPlayerEvents ,Event} from "react-native-track-player";

export default function Tracks({currentTrack,setCurrentTrack}){
    const location = useLocation();
    const navigate = useNavigate();
    
    const [album_tracks,setAlbumTracks] = useState(location.state);
 
    useTrackPlayerEvents([Event.PlaybackQueueEnded], async (event) => {
    
        const idx = album_tracks.findIndex(({ name }) => name === currentTrack);
        if (idx+1 > album_tracks.length){
            getaudio(album_tracks[0],setCurrentTrack)
        }
        else{
            getaudio(album_tracks[idx+1],setCurrentTrack)
        }
        
        

        
        //LOG  {"nextTrack": 1, "position": 248.849, "track": 0, "type": "playback-track-changed"}
        //console.log(event,"ji")
      });
      useTrackPlayerEvents([Event.RemoteNext], async (event) => {
    
        const idx = album_tracks.findIndex(({ name }) => name === currentTrack);
        if (idx+1 > album_tracks.length){
            getaudio(album_tracks[0],setCurrentTrack)
        }
        else{
            getaudio(album_tracks[idx+1],setCurrentTrack)
        }
        
        

        
        //LOG  {"nextTrack": 1, "position": 248.849, "track": 0, "type": "playback-track-changed"}
        console.log(event,"ji")
      });

    return(
        <View style={{flex:1,backgroundColor:"#141212"}}>
            <TouchableOpacity onPress={() =>{navigate("/")}}>
            <AntDesign name="arrowleft" style={{fontSize:30}}/>
            </TouchableOpacity>
            
 
            <View style={{justifyContent:"center",alignItems:"center",flex:0.4}}>
                <Image style={{width: 175, height: 175}} source={{uri:album_tracks[0].thumbnail}}></Image>

            </View>
            <View style={{flex:0.1,justifyContent:"center",alignItems:"center"}}>
                    <Text style={{color:"white",fontSize:20}}>{album_tracks[0].album_name}</Text>
            </View>
            <FlatList 
            data={album_tracks}
            style={{flex:1,backgroundColor:"#141212"}}
            renderItem={({item}) =><TrackItem setCurrentTrack={setCurrentTrack}  album_track={item}/>}
            />
  
            <NavigationFooter currentpage={"home"}/>
        </View>
    )

}