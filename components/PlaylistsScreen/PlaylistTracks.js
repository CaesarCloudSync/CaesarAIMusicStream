import { useEffect, useState,useCallback,useRef } from "react"
import { View,Text, FlatList,Image, TouchableOpacity,AppState,ActivityIndicator,Alert,Modal as RNModal} from "react-native"
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
import ShowQueue from "../ShowQueue/showqueue";

import { requestGalleryWithPermission } from "../Picker/pickerhelper"
import Feather from "react-native-vector-icons/Feather"
import { TextInput } from "react-native-gesture-handler"
import PlaylistModal from "../PlaylistModal/playlistmodal"
import { GestureDetector,Gesture,TouchableOpacity as GestureTouchableOpacity } from "react-native-gesture-handler"
import { useNetInfo } from "@react-native-community/netinfo"
import CustomYTModal from "../CustomYTModal/customytmodal"
import { renameSpotifyPlaylist, getSpotifyBackupConfig, syncPlaylistToSpotify, triggerBackupSync, findExistingSpotifyPlaylist } from "../access_token/spotifyBackupHelper";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
 
export default function PlaylistTracks({currentTrack,setCurrentTrack,seek, setSeek}){

    const progress = useProgress();
    const location = useLocation();
    const netInfo = useNetInfo();
    const navigate = useNavigate();
    const [trackforplaylist,setTrackForPlaylist] = useState([]);
    const [multiplaylistselect,setMultiplePlaylistSelect] = useState(false);
    const [editingplaylistname,setEditingPlaylistName] = useState(false);
    const { position, duration } = useProgress(200);
    const playerState = usePlaybackState();
    const isPlaying = playerState === State.Playing;
    const [playlist_details,setPlaylistDetails] = useState(location.state?.playlist_details || {})
    const [album_tracks,setAlbumTracks] = useState(location.state?.playlist_tracks || [])
    const [loadingaudio,setLoadingAudio] = useState(false)
    const appState = useRef(AppState.currentState);
    const isInitialMount = useRef(true);
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
    
    const [isReorderMode, setIsReorderMode] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [selectedTrackIndex, setSelectedTrackIndex] = useState(null);
    const [customAlert, setCustomAlert] = useState(null);

    const showAlert = (title, message, buttons = []) => {
        if (buttons.length === 0) {
            buttons = [
                {
                    text: "OK",
                    onPress: () => {}
                }
            ];
        }
        setCustomAlert({ title, message, buttons });
    };

    const toggleReorderMode = () => {
        if (isReorderMode) {
            setSelectedTrackIndex(null);
        }
        setIsReorderMode(!isReorderMode);
    };

    const handleModal = () => setIsModalVisible(() => !isModalVisible);
    const shuffletracks = async () =>{
        const shuffled_tracks = album_tracks
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value)
        //console.log(shuffled)
  
        await TrackPlayer.reset();
        setHasBeenShuffled(true)
        await AsyncStorage.setItem(`shuffled-tracks:${playlist_details.playlist_name}`,JSON.stringify(shuffled_tracks))
        await getplaylist();
        
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
            return(<TrackItem index={index} setCurrentTrack={setCurrentTrack} album_track={item} num_of_tracks={album_tracks.length} album_tracks={album_tracks} trackforplaylist={trackforplaylist} setTrackForPlaylist={setTrackForPlaylist} playlist_details={playlist_details} handleModal={handleModal} playlisttrackremoved={playlisttrackremoved} setPlaylistTrackRemoved={setPlaylistTrackRemoved} multiplaylistselect={multiplaylistselect} setMultiplePlaylistSelect={setMultiplePlaylistSelect} />)
        }
       
        if (item.name.toLowerCase().includes(filteruserinput.toLowerCase())  || item.artist.toLowerCase().includes(filteruserinput.toLowerCase()) ){
            return(
                <TrackItem index={index} setCurrentTrack={setCurrentTrack} album_track={item} num_of_tracks={album_tracks.length} album_tracks={album_tracks} trackforplaylist={trackforplaylist} setTrackForPlaylist={setTrackForPlaylist} playlist_details={playlist_details} handleModal={handleModal} playlisttrackremoved={playlisttrackremoved} setPlaylistTrackRemoved={setPlaylistTrackRemoved} multiplaylistselect={multiplaylistselect} setMultiplePlaylistSelect={setMultiplePlaylistSelect} />
            )
        } 

    }


    const navartistprofile = async () =>{
        //await AsyncStorage.setItem(`artist:${album_tracks[0].artist_name}`,JSON.stringify({"artist_id":album_tracks[0].artist_id}))
        navigate("/artistprofile",{state:{"album_tracks":album_tracks}})
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
        const newPlaylistObj = {
            ...playlist_details,
            "playlist_name": userinput,
            "playlist_thumbnail": playlist_details.playlist_thumbnail,
            "playlist_size": playlist_details.playlist_size
        };
        await AsyncStorage.setItem(`playlist:${userinput}`, JSON.stringify(newPlaylistObj))
        //await AsyncStorage.setItem(`playlist-track-order:${playliststate.playlist_name}-${trackforplaylist.name}`,JSON.stringify({"name":trackforplaylist.name,"order":num_of_tracks -1}))
        let new_playlist_tracks = album_tracks.map((item) =>{item["playlist_name"] = userinput;return([ `playlist-track:${userinput}-${item.name}`,JSON.stringify(item)])})
        await AsyncStorage.multiSet(new_playlist_tracks)
        await AsyncStorage.multiRemove(album_tracks.map((item) =>{return(`playlist-track:${playlist_details.playlist_name}-${item.name}`)}))

        // Rename on Spotify if backup is enabled
        if (playlist_details.spotify_backup_enabled && playlist_details.spotify_playlist_id) {
            await renameSpotifyPlaylist(playlist_details.spotify_playlist_id, userinput);
        }

        // Remove Playlist and render on page
        await AsyncStorage.removeItem(`playlist:${playlist_details.playlist_name}`)
        setPlaylistDetails(newPlaylistObj)
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
            const orderObjA = playlist_tracks_order.find(item => item.name === a.name);
            const orderObjB = playlist_tracks_order.find(item => item.name === b.name);
            const orderA = orderObjA ? orderObjA.order : 0;
            const orderB = orderObjB ? orderObjB.order : 0;
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
        //console.log("shuffled",shuffled_tracks)
        if (shuffled_tracks){
            setHasBeenShuffled(true);
            let shuffled_tracks_json = JSON.parse(shuffled_tracks)
            setAlbumTracks(shuffled_tracks_json)
        }
        else{
        setAlbumTracks(final_playlist_tracks)
        }

        let playlist_detts = await AsyncStorage.getItem(`playlist:${playlist_details.playlist_name}`)
        if (playlist_detts) {
            const parsed = JSON.parse(playlist_detts);
            setPlaylistDetails(parsed);
        } else {
            setPlaylistDetails(playlist_details);
        }

    }
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            if (album_tracks && album_tracks.length > 0) {
                // Already have tracks from navigation, no need to fetch from AsyncStorage
                return;
            }
        }
        getplaylist();
    }, [playlisttrackremoved, netInfo, location.state?.playlist_tracks]);

    const setthumbnailimage = async () =>{
        const response = await requestGalleryWithPermission();
        await AsyncStorage.setItem(`playlist:${playlist_details.playlist_name}`,JSON.stringify({"playlist_name":playlist_details.playlist_name,"playlist_thumbnail":response["uri"],"playlist_size":playlist_details.playlist_size}))
        setPlaylistDetails({...playlist_details,playlist_thumbnail: response["uri"]})
    }
    const unlockshuffle = async () =>{
        setHasBeenShuffled(false);
        await AsyncStorage.removeItem(`shuffled-tracks:${playlist_details.playlist_name}`)
        await getplaylist();
        await TrackPlayer.reset();
    }

    const handleBackupToggle = async () => {
        try {
            const config = await getSpotifyBackupConfig();
            if (!config.userId || !config.accessToken) {
                showAlert(
                    "Spotify Not Connected",
                    "Please connect your Spotify account in Settings first."
                );
                return;
            }

            const updatedBackupState = !playlist_details.spotify_backup_enabled;

            if (updatedBackupState) {
                setIsSyncing(true);

                if (playlist_details.spotify_playlist_id) {
                    const stored = await AsyncStorage.getItem(`playlist:${playlist_details.playlist_name}`);
                    const parsed = stored ? JSON.parse(stored) : {};
                    parsed.spotify_backup_enabled = true;
                    await AsyncStorage.setItem(`playlist:${playlist_details.playlist_name}`, JSON.stringify(parsed));
                    setPlaylistDetails(parsed);
                    await syncPlaylistToSpotify(playlist_details.playlist_name);
                    setIsSyncing(false);
                    showAlert("Backup Enabled", `Playlist "${playlist_details.playlist_name}" is now synced with Spotify.`);
                    return;
                }

                const existingPlaylist = await findExistingSpotifyPlaylist(playlist_details.playlist_name);
                
                if (existingPlaylist) {
                    setIsSyncing(false);
                    showAlert(
                        "Playlist Already Exists",
                        `A playlist named "${playlist_details.playlist_name}" already exists on your Spotify account. Do you want to sync with it or create a new backup?`,
                        [
                            {
                                text: "Link & Sync",
                                onPress: async () => {
                                    try {
                                        setIsSyncing(true);
                                        const stored = await AsyncStorage.getItem(`playlist:${playlist_details.playlist_name}`);
                                        const parsed = stored ? JSON.parse(stored) : {};
                                        parsed.spotify_playlist_id = existingPlaylist.id;
                                        parsed.spotify_backup_enabled = true;
                                        await AsyncStorage.setItem(`playlist:${playlist_details.playlist_name}`, JSON.stringify(parsed));
                                        setPlaylistDetails(parsed);
                                        await syncPlaylistToSpotify(playlist_details.playlist_name);
                                        showAlert("Success", "Linked and synced with existing Spotify playlist.");
                                    } catch (err) {
                                        showAlert("Sync Error", err.message);
                                    } finally {
                                        setIsSyncing(false);
                                    }
                                }
                            },
                            {
                                text: "Create New Backup",
                                onPress: async () => {
                                    try {
                                        setIsSyncing(true);
                                        await syncPlaylistToSpotify(playlist_details.playlist_name, true);
                                        const stored = await AsyncStorage.getItem(`playlist:${playlist_details.playlist_name}`);
                                        if (stored) {
                                            setPlaylistDetails(JSON.parse(stored));
                                        }
                                        showAlert("Success", "Created a new separate Spotify playlist backup.");
                                    } catch (err) {
                                        showAlert("Sync Error", err.message);
                                    } finally {
                                        setIsSyncing(false);
                                    }
                                }
                            },
                            {
                                text: "Cancel",
                                style: "cancel"
                            }
                        ]
                    );
                } else {
                    await syncPlaylistToSpotify(playlist_details.playlist_name);
                    const stored = await AsyncStorage.getItem(`playlist:${playlist_details.playlist_name}`);
                    if (stored) {
                        setPlaylistDetails(JSON.parse(stored));
                    }
                    setIsSyncing(false);
                    showAlert("Backup Enabled", `Playlist "${playlist_details.playlist_name}" is now synced with Spotify.`);
                }
            } else {
                setIsSyncing(true);
                const stored = await AsyncStorage.getItem(`playlist:${playlist_details.playlist_name}`);
                const parsed = stored ? JSON.parse(stored) : {};
                parsed.spotify_backup_enabled = false;
                await AsyncStorage.setItem(`playlist:${playlist_details.playlist_name}`, JSON.stringify(parsed));
                setPlaylistDetails(parsed);
                setIsSyncing(false);
                showAlert("Backup Disabled", `Stopped auto-syncing "${playlist_details.playlist_name}" to Spotify.`);
            }
        } catch (err) {
            setIsSyncing(false);
            showAlert("Backup Sync Error", err.message);
        }
    };

    const swapItems = async (fromIndex, toIndex) => {
        if (fromIndex === toIndex) return;
        const newTracks = [...album_tracks];
        const temp = newTracks[fromIndex];
        newTracks[fromIndex] = newTracks[toIndex];
        newTracks[toIndex] = temp;
        setAlbumTracks(newTracks);
        
        try {
            const promises = newTracks.map(async (track, index) => {
                await AsyncStorage.setItem(`playlist-track-order:${playlist_details.playlist_name}-${track.name}`, JSON.stringify({ "name": track.name, "order": index }));
            });
            await Promise.all(promises);
            console.log("New order saved to AsyncStorage.");
            await triggerBackupSync(playlist_details.playlist_name);
        } catch (e) {
            console.error("Failed to save new track order:", e);
        }
    };

    const ReorderTrackItem = ({ item, index }) => {
        const isSelected = selectedTrackIndex === index;

        const handlePress = async () => {
            if (selectedTrackIndex === null) {
                setSelectedTrackIndex(index);
            } else {
                const firstIndex = selectedTrackIndex;
                setSelectedTrackIndex(null);
                await swapItems(firstIndex, index);
            }
        };

        return (
            <View 
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginHorizontal: 10,
                    marginVertical: 10
                }}
            >
                <Image style={{ width: 60, height: 60, borderRadius: 5 }} source={{ uri: item.thumbnail }} />
                <View style={{ padding: 6 }} />
                <View style={{ flex: 1, justifyContent: "center" }}>
                    <Text numberOfLines={1} style={{ color: "white", fontSize: 14, fontWeight: "500" }}>{item.name}</Text>
                    <Text numberOfLines={1} style={{ color: "grey", fontSize: 12, marginTop: 2 }}>{item.artist}</Text>
                </View>
                
                <GestureTouchableOpacity 
                    onPress={handlePress}
                    activeOpacity={0.5}
                    delayPressIn={0}
                    style={{ 
                        paddingVertical: 15, 
                        paddingHorizontal: 20, 
                        marginRight: -10,
                        justifyContent: "center", 
                        alignItems: "center" 
                    }}
                >
                    <MaterialIcons name="reorder" size={25} color={isSelected ? "#1db954" : "grey"} />
                </GestureTouchableOpacity>
            </View>
        );
    };

    return(
        <View style={{flex:1,backgroundColor:"#141212"}}>
   
            {/* Header Arrow */}
            <View style={{flexDirection:"row", alignItems:"center", paddingHorizontal: 15, paddingTop: 4}}>
                <TouchableOpacity onPress={() =>{navigate(-1)}}>
                    <AntDesign name="arrowleft" style={{fontSize:26, color: "white"}}/>
                </TouchableOpacity>

                {loadingaudio === true &&
                <View style={{marginLeft: 15, flexDirection: "row", alignItems: "center"}}>
                    <View style={{width:50,height:3,backgroundColor:"white", marginRight: 8}}>
                        <View style={{width:`${(completedpromises/totalpromises)*100}%`,height:3,backgroundColor:"blue"}}></View>
                    </View>
                    <Text style={{fontSize:10,color: "white"}}>{completedpromises}/{totalpromises}</Text>
                </View>
                }
            </View>

            {/* Thumbnail Section */}
            <TouchableOpacity style={{justifyContent:"center",alignItems:"center",flex:0.45, overflow: "hidden"}}>
                <View style={{flex: 1, justifyContent: "center", alignItems: "center", width: "100%"}}>
                    <GestureDetector gesture={Gesture.Exclusive(longPress,doubleTap)}>
                        <Image style={{borderRadius: 5, width: 175, height: 175, resizeMode: "cover", overflow: "hidden", backgroundColor: "#222"}} source={{uri:playlist_details.playlist_thumbnail}} />
                    </GestureDetector>
                </View>
            </TouchableOpacity>

            {/* Title Section */}
            <View style={{justifyContent:"center",alignItems:"center", paddingHorizontal: 20, paddingVertical: 4}}>
                <View style={{flexDirection:"row", alignItems:"center", justifyContent: "center", width: "100%"}}>
                    {editingplaylistname === false ? (
                        <>
                            <View style={{flexShrink: 1}}>
                                <Text style={{color:"white",fontSize:17,fontWeight:"bold",textAlign:"center"}}>{playlist_details.playlist_name}</Text>
                            </View>
                            <TouchableOpacity onPress={() =>{setUserInput(playlist_details.playlist_name); setEditingPlaylistName(true)}} style={{marginLeft: 8}}>
                                <Feather size={15} color="grey" name="edit-2" />
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <TextInput 
                                onSubmitEditing={() =>{editplaylistname()}} 
                                onTouchStart={() =>{setIsTyping(true)}} 
                                onEndEditing={() =>{setIsTyping(false)}} 
                                style={{width:150, color: "white", borderBottomWidth: 1, borderBottomColor: "white", padding: 2, fontSize: 16}} 
                                placeholder="Enter New Playlist" 
                                placeholderTextColor="grey"
                                value={userinput}
                                onChangeText={(text) =>{setUserInput(text)}}
                            />
                            <TouchableOpacity style={{marginLeft: 8}} onPress={() =>{setEditingPlaylistName(false);setIsTyping(false)}}>
                                <Text style={{color: "red", fontSize: 16}}>x</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
                <Text style={{color:"grey",fontSize:13,marginTop:2}}>{playlist_details.playlist_size} Tracks</Text>
            </View>

            {/* Backup & Reorder Icons (under the title, aligned to the right, above the search input) */}
            <View style={{flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 0, marginTop: -5, marginBottom: -10, alignItems: "center"}}>
                {/* Reorder Mode Toggle */}
                <GestureTouchableOpacity 
                    onPress={toggleReorderMode} 
                    delayPressIn={0}
                    style={{padding: 6, marginRight: 8}}
                >
                    <MaterialIcons 
                        name={isReorderMode ? "playlist-play" : "reorder"} 
                        size={25} 
                        color={isReorderMode ? "#1db954" : "white"} 
                    />
                </GestureTouchableOpacity>

                {/* Spotify Backup Status and Toggle */}
                {isSyncing ? (
                    <ActivityIndicator size="small" color="#1db954" style={{marginHorizontal: 5}} />
                ) : (
                    <GestureTouchableOpacity 
                        onPress={handleBackupToggle} 
                        delayPressIn={0}
                        style={{padding: 6}}
                    >
                        <MaterialIcons 
                            name={playlist_details.spotify_backup_enabled ? "cloud-done" : "cloud-queue"} 
                            size={25} 
                            color={playlist_details.spotify_backup_enabled ? "#1db954" : "grey"} 
                        />
                    </GestureTouchableOpacity>
                )}
            </View>

            {hasbeenshuffled === true &&
            <View style={{alignItems:"flex-end",marginRight:20, marginBottom: 4}}>
                <TouchableOpacity onLongPress={() =>{unlockshuffle();}}>
                    <AntDesign name="lock" size={20} style={{color:"green"}}></AntDesign>
                </TouchableOpacity>
            </View>
            }

            {/* Filter Search Input */}
            <View style={{flexDirection:"row", marginTop: -6}}>
            <AntDesign style={{position:"relative",top:18}} name="filter"/>
            <TextInput style={{width:"100%"}} placeholder="Enter Here" onEndEditing={() =>{setIsFilterTyping(false)}} onTouchStart={() =>{setIsFilterTyping(true)}} onChangeText={(text) => {setFilterInput(text);}}/>
            </View>
            <FlatList 
            data={album_tracks}
            style={{flex:1,backgroundColor:"#141212"}}
            renderItem={({item,index}) => {
                if (isReorderMode) {
                    return <ReorderTrackItem item={item} index={index} />;
                }
                return filterData(item,index);
            }}
            keyExtractor={(item, idx) => `track-${item.name}-${idx}`}
            />
            <ShowCurrentTrack tracks={true}/>
            <ShowQueue/>

            <TrackProgress  seek={seek} setSeek={setSeek}/>
  
            <NavigationFooter currentpage={"home"} setShowCustomYTInput={setShowCustomYTInput}/>
            <PlaylistModal isModalVisible={isModalVisible} setIsModalVisible={setIsModalVisible} trackforplaylist={trackforplaylist}/>
            <CustomYTModal isModalVisible={showCustomYTInput} setIsModalVisible={setShowCustomYTInput} playlistchanged={playlisttrackremoved} setPlaylistChanged={setPlaylistTrackRemoved} playlist_details={playlist_details} setPlaylistDetails={setPlaylistDetails}/>

            {customAlert && (
                <RNModal
                    transparent={true}
                    visible={true}
                    animationType="fade"
                    onRequestClose={() => setCustomAlert(null)}
                >
                    <View style={{
                        flex: 1,
                        backgroundColor: "rgba(0,0,0,0.8)",
                        justifyContent: "center",
                        alignItems: "center"
                    }}>
                        <View style={{
                            width: "85%",
                            backgroundColor: "#1a1818",
                            borderRadius: 15,
                            borderWidth: 1,
                            borderColor: "#333",
                            padding: 20,
                            alignItems: "center"
                        }}>
                            <Text style={{
                                color: "white",
                                fontSize: 18,
                                fontWeight: "bold",
                                textAlign: "center",
                                marginBottom: 12
                            }}>{customAlert.title}</Text>
                            
                            <Text style={{
                                color: "grey",
                                fontSize: 14,
                                textAlign: "center",
                                marginBottom: 20,
                                lineHeight: 20
                            }}>{customAlert.message}</Text>
                            
                            <View style={{ width: "100%" }}>
                                {customAlert.buttons.map((btn, idx) => {
                                    const isCancel = btn.style === "cancel" || btn.text.toLowerCase() === "cancel";
                                    return (
                                        <TouchableOpacity
                                            key={idx}
                                            onPress={() => {
                                                setCustomAlert(null);
                                                if (btn.onPress) btn.onPress();
                                            }}
                                            style={{
                                                backgroundColor: isCancel ? "transparent" : "#1db954",
                                                borderWidth: isCancel ? 1 : 0,
                                                borderColor: isCancel ? "#555" : "transparent",
                                                borderRadius: 25,
                                                paddingVertical: 12,
                                                width: "100%",
                                                alignItems: "center",
                                                marginVertical: 6
                                            }}
                                        >
                                            <Text style={{
                                                color: "white",
                                                fontSize: 15,
                                                fontWeight: "600"
                                            }}>{btn.text}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    </View>
                </RNModal>
            )}

        </View>
    )

}