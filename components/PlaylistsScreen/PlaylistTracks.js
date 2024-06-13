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

import { requestGalleryWithPermission } from "../Picker/pickerhelper"
import Feather from "react-native-vector-icons/Feather"
import { TextInput } from "react-native-gesture-handler"
import PlaylistModal from "../PlaylistModal/playlistmodal"
export default function PlaylistTracks({currentTrack,setCurrentTrack,seek, setSeek}){
    const progress = useProgress();
    const location = useLocation();
    const navigate = useNavigate();
    const [trackforplaylist,setTrackForPlaylist] = useState({});
    const [editingplaylistname,setEditingPlaylistName] = useState(false);
    const { position, duration } = useProgress(200);
    const playerState = usePlaybackState();
    const isPlaying = playerState === State.Playing;
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
    const [isTyping,setIsTyping] = useState(false);
    const [userinput,setUserInput] = useState("");
    const [playlisttrackremoved,setPlaylistTrackRemoved] = useState(false)
    
    const handleModal = () => setIsModalVisible(() => !isModalVisible);




    const navartistprofile = async () =>{
        //await AsyncStorage.setItem(`artist:${album_tracks[0].artist_name}`,JSON.stringify({"artist_id":album_tracks[0].artist_id}))
        navigate("/artistprofile",{state:album_tracks})
    }
    const editplaylistname = async () =>{


     

        await AsyncStorage.setItem(`playlist:${userinput}`,JSON.stringify({"playlist_name":userinput,"playlist_thumbnail":playlist_details.playlist_thumbnail,"playlist_size":playlist_details.playlist_size}))
        let new_playlist_tracks = album_tracks.map((item) =>{return([ `playlist-track:${userinput}-${item.name}`,JSON.stringify(item)])})
        console.log(new_playlist_tracks)
        await AsyncStorage.multiSet(new_playlist_tracks)
        await AsyncStorage.removeItem(`playlist:${playlist_details.playlist_name}`)
        await AsyncStorage.multiRemove(album_tracks.map((item) =>{return(`playlist-track:${playlist_details.playlist_name}-${item.name}`)}))
        playlist_details.playlist_name = userinput
        setPlaylistDetails(playlist_details)
        setIsTyping(false)
        setEditingPlaylistName(false);

    }
    const getplaylist = async () =>{
        let keys = await AsyncStorage.getAllKeys()
        const items = await AsyncStorage.multiGet(keys.filter((key) =>{return(key.includes(`playlist-track:${playlist_details.playlist_name}`))}))
        const playlist_tracks = items.map((item) =>{return(JSON.parse(item[1]))})
        const items_order = await AsyncStorage.multiGet(keys.filter((key) =>{return(key.includes(`playlist-track-order:${playlist_details.playlist_name}`))}))
        const playlist_tracks_order = items_order.map((item) =>{return(JSON.parse(item[1]))})
        //console.log(playlist_tracks_order)
        function customSort(a, b) {
            //console.log(album_order)
            const orderA = playlist_tracks_order.find(item => item.name === a.name).order;
    
            const orderB = playlist_tracks_order.find(item => item.name === b.name).order;
        
            return orderA - orderB;
        }

       
        playlist_tracks.sort(customSort);
        //console.log(final_track_fin)
        setAlbumTracks(playlist_tracks)
        let playlist_detts = await AsyncStorage.getItem(`playlist:${playlist_details.playlist_name}`)

        setPlaylistDetails(playlist_details)
    }
    useEffect(() =>{
        getplaylist()
    },[playlisttrackremoved])
    const setthumbnailimage = async () =>{
        const response = await requestGalleryWithPermission();
        await AsyncStorage.setItem(`playlist:${playlist_details.playlist_name}`,JSON.stringify({"playlist_name":playlist_details.playlist_name,"playlist_thumbnail":response["uri"],"playlist_size":playlist_details.playlist_size}))
        setPlaylistDetails({...playlist_details,playlist_thumbnail: response["uri"]})
    }

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

            
 
            <TouchableOpacity onLongPress={() =>{setthumbnailimage()}} style={{justifyContent:"center",alignItems:"center",flex:0.4}}>
                <Image style={{width: 175, height: 175}} source={{uri:playlist_details.playlist_thumbnail}}></Image>

            </TouchableOpacity>

            <View style={{flex:editingplaylistname === false ? 0.1:isTyping ?0.5: 0.2,justifyContent:"center",alignItems:"center"}}>
                    <View style={{flexDirection:"row"}}>
                        {editingplaylistname === false ?
                        <Text style={{color:"white",fontSize:20}}>{playlist_details.playlist_name}</Text>:
                        <TextInput onSubmitEditing={() =>{editplaylistname()}} onTouchStart={() =>{setIsTyping(true)}} onEndEditing={() =>{setIsTyping(false)}} style={{width:150}} placeholder="Enter New Playlist" onChangeText={(text) =>{setUserInput(text)}}/>}
                        {editingplaylistname === false ?
                                                <TouchableOpacity onPress={() =>{setEditingPlaylistName(true)}}>
                                                <Feather style={{top:5,left:3}} size={17} name="edit-2"></Feather>
                                            </TouchableOpacity>:
                                <TouchableOpacity style={{top:13}} onPress={() =>{setEditingPlaylistName(false);setIsTyping(false)}}>
                                    <Text>x</Text></TouchableOpacity>}

                    </View>
                    <Text style={{color:"grey",fontSize:15}}>{playlist_details.playlist_size} Tracks</Text>
            </View>
            <FlatList 
            data={album_tracks}
            style={{flex:1,backgroundColor:"#141212"}}
            renderItem={({item,index}) =><TrackItem index={index} setCurrentTrack={setCurrentTrack} album_track={item} num_of_tracks={album_tracks.length} album_tracks={album_tracks} setTrackForPlaylist={setTrackForPlaylist} playlist_details={playlist_details} handleModal={handleModal} playlisttrackremoved={playlisttrackremoved} setPlaylistTrackRemoved={setPlaylistTrackRemoved} />}
            />
            <ShowCurrentTrack tracks={true}/>
            <ShowQueue/>

            <TrackProgress  seek={seek} setSeek={setSeek}/>
  
            <NavigationFooter currentpage={"home"}/>
            <PlaylistModal isModalVisible={isModalVisible} setIsModalVisible={setIsModalVisible} trackforplaylist={trackforplaylist}/>

        </View>
    )

}