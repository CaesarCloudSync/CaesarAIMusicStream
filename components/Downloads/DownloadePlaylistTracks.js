import { useEffect, useState,useCallback,useRef } from "react"
import { View,Text, FlatList,Image, TouchableOpacity,AppState} from "react-native"
import { useLocation,useNavigate } from "react-router-native"
import TrackItem from "../Tracks/TrackItem"
import AntDesign from "react-native-vector-icons/AntDesign"
import TrackPlayer,{ useTrackPlayerEvents ,Event,State,useProgress,RepeatMode} from "react-native-track-player";
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import TrackProgress from "../TrackProgress/TrackProgress";
import { usePlaybackState } from 'react-native-track-player';
import ShowCurrentTrack from "../ShowCurrentTrack/ShowCurrentTrack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NavigationFooter from "../NavigationFooter/NavigationFooter";
import ShowQueue from "../ShowQueue/showqueue"
import { requestGalleryWithPermission } from "../Picker/pickerhelper"
import Feather from "react-native-vector-icons/Feather"
import { TextInput } from "react-native-gesture-handler"
import PlaylistModal from "../PlaylistModal/playlistmodal"
import { GestureDetector,Gesture } from "react-native-gesture-handler"
import RNFS from "react-native-fs";

export default function DownloadedPlaylistTracks({currentTrack,setCurrentTrack,seek, setSeek}){

    const progress = useProgress();
    const navigate = useNavigate();
    const [trackforplaylist,setTrackForPlaylist] = useState({});
    const [editingplaylistname,setEditingPlaylistName] = useState(false);
    const { position, duration } = useProgress(200);
    const playerState = usePlaybackState();
    const isPlaying = playerState === State.Playing;
    const [album_tracks,setAlbumTracks] = useState([]);
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
    const [filteruserinput,setFilterInput] = useState("");
    const [playlisttrackremoved,setPlaylistTrackRemoved] = useState(false)
    const[isfilterTyping,setIsFilterTyping] =useState(false);
    const handleModal = () => setIsModalVisible(() => !isModalVisible);
    
    const shuffletracks = async () =>{
        const shuffled_tracks = album_tracks
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value)
        //console.log(shuffled)
        setAlbumTracks(shuffled_tracks)
        await TrackPlayer.reset();
        
    }
    const doubleTap = Gesture.Tap().numberOfTaps(2).onEnd((_event,success) =>{
        if (success){
            //getalbumtracks("/artistprofile")
            shuffletracks()
        }
    })
    const longPress = Gesture.LongPress().onStart((_event,success) =>{
        setthumbnailimage()
    })

    const filterData = (item,index) =>{
        if (filteruserinput === ""){
            return(<TrackItem index={index} setCurrentTrack={setCurrentTrack} album_track={item} num_of_tracks={album_tracks.length} album_tracks={album_tracks} setTrackForPlaylist={setTrackForPlaylist} trackforplaylist={trackforplaylist} handleModal={handleModal} playlisttrackremoved={playlisttrackremoved} setPlaylistTrackRemoved={setPlaylistTrackRemoved}/>)
        }
       
        if (item.name.toLowerCase().includes(filteruserinput.toLowerCase())  || item.artist.toLowerCase().includes(filteruserinput.toLowerCase()) ){
            return(
                <TrackItem index={index} setCurrentTrack={setCurrentTrack} album_track={item} num_of_tracks={album_tracks.length} album_tracks={album_tracks} setTrackForPlaylist={setTrackForPlaylist} trackforplaylist={trackforplaylist} handleModal={handleModal} playlisttrackremoved={playlisttrackremoved} setPlaylistTrackRemoved={setPlaylistTrackRemoved}/>
            )
        } 

    }



    const getplaylist = async () =>{
        console.log("hamdid")
        let keys = await AsyncStorage.getAllKeys()
        const items = await AsyncStorage.multiGet(keys.filter((key) =>{return(key.includes(`downloaded-track:`))}))
        const playlist_tracks = items.map((item) =>{return(JSON.parse(item[1]))})
        const items_order = await AsyncStorage.multiGet(keys.filter((key) =>{return(key.includes(`downloaded-track-order:`))}))

        const playlist_tracks_order = items_order.map((item) =>{return(JSON.parse(item[1]))});

        function customSort(a, b) {
            //console.log(album_order)
            try{
                const orderA = playlist_tracks_order.find(item => item.name === a.name).order;
    
                const orderB = playlist_tracks_order.find(item => item.name === b.name).order;
                return orderA - orderB;
            }
            catch{
                //console.log(a)
            }

  
        
            
        }

       
        playlist_tracks.sort(customSort);
        //console.log(playlist_tracks[0])
        //console.log(final_track_fin)
        setAlbumTracks(playlist_tracks)

    }
    useEffect(() =>{
        getplaylist()
    },[playlisttrackremoved])
    const delval = async () =>{
       const vals =  await RNFS.readDir(RNFS.DocumentDirectoryPath);
       const end = vals.filter((file) =>{return(file.path.includes("mp3"))})
       console.log(end)
       const promises = end.map(async (file) =>{
        await RNFS.unlink(file.path)
       })
       await Promise.all(promises)
       console.log("done")
       const keyorder = await  AsyncStorage.getAllKeys()
       
       await AsyncStorage.removeItem("downloaded_num")
       await AsyncStorage.multiRemove(keyorder.filter((key) =>{return(key.includes("downloaded-track-order"))}))
       await AsyncStorage.multiRemove(keyorder.filter((key) =>{return(key.includes("downloaded-track"))}))

    }

    //
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

            
            <TouchableOpacity  style={{justifyContent:"center",alignItems:"center",flex:0.5}}>
                <GestureDetector gesture={Gesture.Exclusive(doubleTap)}  >
                    <Image style={{borderRadius:5,width: 175, height: 175}} source={require('../../assets/Download.png')}></Image>

                </GestureDetector>
            </TouchableOpacity>

            <View style={{flex:editingplaylistname === false ? isfilterTyping ? 0.9 : 0.1:isTyping ?0.5: 0.2,justifyContent:"center",alignItems:"center"}}>
                    <View style={{flexDirection:"row"}}>
                        {editingplaylistname === false ?
                        <Text style={{color:"white",fontSize:20}}>Downloaded Songs</Text>:
                        <TextInput onTouchStart={() =>{setIsTyping(true)}} onEndEditing={() =>{setIsTyping(false)}} style={{width:150}} placeholder="Enter New Playlist" onChangeText={(text) =>{setUserInput(text)}}/>}
                        {editingplaylistname === false ?
                                                <TouchableOpacity onPress={() =>{setEditingPlaylistName(true)}}>
                                                <Feather style={{top:5,left:3}} size={17} name="edit-2"></Feather>
                                            </TouchableOpacity>:
                                <TouchableOpacity style={{top:13}} onPress={() =>{setEditingPlaylistName(false);setIsTyping(false)}}>
                                    <Text>x</Text></TouchableOpacity>}

                    </View>
                    <Text style={{color:"grey",fontSize:15}}>{album_tracks.length} Tracks</Text>
            </View>
            <View style={{flexDirection:"row"}}>
            <AntDesign style={{position:"relative",top:18}} name="filter"/>
            <TextInput style={{width:"100%"}} placeholder="Enter Here" onEndEditing={() =>{setIsFilterTyping(false)}} onTouchStart={() =>{setIsFilterTyping(true)}} onChangeText={(text) =>{setFilterInput(text);}}/>
            </View>
            <FlatList 
            data={album_tracks}
            style={{flex:1,backgroundColor:"#141212"}}
            renderItem={({item,index}) =>filterData(item,index)}
            />
            <ShowCurrentTrack tracks={true}/>
            <ShowQueue/>

            <TrackProgress  seek={seek} setSeek={setSeek}/>
  
            <NavigationFooter currentpage={"home"}/>
            <PlaylistModal isModalVisible={isModalVisible} setIsModalVisible={setIsModalVisible} trackforplaylist={trackforplaylist}/>

        </View>
    )

}