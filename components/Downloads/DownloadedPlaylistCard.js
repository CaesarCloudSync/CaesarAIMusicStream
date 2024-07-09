import { TouchableHighlight,Text,View,Image,TouchableOpacity } from "react-native"
import { useNavigate } from "react-router-native";
import Entypo from "react-native-vector-icons/Entypo"
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Gesture,GestureDetector,Swipeable } from "react-native-gesture-handler";
import { useState } from "react";
import TrackPlayer from "react-native-track-player";

export default function DownloadedPlaylistCard({downloadedplaylist,index,setDownloadedPlaylistChanged,downloadedplaylistchanged}){
    const [downloadedplayliststate,setdownloadedPlaylistState] = useState(downloadedplaylist)
    console.log(downloadedplayliststate)



    const navigate = useNavigate();
    const getalbumtracks = async (route) =>{
        console.log(downloadedplaylist)
        let keys = await AsyncStorage.getAllKeys()
        const items = await AsyncStorage.multiGet(keys.filter((key) =>{return(key.includes(`downloadedplaylist-track:${downloadedplayliststate.downloaded_playlist_name}`))}))
        const downloaded_playlist_tracks = items.map((item) =>{return(JSON.parse(item[1]))})
        console.log(downloaded_playlist_tracks,"nav tracks")
        ///navigate(route, { state: {downloaded_playlist_details:downloadedplaylist,downloaded_playlist_tracks:downloaded_playlist_tracks}});

    }
    const addtracktoplaylist = async () =>{
            trackforplaylist["downloaded_playlist_local"] = "true"
            trackforplaylist["downloaded_playlist_name"] =downloadedplayliststate.downloaded_playlist_name
         
            await AsyncStorage.setItem(`downloadedplaylist-track:${downloadedplayliststate.downloaded_playlist_name}-${trackforplaylist.name}`,JSON.stringify(trackforplaylist))
            let keys = await AsyncStorage.getAllKeys()
            const items = await AsyncStorage.multiGet(keys.filter((key) =>{return(key.includes(`downloadedplaylist-track:${downloadedplayliststate.downloaded_playlist_name}`))}))
            const downloaded_playlist_tracks = items.map((item) =>{return(JSON.parse(item[1]))})
            const num_of_tracks = downloaded_playlist_tracks.length
            await AsyncStorage.setItem(`downloadedplaylist:${downloadedplayliststate.downloaded_playlist_name}`,JSON.stringify({"downloaded_playlist_name":downloadedplayliststate.downloaded_playlist_name,"downloaded_playlist_thumbnail":downloadedplayliststate.downloaded_playlist_thumbnail,"downloaded_playlist_size":num_of_tracks}))
            await AsyncStorage.setItem(`downloadedplaylist-track-order:${downloadedplayliststate.downloaded_playlist_name}-${trackforplaylist.name}`,JSON.stringify({"name":trackforplaylist.name,"order":num_of_tracks -1}))
            setdownloadedPlaylistState({...downloadedplayliststate,"downloaded_playlist_size":num_of_tracks})
            handleModal()
            if (downloadedplaylistchanged === false){
                setDownloadedPlaylistChanged(true)
            }
            else{
                setDownloadedPlaylistChanged(false)
            }
           
            //navigate("/playlists")
    
        
    }
    const removeplaylist = async () =>{
        //console.log( await AsyncStorage.multiGet(keys.filter((key) =>{return(key.includes("downloadedplaylist:"))})))
        // {"downloaded_playlist_name": "Jam", "downloaded_playlist_size": 1, "downloaded_playlist_thumbnail": "https://i.scdn.co/image/ab67616d0000b2733b9f8b18cc685e1502128aa8"} 
        await AsyncStorage.removeItem(`downloadedplaylist:${downloadedplayliststate.downloaded_playlist_name}`)
        let keys = await AsyncStorage.getAllKeys()
        await AsyncStorage.multiRemove(keys.filter((key) =>{return(key.includes(`downloadedplaylist-track:${downloadedplayliststate.downloaded_playlist_name}`))})) 
        await AsyncStorage.multiRemove(keys.filter((key) =>{return(key.includes(`downloadedplaylist-track-order:${downloadedplayliststate.downloaded_playlist_name}`))})) 
        if (downloadedplaylistchanged === false){
            setDownloadedPlaylistChanged(true)
        }
        else{
            setDownloadedPlaylistChanged(false)
        }

    }
    return(
        <View key={index}style={{backgroundColor:"#141212",height:50,borderRadius: 5,borderWidth: 3,flexBasis:"47%",margin:5,borderColor:"#141212",flexDirection:"row",}}>
            
        <View   style={{backgroundColor:"#141212",flexDirection:"row",justifyContent:"center",alignItems:"center",flex:1}}>
            <TouchableOpacity onLongPress={() =>{removeplaylist()}} style={{flexDirection:"row",flex:1}} onPress={() =>{  getalbumtracks(`/downloaded-playlist-tracks`)}}>
            <View style={{flexDirection:"row",flex:1}}>
            <Image style={{borderRadius:5,width: 50, height: 50}} source={{uri:downloadedplayliststate.downloaded_playlist_thumbnail}}></Image>
            <Text style={{color:"white",width:500,position:"relative",top:15,left:10}}>
                    {downloadedplayliststate.downloaded_playlist_name} | {downloadedplayliststate.downloaded_playlist_size} Tracks
            </Text>
  
            

            </View>
            </TouchableOpacity>




        </View>



            


       
    </View>
    )
}
