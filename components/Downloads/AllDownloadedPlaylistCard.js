import { TouchableHighlight,Text,View,Image,TouchableOpacity } from "react-native"
import { useNavigate } from "react-router-native";
import Entypo from "react-native-vector-icons/Entypo"
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Gesture,GestureDetector,Swipeable } from "react-native-gesture-handler";
import { useEffect, useState } from "react";
import TrackPlayer from "react-native-track-player";
import RNFS from "react-native-fs";
export default function AllDownloadedPlaylistCard(){
    const navigate = useNavigate();
    const [num_of_tracks,setNumOfTracks] = useState("");
    const getfiles = async () =>{
        const filedirs = await RNFS.readDir(RNFS.DocumentDirectoryPath);
        //console.log(filedirs)
        navigate("/downloaded-playlist-tracks")
    }
    const get_num_of_tracks = async () =>{
        const num_tracks = await AsyncStorage.getItem("downloaded_num")
        setNumOfTracks(num_tracks)
        
    }
    useEffect(() =>{
        get_num_of_tracks()
    },[])



    return(
        <View style={{backgroundColor:"#141212",height:50,borderRadius: 5,borderWidth: 3,margin:5,borderColor:"#141212",flexDirection:"row",}}>
            
        <View   style={{backgroundColor:"#141212",flexDirection:"row",justifyContent:"center",alignItems:"center",flex:1}}>
            <TouchableOpacity onLongPress={() =>{removeplaylist()}} style={{flexDirection:"row",flex:1}} onPress={() =>{getfiles()}}>
            <View style={{flexDirection:"row",flex:1}}>
            <Image style={{borderRadius:5,width: 50, height: 45}} source={require('../../assets/Download.png')}></Image>
            <Text style={{color:"white",width:500,position:"relative",top:15,left:10}}>
                    Downloaded Songs | {num_of_tracks ? parseInt(num_of_tracks) +1: 0} Tracks
            </Text>
  
            

            </View>
            </TouchableOpacity>




        </View>



            


       
    </View>
    )
}
