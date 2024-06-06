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
import addSong from "./DownloadSong";
import TrackPlayer,{RepeatMode} from "react-native-track-player";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getstreaminglink } from "./getstreamlinks";
import { Gesture,GestureDetector,Swipeable,Directions } from "react-native-gesture-handler";

import { skipToTrack } from "../controls/controls";
export default function TrackItem({album_track,setCurrentTrack,index,num_of_tracks,album_tracks}){
    const [addedtoqueue,setAddedToQueue] = useState(false);
    const [songIsAvailable,setSongIsAvailable] = useState(true);
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
        await AsyncStorage.setItem("queue",JSON.stringify([album_tracks[index]]))
        }
        else{
       
            let queue_json = JSON.parse(queue)
            queue_json.push(album_tracks[index])

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
        const youtube_link = await getyoutubelink(album_track,download=true);
        await addSong(youtube_link)

    }
    const playnowsong = async () =>{
        await TrackPlayer.setRepeatMode(RepeatMode.Off);
        const stored_album_tracks = await AsyncStorage.getItem("current-tracks")
        //console.log(stored_album_tracks)
        if (stored_album_tracks){
            const album_tracks_stored = JSON.parse(stored_album_tracks)
            await AsyncStorage.setItem("current-tracks",JSON.stringify(album_tracks))
            //console.log(album_tracks_stored[0].album_name,album_tracks[0].name)
            if (album_tracks_stored[0].album_name !== album_tracks[0].album_name){
                
                await TrackPlayer.reset();
            }

        }
        else{
            await AsyncStorage.setItem("current-tracks",JSON.stringify(album_tracks))
        }

        let currentTrackInd = await  TrackPlayer.getCurrentTrack()
        console.log("current",currentTrackInd)
        let currentTrack = await TrackPlayer.getTrack(currentTrackInd)
        if (currentTrack !== null){
            let next_track_ind = (currentTrack.index+ 1) >= num_of_tracks ? 0 : currentTrack.index+ 1
            console.log("next",next_track_ind,num_of_tracks)
        
            let nextsong = album_track
            await skipToTrack(nextsong,next_track_ind)
        }
        else{
            let next_track_ind = 0
        
            let nextsong = album_track
            
            await skipToTrack(nextsong,next_track_ind)
        }

       
    }



        
    return(
        <GestureDetector gesture={Gesture.Exclusive(flingleft)} style={{flex:1}}>
            <View style={{flex:1,flexDirection:"row",margin:10,alignItems:"center"}}>
                <TouchableOpacity onPress={() =>{playnowsong()}} style={{flex:1,flexDirection:"row",alignItems:"center"}}>
                <Image style={{width: 60, height: 60}} source={{uri:album_track.thumbnail}}></Image>

                <View style={{padding:6}}>

                </View>
                <View style={{flex:1}}>
                <Text style={{color:"white"}}>{album_track.name}</Text>
                <Text style={{color:"grey"}}>{album_track.artist}</Text>
                </View>
                </TouchableOpacity>




                <View style={{flex:0.15,width:"100%",height:"100%",justifyContent:"center",alignItems:"center",flexDirection:"row",gap:20}}>
                    <TouchableOpacity onPress={()=>{downloadsong()}}>
                        <MaterialCommunityIcons name="download-circle-outline" style={{fontSize:25,color:"white",marginRight:15}}/>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() =>{}}>
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