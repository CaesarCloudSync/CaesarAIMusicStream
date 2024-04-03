import { useEffect, useState } from "react"
import { View,Text, FlatList,Image, TouchableOpacity} from "react-native"
import { useLocation,useNavigate } from "react-router-native"
import NavigationFooter from "../NavigationFooter/NavigationFooter";
import TrackItem from "./TrackItem";
import AntDesign from "react-native-vector-icons/AntDesign"
import { getaudio } from "./getstreamlinks";
import TrackPlayer,{ useTrackPlayerEvents ,Event,State,useProgress} from "react-native-track-player";
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import TrackProgress from "../TrackProgress/TrackProgress";
export default function Tracks({currentTrack,setCurrentTrack,seek, setSeek}){
    const location = useLocation();
    const navigate = useNavigate();
    const { position, duration } = useProgress(200);

    const [album_tracks,setAlbumTracks] = useState(location.state);
    const [loadingaudio,setLoadingAudio] = useState(false)

    useTrackPlayerEvents([Event.PlaybackTrackChanged], async (event) => {
        if (event.position > 100){
            const idx = album_tracks.findIndex(({ name }) => name === currentTrack);
            if (idx+1 > album_tracks.length){
                getaudio(album_tracks[0],setCurrentTrack)
            }
            else{
                getaudio(album_tracks[idx+1],setCurrentTrack)
            }
            highlightMusicIcon()
         
        }
    
        // "react-native-track-player": "^3.2.0",

        
        //LOG  {"nextTrack": 1, "position": 248.849, "track": 0, "type": "playback-track-changed"}
        //console.log(event,"ji")
        //console.log(prevduration,"dur")
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
        //console.log(event,"ji")
      });
    
    const highlightMusicIcon = () =>{
        setLoadingAudio(true)
        setTimeout(() => {
            setLoadingAudio(false)
          }, 6000);
    }

    return(
        <View style={{flex:1,backgroundColor:"#141212"}}>
            <View style={{flexDirection:"row"}}>
            <TouchableOpacity style={{flex:1}} onPress={() =>{navigate("/")}}>
            <AntDesign name="arrowleft" style={{fontSize:30}}/>
            </TouchableOpacity>
            {loadingaudio === true &&
            <FontAwesome5 name="music" style={{color:"blue",fontSize:20,flex:0.08,margin:10}}/>
                      }
            </View>

            
 
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
            onTouchEnd={() =>{highlightMusicIcon()}}
            />
            <TrackProgress seek={seek} setSeek={setSeek}/>
  
            <NavigationFooter currentpage={"home"}/>
        </View>
    )

}