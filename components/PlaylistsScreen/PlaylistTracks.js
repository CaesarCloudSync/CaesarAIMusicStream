import { useEffect, useState,useCallback,useRef } from "react"
import { View,Text, FlatList,Image, TouchableOpacity,AppState} from "react-native"
import { useLocation,useNavigate } from "react-router-native"
import TrackItem from "../Tracks/TrackItem"
import AntDesign from "react-native-vector-icons/AntDesign"
import { getaudio } from "./getstreamlinks";
import TrackPlayer,{ useTrackPlayerEvents ,Event,State,useProgress,RepeatMode} from "react-native-track-player";
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import TrackProgress from "../TrackProgress/TrackProgress";
import { usePlaybackState } from 'react-native-track-player';
import ShowCurrentTrack from "../ShowCurrentTrack/ShowCurrentTrack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NavigationFooter from "../NavigationFooter/NavigationFooter";
import ShowQueue from "../ShowQueue/showqueue";

import { Modal } from "../Tracks/playlistmodal"
import { Button } from "react-native-elements";
export default function PlaylistTracks({currentTrack,setCurrentTrack,seek, setSeek}){
    const progress = useProgress();
    const location = useLocation();
    const navigate = useNavigate();
    const [trackforplaylist,setTrackForPlaylist] = useState({});
    const { position, duration } = useProgress(200);
    const playerState = usePlaybackState();
    const isPlaying = playerState === State.Playing;
    console.log(location.state)
    const [playlist_details,setPlaylistDetails] = useState(location.state.playlist_details)
    const [album_tracks,setAlbumTracks] = useState(location.state.playlist_tracks);
    const [loadingaudio,setLoadingAudio] = useState(false)
    const appState = useRef(AppState.currentState);
    const [appStateVisible, setAppStateVisible] = useState(appState.current);
    const [final_tracks,setFinalTracks] =useState([])
    const [hasNavigated,setHasNavigated] = useState([]);
    const [preload,setPreload] = useState(false);
    const [totalpromises,setTotalPromises] = useState(0);
    const [completedpromises,setCompletedPromises] = useState(0);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const handleModal = () => setIsModalVisible(() => !isModalVisible);



    const createplaylist = async () =>{
        console.log(trackforplaylist)
        await AsyncStorage.setItem(`playlist:${trackforplaylist.name}`,JSON.stringify({"playlist_name":trackforplaylist.name,"playlist_thumbnail":trackforplaylist.thumbnail,"playlist_size":1}))
        await AsyncStorage.setItem(`playlist-track:${trackforplaylist.name}-${trackforplaylist.name}`,JSON.stringify(trackforplaylist))
        navigate("/playlists")

    }

    const navartistprofile = async () =>{
        //await AsyncStorage.setItem(`artist:${album_tracks[0].artist_name}`,JSON.stringify({"artist_id":album_tracks[0].artist_id}))
        navigate("/artistprofile",{state:album_tracks})
    }
    useEffect(() =>{
        //
    },[isModalVisible])

    return(
        <View  style={{flex:1,backgroundColor:"#141212"}}>
   
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
                <Image style={{width: 175, height: 175}} source={{uri:playlist_details.playlist_thumbnail}}></Image>

            </TouchableOpacity>

            <View style={{flex:0.1,justifyContent:"center",alignItems:"center"}}>
                    <Text style={{color:"white",fontSize:20}}>{playlist_details.playlist_name}</Text>
                    <Text style={{color:"grey",fontSize:15}}>{playlist_details.playlist_size} Tracks</Text>
            </View>
            <FlatList 
            data={album_tracks}
            style={{flex:1,backgroundColor:"#141212"}}
            renderItem={({item,index}) =><TrackItem index={index} setCurrentTrack={setCurrentTrack} album_track={item} num_of_tracks={album_tracks.length} album_tracks={album_tracks} setTrackForPlaylist={setTrackForPlaylist} trackforplaylist={trackforplaylist} handleModal={handleModal}/>}
            />
            <ShowCurrentTrack tracks={true}/>
            <ShowQueue/>

            <TrackProgress  seek={seek} setSeek={setSeek}/>
  
            <NavigationFooter currentpage={"home"}/>
            <Modal isVisible={isModalVisible}>
            <Modal.Container>

                <Modal.Body>
                    <TouchableOpacity onPress={() =>{createplaylist()}} style={{height:60,justifyContent:"center",borderWidth:1,borderColor:"white",borderRadius:5,padding:5}}>
                    <   Text style={{"color":"white"}}>+ New Playlist</Text>
                    </TouchableOpacity>
                </Modal.Body>
                <Modal.Footer>
                <Button title="I agree" onPress={handleModal} />
                </Modal.Footer>
            </Modal.Container>
</Modal>
        </View>
    )

}