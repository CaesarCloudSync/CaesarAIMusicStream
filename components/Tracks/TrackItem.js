import { View,Text,Image,TouchableOpacity, Alert } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import AntDesign from "react-native-vector-icons/AntDesign"
import { getaudio } from "./getstreamlinks";
import { useEffect, useState } from "react";
import { getTableNames } from "../SQLDB/SQLDB";
import Entypo from "react-native-vector-icons/Entypo"
import { connectToDatabase } from "../SQLDB/SQLDB";
import { getyoutubelink } from "./getstreamlinks";
import {downloadFile}from "./DownloadSong";
import TrackPlayer,{RepeatMode} from "react-native-track-player";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getstreaminglink } from "./getstreamlinks";
import { Gesture,GestureDetector,Swipeable,Directions } from "react-native-gesture-handler";

import { skipToTrack } from "../controls/controls";
import { useNavigate } from "react-router-native";
import RNFS from "react-native-fs";
export default function TrackItem({album_track,setCurrentTrack,index,num_of_tracks,album_tracks,trackforplaylist,setTrackForPlaylist,handleModal,playlist_details,playlisttrackremoved,setPlaylistTrackRemoved}){
    const navigate = useNavigate()
    const [isDownloading,setIsDownloading] = useState(false);
    const [album_track_state,setAlbumTrackState] = useState(album_track)
    const [album_tracks_state,setAlbumTracksState] = useState(album_tracks)
    const [addedtoqueue,setAddedToQueue] = useState(false);
    const [songIsAvailable,setSongIsAvailable] = useState(true);
    const [isDownloaded,setIsDownloaded] = useState(false);
    const navartistprofileplaylist = async () =>{
        //await AsyncStorage.setItem(`artist:${album_tracks_state[0].artist_name}`,JSON.stringify({"artist_id":album_tracks_state[0].artist_id}))
        navigate("/artistprofile",{state:[album_track_state]})
    }
    const singleTap = Gesture.Tap().onEnd((_event,success) =>{
        if (success){
            playnowsong()
        }
    })
    const doubleTap = Gesture.Tap().numberOfTaps(2).onEnd((_event,success) =>{
        if (success){
            if(playlist_details){navartistprofileplaylist()}
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

    function timeout(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    const flingleft = Gesture.Fling()
    .direction(Directions.LEFT )
    .onEnd(async (event) => {
        setAddingQueue(true)
        const queue = await AsyncStorage.getItem("queue")
        if (!queue){
        let currentTrackInd = await  TrackPlayer.getCurrentTrack()
        let currentTrack = await TrackPlayer.getTrack(currentTrackInd)
        const stored_album_tracks = await AsyncStorage.getItem("current-tracks")
        if (stored_album_tracks){
            const current_album_tracks = JSON.parse(stored_album_tracks)
            const currentTrackIndexInaAlbum = current_album_tracks.findIndex(track => track.id == currentTrack.id)
            let next_track_index =  currentTrackIndexInaAlbum+1 == current_album_tracks.length  ? 0 : currentTrackIndexInaAlbum+1
            //console.log(album_tracks_state.length,next_track_index,currentTrackIndexInaAlbum+1,"hack")
            await AsyncStorage.setItem("track_after_queue",JSON.stringify(next_track_index))
        }

        await AsyncStorage.setItem("queue",JSON.stringify([album_tracks_state[index]]))
        
        }
        else{
       
            let queue_json = JSON.parse(queue)
            queue_json.push(album_tracks_state[index])

            await AsyncStorage.setItem("queue",JSON.stringify(queue_json))
        }
        setAddedToQueue(true)
        await timeout(1200);
        setAddingQueue(false)

        //addtolibrary()
        /*setTimeout(() =>{
            //console.log("jo")
            
        },300) */  })
    const downloadsong = async () =>{
        setIsDownloading(true)
        const [youtube_link,title] = await getstreaminglink(album_track_state)
        await downloadFile(youtube_link,album_track_state.name,title,album_track_state)
        setIsDownloading(false)

    }
    const playnowsong = async () =>{
        await TrackPlayer.setRepeatMode(RepeatMode.Off);
        const stored_album_tracks = await AsyncStorage.getItem("current-tracks")
        if (stored_album_tracks){
            const album_tracks_stored = JSON.parse(stored_album_tracks)
            await AsyncStorage.setItem("current-tracks",JSON.stringify(album_tracks_state))
            //console.log(album_tracks_stored[0].album_name,album_tracks_state[0].name)
            if (album_tracks_stored[0].album_name !== album_tracks_state[0].album_name){
                
                await TrackPlayer.reset();
            }

        }
        else{
            await AsyncStorage.setItem("current-tracks",JSON.stringify(album_tracks_state))
        }

        let currentTrackInd = await  TrackPlayer.getCurrentTrack()
        console.log("current",currentTrackInd)
        let currentTrack = await TrackPlayer.getTrack(currentTrackInd)
        if (currentTrack !== null){
            let next_track_ind = (currentTrack.index+ 1) >= num_of_tracks ? 0 : currentTrack.index+ 1
            console.log("next",next_track_ind,num_of_tracks)
        
            let nextsong = album_track_state
    
            await skipToTrack(nextsong,next_track_ind)
        }
        else{
            let next_track_ind = 0
        
            let nextsong = album_track_state

            await skipToTrack(nextsong,next_track_ind)
        }

        

       
    }
    const showplaylistoptions = async ()=>{
        setTrackForPlaylist(album_track_state)
        handleModal()
    }
    const removetrackfromplaylist = async () =>{
      
        await AsyncStorage.setItem(`playlist:${playlist_details.playlist_name}`,JSON.stringify({"playlist_name":playlist_details.playlist_name,"playlist_thumbnail":playlist_details.playlist_thumbnail,"playlist_size":playlist_details.playlist_size -1}))
        await AsyncStorage.removeItem(`playlist-track:${playlist_details.playlist_name}-${album_track_state.name}`)
        await AsyncStorage.removeItem(`playlist-track-order:${playlist_details.playlist_name}-${album_track_state.name}`)
        if (playlisttrackremoved === false){
            setPlaylistTrackRemoved(true)
        }
        else{
            setPlaylistTrackRemoved(false)
        }

    }
    const check_downloaded = async () =>{
        const track_downloaded = await AsyncStorage.getItem(`downloaded-track:${album_track_state.name}`)
        if (track_downloaded){
            setIsDownloaded(true);
    
            let new_album_track_state = Object.assign(album_track_state, {
                thumbnail: `file://${RNFS.DocumentDirectoryPath}/${album_track_state.name}.jpg` 
             })
            setAlbumTracksState(prevalbumtracks => { return [...prevalbumtracks, new_album_track_state]; });
            setAlbumTrackState(prevalbumtrack => ({...prevalbumtrack, thumbnail: `file://${RNFS.DocumentDirectoryPath}/${album_track_state.name}.jpg` }))

        }
        else{
            setIsDownloaded(false)
        }

    }
    useEffect(() =>{
        check_downloaded()
    },[])



        
    return(
        <GestureDetector gesture={Gesture.Exclusive(flingleft)} style={{flex:1}}>
            <View style={{flex:1,flexDirection:"row",margin:10,alignItems:"center"}}>
            <TouchableOpacity style={{flex:1}} >
                <GestureDetector gesture={Gesture.Exclusive(doubleTap,longPress,singleTap)} >
                <View  style={{flex:1,flexDirection:"row",alignItems:"center"}}>
                <Image style={{borderRadius:5,width: 60, height: 60}} source={{uri:!isDownloaded ?album_track_state.thumbnail: `file://${RNFS.DocumentDirectoryPath}/${album_track_state.name}.jpg` }}></Image>

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
                    <TouchableOpacity onPress={()=>{if (isDownloaded === false && isDownloading === false){downloadsong()}}}>
                        <MaterialCommunityIcons name="download-circle-outline" style={{fontSize:25,color:(isDownloaded === true || isDownloading === true)? "green" : "white",marginRight:15}}/>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() =>{showplaylistoptions()}}>
                        <MaterialIcons name="playlist-add" size={24} color="white" />
                    </TouchableOpacity>
                    
                    {addingqueue === true &&
                    <View style={{width:35,height:25,backgroundColor:"green"}}>

                    </View>}
                </View>

                
            </View>

        </GestureDetector>
    )
    
}