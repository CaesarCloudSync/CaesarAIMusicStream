import { useEffect, useState,useCallback,useRef } from "react"
import { View,Text, FlatList,Image, TouchableOpacity,AppState} from "react-native"
import { useLocation,useNavigate } from "react-router-native"
import TrackItem from "./TrackItem";
import AntDesign from "react-native-vector-icons/AntDesign"
import { getaudio } from "./getstreamlinks";
import TrackPlayer,{ useTrackPlayerEvents ,Event,State,useProgress,RepeatMode} from "react-native-track-player";
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import TrackProgress from "../TrackProgress/TrackProgress";
import { usePlaybackState } from 'react-native-track-player';
import ShowCurrentTrack from "../ShowCurrentTrack/ShowCurrentTrack";
import { getstreaminglink } from "./getstreamlinks";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NavigationFooter from "../NavigationFooter/NavigationFooter";
import { ImageManipulator } from 'expo';
export default function Tracks({currentTrack,setCurrentTrack,seek, setSeek}){
    const progress = useProgress();
    const location = useLocation();
    const navigate = useNavigate();
    const { position, duration } = useProgress(200);
    const playerState = usePlaybackState();
    const isPlaying = playerState === State.Playing;
    const [album_tracks,setAlbumTracks] = useState(location.state);
    const [loadingaudio,setLoadingAudio] = useState(false)
    const appState = useRef(AppState.currentState);
    const [appStateVisible, setAppStateVisible] = useState(appState.current);
    const [final_tracks,setFinalTracks] =useState([])
    const [hasNavigated,setHasNavigated] = useState([]);
    const [preload,setPreload] = useState(false);
    const [totalpromises,setTotalPromises] = useState(0);
    const [completedpromises,setCompletedPromises] = useState(0);

    const setcurrentalbumtracks = async () =>{
        await AsyncStorage.setItem("current-tracks",JSON.stringify(album_tracks))
    }
    useEffect(() =>{
        setcurrentalbumtracks()
    },[])




    const navartistprofile = async () =>{
        //await AsyncStorage.setItem(`artist:${album_tracks[0].artist_name}`,JSON.stringify({"artist_id":album_tracks[0].artist_id}))
        navigate("/artistprofile",{state:album_tracks})
    }

    return(
        <View style={{flex:1,backgroundColor:"#141212"}}>
            <View style={{flexDirection:"row"}}>
            <TouchableOpacity style={{flex:1}} onPress={() =>{navigate(-1)}}>
            <AntDesign name="arrowleft" style={{fontSize:30}}/>
            </TouchableOpacity>
            {loadingaudio === true &&
            <View >

            
            <View style={{width:50,height:3,backgroundColor:"white"}}>
            <View style={{width:`${(completedpromises/totalpromises)*100}%`,height:3,backgroundColor:"blue"}}></View>
            </View>
            <Text style={{fontSize:10,justifyContent:"flex-end"}}>{completedpromises}/{totalpromises}</Text>
            </View>
                      }
            </View>

            
 
            <TouchableOpacity onPress={() =>{navartistprofile()}} style={{justifyContent:"center",alignItems:"center",flex:0.4}}>
                <Image style={{width: 175, height: 175}} source={{uri:album_tracks[0].thumbnail}}></Image>

            </TouchableOpacity>

            <View style={{flex:0.1,justifyContent:"center",alignItems:"center"}}>
                    <Text style={{color:"white",fontSize:20}}>{album_tracks[0].album_name}</Text>
            </View>
            <FlatList 
            data={album_tracks}
            style={{flex:1,backgroundColor:"#141212"}}
            renderItem={({item,index}) =><TrackItem index={index} setCurrentTrack={setCurrentTrack} album_track={item} num_of_tracks={album_tracks.length} />}
            />
            <ShowCurrentTrack tracks={true}/>
            <TrackProgress  seek={seek} setSeek={setSeek}/>
  
            <NavigationFooter currentpage={"home"}/>
        </View>
    )

}