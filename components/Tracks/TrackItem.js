import { View,Text,Image,TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import AntDesign from "react-native-vector-icons/AntDesign"
import { useEffect, useState } from "react";
import { getTableNames } from "../SQLDB/SQLDB";
import Entypo from "react-native-vector-icons/Entypo"
import { connectToDatabase } from "../SQLDB/SQLDB";
import { getyoutubelink } from "./getstreamlinks";
import {check_if_failed_download, downloadFile}from "./DownloadSong";
import TrackPlayer,{RepeatMode} from "react-native-track-player";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getstreaminglink } from "./getstreamlinks";
import { Gesture,GestureDetector,Swipeable,Directions } from "react-native-gesture-handler";

import { prefetchsong, skipToTrack, getLoadingTrackId, subscribeToLoadingTrack, setLoadingTrackId } from "../controls/controls";
import { useNavigate } from "react-router-native";
import RNFS from "react-native-fs";
import axios from "axios";
import { convertToValidFilename } from "../tool/tools";
import { MUSICSDCARDPATH } from "../constants/constants";
import { set } from "lodash";
import notifee from '@notifee/react-native';

export default function TrackItem({album_track,setCurrentTrack,index,num_of_tracks,album_tracks,trackforplaylist,setTrackForPlaylist,handleModal,playlist_details,playlisttrackremoved,setPlaylistTrackRemoved,downloadedsongind,setDownloadedAlbumIsFull,downloadalbumisfull,removealldownloadsdone,multiplaylistselect,setMultiplePlaylistSelect}){
    const navigate = useNavigate()
    
    const [album_track_state,setAlbumTrackState] = useState(album_track)
    const [album_tracks_state,setAlbumTracksState] = useState(album_tracks)
    const [isSongLoading, setIsSongLoading] = useState(false);
    const [isDownloaded,setIsDownloaded] = useState(false);
    const [isSkipped,setIsSkipped] = useState(false); // true when entry exists but file was age-restricted

    useEffect(() => {
        if (!album_track_state) return;
        const unsubscribe = subscribeToLoadingTrack((trackId) => {
            setIsSongLoading(trackId === album_track_state.id && !isDownloaded);
        });
        return unsubscribe;
    }, [album_track_state?.id, isDownloaded]);

    const [isDownloading,setIsDownloading] = useState(false);
    const [addedtoqueue,setAddedToQueue] = useState(false);
    const [songIsAvailable,setSongIsAvailable] = useState(true);
    const [downloadwasremoved,setDownloadWasRemoved] = useState(false);
   
    const navartistprofileplaylist = async () =>{
        //await AsyncStorage.setItem(`artist:${album_tracks_state[0].artist_name}`,JSON.stringify({"artist_id":album_tracks_state[0].artist_id}))
        navigate("/artistprofile",{state:{"album_tracks":[album_track_state]}})
    }
    const singleTap = Gesture.Tap().onEnd((_event,success) =>{
        if (success){
            playnowsong()
        }
    })
    const doubleTap = Gesture.Tap().numberOfTaps(2).onEnd((_event,success) =>{
        if (success){
            if(playlist_details){
                if (!album_track_state.ytcustom){
                    navartistprofileplaylist()
                }
            }
        }
    })
    const longPress = Gesture.LongPress().onStart(async (_event,success) =>{
        if(playlist_details){removetrackfromplaylist()}
    })

    const [addingqueue,setAddingQueue] = useState(false);
    const storeasunavailable = async () =>{
        if (songIsAvailable === true){
            setSongIsAvailable(false)
            const db = await connectToDatabase()
            //const tablenames = await getTableNames(db)
            console.log(db)
            
        }
        else{
            setSongIsAvailable(true)
        }
    }
    const togglemultiplaylistselectlongPress = Gesture.LongPress().onStart(async (_event,success) =>{
        //console.log("long press",album_track_state,trackforplaylist,multiplaylistselect)
      
        if (multiplaylistselect === false){
            console.log("add to multiselect",album_track_state,trackforplaylist)
            setMultiplePlaylistSelect(true)
            setTrackForPlaylist([album_track_state]);
        }
        else{
            console.log("remove from multiselect",album_track_state,trackforplaylist)
                setMultiplePlaylistSelect(false)
                setTrackForPlaylist([]);
            

        } 
        
    })
    const showplaylistoptionsdoubleTap = Gesture.Tap().numberOfTaps(2).onEnd((_event,success) =>{
        console.log("show playlist options",album_track_state,trackforplaylist)
        handleModal();

        })
    const toggleaddplaylistselectsinglePress = Gesture.Tap().onEnd(async (_event,success) =>{

    
         if (multiplaylistselect === false){
            showplaylistoptions()
        }
         
         else{
            if (trackforplaylist !== undefined && trackforplaylist.some(item => item.name === album_track_state.name) ){
                setTrackForPlaylist(trackforplaylist.filter(item => item.name !== album_track_state.name));
            }
            else{
                addplaylisttomultiselect()
            }
            }
       
    })


    function timeout(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    const addplaylisttomultiselect = async () =>{
        console.log("addplaylist",album_track_state,trackforplaylist)
        setTrackForPlaylist([...trackforplaylist, album_track_state]);
        
    }
    const flingleft = Gesture.Fling()
    .direction(Directions.LEFT )
    .onEnd(async (event) => {
        setAddingQueue(true)
        const queue = await AsyncStorage.getItem("queue")
        if (!queue){
        let currentTrackInd = await  TrackPlayer.getActiveTrackIndex()
        console.log("current_eh",currentTrackInd)
        if (currentTrackInd !== undefined){
        let currentTrack = await TrackPlayer.getTrack(currentTrackInd)
        const stored_album_tracks = await AsyncStorage.getItem("current-tracks")
        if (stored_album_tracks){
            const current_album_tracks = JSON.parse(stored_album_tracks)
            const currentTrackIndexInaAlbum = current_album_tracks.findIndex(track => track.id == currentTrack.id)
            let next_track_index =  currentTrackIndexInaAlbum+1 == current_album_tracks.length  ? 0 : currentTrackIndexInaAlbum+1
            //console.log(album_tracks_state.length,next_track_index,currentTrackIndexInaAlbum+1,"hack")
            await AsyncStorage.setItem("track_after_queue",JSON.stringify(next_track_index))
        }
        }

        await AsyncStorage.setItem("queue",JSON.stringify([album_tracks_state[index]]));
        
        }
        else{
       
            let queue_json = JSON.parse(queue)
            queue_json.push(album_tracks_state[index])

            await AsyncStorage.setItem("queue",JSON.stringify(queue_json))
            
        }
        setAddedToQueue(true)
        await timeout(1200);
        setAddingQueue(false)
        await AsyncStorage.setItem(`queue-current-track-${album_track_state.artist}-${album_track_state.album_name}-${album_track_state.name}`,JSON.stringify(album_tracks_state));

        //addtolibrary()
        /*setTimeout(() =>{
            //console.log("jo")
            
        },300) */  })
    const downloadsong = async () =>{
        setIsDownloading(true);
        // Start download – show spinner
        setIsSongLoading(true);
        try {
            const [youtube_link,title] = await getstreaminglink(album_track_state);
            // Age-restricted / unavailable — can't download but mark as "skipped"
            if (!youtube_link) {
                console.log("Age-restricted or unavailable track, marking as skipped:", album_track_state.name);
                await AsyncStorage.setItem(
                    `downloaded-track:${album_track_state.artist}-${album_track_state.album_name}-${album_track_state.name}`,
                    JSON.stringify({ ...album_track_state, skipped: true })
                );
                setIsDownloaded(true);
                Alert.alert(
                    "Track Unavailable",
                    `"${album_track_state.name}" is age-restricted and can't be downloaded. It has been marked as skipped so it won't block the rest of the album.`
                );
                // Check album completion after marking as skipped
                let number_of_downloaded = 0;
                const promises = album_tracks_state.map(async (album_track) => {
                    const track_downloaded = await AsyncStorage.getItem(`downloaded-track:${album_track.artist}-${album_track.album_name}-${album_track.name}`);
                    if (track_downloaded) { number_of_downloaded += 1; }
                });
                await Promise.all(promises);
                if (number_of_downloaded === album_tracks_state.length) {
                    setDownloadedAlbumIsFull(prev => !prev);
                }
                return;
            }
            // Actual download flow
            console.log("downloadhello", youtube_link);
            await downloadFile(youtube_link, album_track_state.name, title, album_track);
            await notifee.cancelNotification('complete');
            setIsDownloaded(true);
            // Update album completion status
            let number_of_downloaded = 0;
            const promises = album_tracks_state.map(async (album_track) => {
                const track_downloaded = await AsyncStorage.getItem(`downloaded-track:${album_track.artist}-${album_track.album_name}-${album_track.name}`);
                if (track_downloaded) { number_of_downloaded += 1; }
            });
            await Promise.all(promises);
            if (number_of_downloaded === album_tracks_state.length) {
                if (downloadalbumisfull === true) {
                    setDownloadedAlbumIsFull(false);
                } else {
                    setDownloadedAlbumIsFull(true);
                }
            }
        } finally {
            // Ensure spinner is hidden and downloading flag cleared
            setIsSongLoading(false);
            setIsDownloading(false);
        }
    }


    const playnowsong = async () => {
        // Prevent duplicate loading requests for streaming tracks
        if (!isDownloaded && getLoadingTrackId() !== null) {
            console.log("A song is already loading, ignoring press.");
            return;
        }
        const is_real_dl = isDownloaded && !isSkipped;
        // Only show spinner for non-downloaded tracks (local files play instantly)
        if (!is_real_dl) {
            setIsSongLoading(true);
        }
        try {
            // Always update current-tracks so autoplaynextsong knows the correct album order
            // (without this, skipping age-restricted songs jumps to wrong/random tracks)
            if (album_tracks_state && album_tracks_state.length > 0) {
                await AsyncStorage.setItem("current-tracks", JSON.stringify(album_tracks_state));
                await AsyncStorage.setItem("current-track", JSON.stringify(album_track_state));
            }
            // If this track is from a different album or playlist than the one currently
            // active, reset the queue so stale/expired yt-dlp URLs are cleared before
            // a fresh link is fetched. Same album/playlist = keep the cache.
            try {
                const activeTrackInd = await TrackPlayer.getActiveTrackIndex();
                if (activeTrackInd != null) {
                    const activeTrack = await TrackPlayer.getTrack(activeTrackInd);
                    const newContext = album_track_state.playlist_name || album_track_state.album_name;
                    const activeContext = activeTrack?.playlist_name || activeTrack?.album_name;
                    if (newContext && activeContext && newContext !== activeContext) {
                        console.log('Different album/playlist on press, resetting queue:', newContext);
                        await TrackPlayer.reset();
                    }
                }
            } catch (e) {
                console.log('resetIfDifferentContext error:', e);
            }

            await skipToTrack(album_track_state, 0);
        } finally {
            setIsSongLoading(false);
        }
    };

    const showplaylistoptions = async ()=>{
        console.log("playlist details",album_track_state)
        setTrackForPlaylist([album_track_state])
        handleModal()
    }
    const removetrackfromplaylist = async () =>{
      
        await AsyncStorage.setItem(`playlist:${playlist_details.playlist_name}`,JSON.stringify({"playlist_name":playlist_details.playlist_name,"playlist_thumbnail":playlist_details.playlist_thumbnail,"playlist_size":playlist_details.playlist_size -1}))
        await AsyncStorage.removeItem(`playlist-track:${playlist_details.playlist_name}-${album_track_state.name}`)
        await AsyncStorage.removeItem(`playlist-track-order:${playlist_details.playlist_name}-${album_track_state.name}`)

        const shuffled_tracks = await AsyncStorage.getItem(`shuffled-tracks:${playlist_details.playlist_name}`)
        if (shuffled_tracks){
            const shuffled_tracks_stored = JSON.parse(shuffled_tracks);
            const new_shuffled_tracks_stored = shuffled_tracks_stored.filter(obj => album_track_state.name !== obj.name);
            await AsyncStorage.setItem(`shuffled-tracks:${playlist_details.playlist_name}`,JSON.stringify(new_shuffled_tracks_stored))
            await AsyncStorage.setItem(`current-tracks`,JSON.stringify(new_shuffled_tracks_stored))
            

        }
        if (playlisttrackremoved === false){
            setPlaylistTrackRemoved(true)
        }
        else{
            setPlaylistTrackRemoved(false)
        }


    }
    const check_downloaded = async () => {
      const key = `downloaded-track:${album_track_state.artist}-${album_track_state.album_name}-${album_track_state.name}`;
      const track_downloaded = await AsyncStorage.getItem(key);
      if (track_downloaded) {
        const data = JSON.parse(track_downloaded);
        const skipped = data?.skipped === true;
        setIsDownloaded(true);
        setIsSkipped(skipped);
        if (!skipped) {
          // Only update thumbnail path for real downloads (file exists on disk)
          const newThumbnail =
            `file://${RNFS.DocumentDirectoryPath}/${convertToValidFilename(
              `${album_track_state.artist}-${album_track_state.album_name}-${album_track_state.name}`
            )}.jpg`;
          setAlbumTracksState(prev =>
            prev.map(track =>
              track.id === album_track_state.id
                ? { ...track, thumbnail: newThumbnail }
                : track
            )
          );
          setAlbumTrackState(prev => ({ ...prev, thumbnail: newThumbnail }));
        }
      } else {
        setIsDownloaded(false);
        setIsSkipped(false);
      }
    };
    const removedownload = async ()=>{
        try{
            await RNFS.unlink(`file://${MUSICSDCARDPATH}/${convertToValidFilename(`${album_track_state.artist}-${album_track_state.album_name}-${album_track_state.name}`)}.mp3`)
            await RNFS.unlink(`file://${RNFS.DocumentDirectoryPath}/${convertToValidFilename(`${album_track_state.artist}-${album_track_state.album_name}-${album_track_state.name}`)}.jpg`)
        }
        catch{

        }
        await AsyncStorage.removeItem(`downloaded-track:${album_track_state.artist}-${album_track_state.album_name}-${album_track_state.name}`)
        await AsyncStorage.removeItem(`downloaded-track-order:${album_track_state.artist}-${album_track_state.album_name}-${album_track_state.name}`)
        const numofdownloaded = await AsyncStorage.getItem("downloaded_num")
        if (numofdownloaded){
            let order = parseInt(numofdownloaded) - 1
            let keys = await AsyncStorage.getAllKeys()
            const items = await AsyncStorage.multiGet(keys.filter((key) =>{return(key.includes(`downloaded-track:`))}))
            await AsyncStorage.setItem("downloaded_num",JSON.stringify(items.length))
        
          }
        if (downloadwasremoved === true){
            setDownloadWasRemoved(false)
        }
        else{
            setDownloadWasRemoved(true)
        }
        let number_of_downloaded = 0
        const promises =  album_tracks_state.map(async(album_track) =>{
            const track_downloaded = await AsyncStorage.getItem(`downloaded-track:${album_track.artist}-${album_track.album_name}-${album_track.name}`)
            if (track_downloaded){
                number_of_downloaded +=1
                
            }
        })
        await Promise.all(promises)

        if (number_of_downloaded === 0){
            await AsyncStorage.removeItem(`library-downloaded:${album_tracks_state[0].album_name}|${album_tracks_state[0].artist}`)
        }

    }
    useEffect(() =>{
        check_downloaded()
    },[downloadwasremoved,removealldownloadsdone])

    
    const check_is_downloaded = async () => {
        const track_downloaded = await AsyncStorage.getItem(`downloaded-track:${album_track_state.artist}-${album_track_state.album_name}-${album_track_state.name}`)
        if (track_downloaded){
            const data = JSON.parse(track_downloaded);
            setIsDownloaded(true);
            setIsSkipped(data?.skipped === true);
        }
        else{
            setIsDownloaded(false);
            setIsSkipped(false);
        }
    }
    useEffect(() =>{
        check_is_downloaded()
    },[])
    useEffect(() => {
  const intervalId = setInterval(() => {
    check_is_downloaded();           // ← your function
    // or: checkDownloadStatus(), refreshLibrary(), etc.
  }, 2000);

  // Important: cleanup when component unmounts / deps change
  return () => {
    clearInterval(intervalId);
  };
}, []);   // ← empty deps = runs once on mount, interval lives until unmount


        
    return(
        <GestureDetector gesture={Gesture.Exclusive(flingleft)} style={{flex:1}}>
            <View style={{flex:1,flexDirection:"row",margin:10,alignItems:"center"}}>
            <TouchableOpacity style={{flex:1}} >
                <GestureDetector gesture={Gesture.Exclusive(doubleTap,longPress,singleTap)} >
                <View  style={{flex:1,flexDirection:"row",alignItems:"center"}}>
                <View style={{position: "relative", width: 60, height: 60}}>
                    <Image style={{borderRadius:5,width: 60, height: 60, opacity: isSongLoading ? 0.6 : 1}} source={{uri:!isDownloaded ?album_track_state.thumbnail: `file://${RNFS.DocumentDirectoryPath}/${convertToValidFilename(`${album_track_state.artist}-${album_track_state.album_name}-${album_track_state.name}`)}.jpg` }}></Image>
                    {isSongLoading && (
                        <View style={{position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 5}}>
                            <ActivityIndicator size="small" color="white" />
                        </View>
                    )}
                </View>

                <View style={{padding:6}}>

                </View>
                <View style={{flex:1}}>
                <Text style={{color:"white"}}>{album_track_state.name}</Text>
                <Text style={{color:"grey"}}>{album_track_state.artist}</Text>
                </View>
                </View>
                </GestureDetector>
                </TouchableOpacity>




                <View style={{flex:0.15,width:"100%",height:"100%",justifyContent:"center",alignItems:"center",flexDirection:"row",gap:20}}>
                <TouchableOpacity
                    onLongPress={() => { removedownload() }}
                    onPress={() => {                    // Unified press handler that prevents duplicate requests and shows spinner
                    const handlePress = async () => {
                        // If a download or load is already in progress, ignore subsequent taps
                        if (isDownloading || getLoadingTrackId() !== null) {
                            console.log('Action ignored: already loading/downloading');
                            return;
                        }
                        // Show spinner immediately
                        setIsSongLoading(true);
                        try {
                            if (!isDownloaded) {
                                // Not downloaded yet – initiate download
                                await downloadsong();
                                // After successful download, play the track
                                await playnowsong();
                            } else if (isSkipped) {
                                // Skipped placeholder – attempt download again
                                await downloadsong();
                                await playnowsong();
                            } else {
                                // Already downloaded – play directly
                                await playnowsong();
                            }
                        } finally {
                            // Hide spinner after operation completes
                            setIsSongLoading(false);
                        }
                    };
                    // Invoke the unified handler
                    handlePress();}}
                >
                    <MaterialCommunityIcons
                        name="download-circle-outline"
                        style={{
                            fontSize: 25,
                            color: isDownloading ? "green"
                                 : isSkipped    ? "#FFA500"   // orange = skipped/unavailable
                                 : isDownloaded ? "green"     // green  = real download
                                 : "white",
                            marginRight: 15
                        }}
                    />
                </TouchableOpacity>
                    <GestureDetector gesture={Gesture.Exclusive(showplaylistoptionsdoubleTap,togglemultiplaylistselectlongPress,toggleaddplaylistselectsinglePress)} onPress={() =>{}}>
                        <MaterialIcons name="playlist-add" size={24} color={trackforplaylist !== undefined && trackforplaylist.some(item => item.name === album_track_state.name) && multiplaylistselect === true ? "#7097d6":"white"} />
                    </GestureDetector>
                    
                    {addingqueue === true &&
                    <View style={{width:35,height:25,backgroundColor:"green"}}>

                    </View>}
                </View>

                
            </View>

        </GestureDetector>
    )

    }
