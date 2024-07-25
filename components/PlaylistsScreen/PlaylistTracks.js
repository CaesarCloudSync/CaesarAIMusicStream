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
import { GestureDetector,Gesture } from "react-native-gesture-handler"
import { useNetInfo } from "@react-native-community/netinfo"
import CustomYTModal from "../CustomYTModal/customytmodal"
 
export default function PlaylistTracks({currentTrack,setCurrentTrack,seek, setSeek}){

    const progress = useProgress();
    const location = useLocation();
    const netInfo = useNetInfo();

    const navigate = useNavigate();
    const [trackforplaylist,setTrackForPlaylist] = useState({});
    const [editingplaylistname,setEditingPlaylistName] = useState(false);
    const { position, duration } = useProgress(200);
    const playerState = usePlaybackState();
    const isPlaying = playerState === State.Playing;
    const [playlist_details,setPlaylistDetails] = useState(location.state.playlist_details)
    const [album_tracks,setAlbumTracks] = useState(); // location.state.playlist_tracks
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
    const [showCustomYTInput,setShowCustomYTInput] = useState(false);
    const [hasbeenshuffled,setHasBeenShuffled] = useState(false);
    const handleModal = () => setIsModalVisible(() => !isModalVisible);
    const shuffletracks = async () =>{
        const shuffled_tracks = album_tracks
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value)
        //console.log(shuffled)
        setAlbumTracks(shuffled_tracks)
        await TrackPlayer.reset();
        setHasBeenShuffled(true)
        await AsyncStorage.setItem(`shuffled-tracks:${playlist_details.playlist_name}`,JSON.stringify(shuffled_tracks))
        
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
            return(<TrackItem index={index} setCurrentTrack={setCurrentTrack} album_track={item} num_of_tracks={album_tracks.length} album_tracks={album_tracks} setTrackForPlaylist={setTrackForPlaylist} playlist_details={playlist_details} handleModal={handleModal} playlisttrackremoved={playlisttrackremoved} setPlaylistTrackRemoved={setPlaylistTrackRemoved} />)
        }
       
        if (item.name.toLowerCase().includes(filteruserinput.toLowerCase())  || item.artist.toLowerCase().includes(filteruserinput.toLowerCase()) ){
            return(
                <TrackItem index={index} setCurrentTrack={setCurrentTrack} album_track={item} num_of_tracks={album_tracks.length} album_tracks={album_tracks} setTrackForPlaylist={setTrackForPlaylist} playlist_details={playlist_details} handleModal={handleModal} playlisttrackremoved={playlisttrackremoved} setPlaylistTrackRemoved={setPlaylistTrackRemoved} />
            )
        } 

    }


    const navartistprofile = async () =>{
        //await AsyncStorage.setItem(`artist:${album_tracks[0].artist_name}`,JSON.stringify({"artist_id":album_tracks[0].artist_id}))
        navigate("/artistprofile",{state:album_tracks})
    }
    const editplaylistname = async () =>{

        // Amend Playlist order values
        let keys = await AsyncStorage.getAllKeys()
        const items_order = await AsyncStorage.multiGet(keys.filter((key) =>{return(key.includes(`playlist-track-order:${playlist_details.playlist_name}`))}))
        const playlist_order = items_order.map((item) =>{return(JSON.parse(item[1]))})
        const new_playlist_order = playlist_order.map((item) =>{return([ `playlist-track-order:${userinput}-${item.name}`,JSON.stringify(item)])})
        await AsyncStorage.multiSet(new_playlist_order)
        await AsyncStorage.multiRemove(album_tracks.map((item) =>{return(`playlist-track-order:${playlist_details.playlist_name}-${item.name}`)}))
        // Amend playlist values
        await AsyncStorage.setItem(`playlist:${userinput}`,JSON.stringify({"playlist_name":userinput,"playlist_thumbnail":playlist_details.playlist_thumbnail,"playlist_size":playlist_details.playlist_size}))
        //await AsyncStorage.setItem(`playlist-track-order:${playliststate.playlist_name}-${trackforplaylist.name}`,JSON.stringify({"name":trackforplaylist.name,"order":num_of_tracks -1}))
        let new_playlist_tracks = album_tracks.map((item) =>{item["playlist_name"] = userinput;return([ `playlist-track:${userinput}-${item.name}`,JSON.stringify(item)])})
        await AsyncStorage.multiSet(new_playlist_tracks)
        await AsyncStorage.multiRemove(album_tracks.map((item) =>{return(`playlist-track:${playlist_details.playlist_name}-${item.name}`)}))

        // Remove Playlist and render on page
        await AsyncStorage.removeItem(`playlist:${playlist_details.playlist_name}`)
        playlist_details.playlist_name = userinput
        setPlaylistDetails(playlist_details)
        setIsTyping(false)
        setEditingPlaylistName(false);
        await TrackPlayer.reset()


    }
    const getplaylist = async () =>{
        let keys = await AsyncStorage.getAllKeys()
        const items = await AsyncStorage.multiGet(keys.filter((key) =>{return(key.includes(`playlist-track:${playlist_details.playlist_name}`))}))
        console.log("playlist_big")
        const playlist_tracks = items.map((item) =>{return(JSON.parse(item[1]))})
        const items_order = await AsyncStorage.multiGet(keys.filter((key) =>{return(key.includes(`playlist-track-order:${playlist_details.playlist_name}`))}))
        const playlist_tracks_order = items_order.map((item) =>{return(JSON.parse(item[1]))})

        function customSort(a, b) {
            //console.log(album_order)
            const orderA = playlist_tracks_order.find(item => item.name === a.name).order;
    
            const orderB = playlist_tracks_order.find(item => item.name === b.name).order;
        
            return orderA - orderB;
        }

       
        playlist_tracks.sort(customSort);
        //console.log(final_track_fin)
        const final_promises = playlist_tracks.map(async (track) =>{
            const track_downloaded = await AsyncStorage.getItem(`downloaded-track:${track.artist}-${track.album_name}-${track.name}`);
            if (track_downloaded){
                return (track)
            }
            else{
                return (undefined)
            }
        })
        const final_playlist_tracks = netInfo.isInternetReachable === false ? (await Promise.all(final_promises)).filter((track) =>{return(track !== undefined)}) : playlist_tracks  
        let shuffled_tracks = await AsyncStorage.getItem(`shuffled-tracks:${playlist_details.playlist_name}`)
        if (shuffled_tracks){
            setHasBeenShuffled(true);
            let shuffled_tracks_json = JSON.parse(shuffled_tracks)
            setAlbumTracks(shuffled_tracks_json)
        }
        else{
        setAlbumTracks(final_playlist_tracks)
        }
  
        let playlist_detts = await AsyncStorage.getItem(`playlist:${playlist_details.playlist_name}`)

        setPlaylistDetails(playlist_details);

    }
    useEffect(() =>{
        
        getplaylist()
        
    },[playlisttrackremoved,netInfo])
    const setthumbnailimage = async () =>{
        const response = await requestGalleryWithPermission();
        await AsyncStorage.setItem(`playlist:${playlist_details.playlist_name}`,JSON.stringify({"playlist_name":playlist_details.playlist_name,"playlist_thumbnail":response["uri"],"playlist_size":playlist_details.playlist_size}))
        setPlaylistDetails({...playlist_details,playlist_thumbnail: response["uri"]})
    }
    const unlockshuffle = async () =>{
        setHasBeenShuffled(false);
        await AsyncStorage.removeItem(`shuffled-tracks:${playlist_details.playlist_name}`)
        await getplaylist();
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

            
            <TouchableOpacity style={{justifyContent:"center",alignItems:"center",flex:0.5}}>
                <GestureDetector gesture={Gesture.Exclusive(longPress,doubleTap)}  >
                    <Image style={{borderRadius:5,width: 175, height: 175}} source={{uri:playlist_details.playlist_thumbnail}}></Image>

                </GestureDetector>
            </TouchableOpacity>

            <View style={{flex:editingplaylistname === false ? isfilterTyping ? 0.9 : 0.1:isTyping ?0.5: 0.2,justifyContent:"center",alignItems:"center"}}>
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
            {hasbeenshuffled === true &&
            <View style={{alignItems:"flex-end",marginRight:20}}>
                <TouchableOpacity onLongPress={() =>{unlockshuffle();}}>
                <AntDesign name="lock" size={24} style={{color:"green"}}></AntDesign>
                </TouchableOpacity>
            </View>
            }
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
  
            <NavigationFooter currentpage={"home"} setShowCustomYTInput={setShowCustomYTInput}/>
            <PlaylistModal isModalVisible={isModalVisible} setIsModalVisible={setIsModalVisible} trackforplaylist={trackforplaylist}/>
            <CustomYTModal isModalVisible={showCustomYTInput} setIsModalVisible={setShowCustomYTInput} playlistchanged={playlisttrackremoved} setPlaylistChanged={setPlaylistTrackRemoved} playlist_details={playlist_details} setPlaylistDetails={setPlaylistDetails}/>

        </View>
    )

}