import { TouchableHighlight,Text,View,Image,TouchableOpacity } from "react-native"
import { useNavigate } from "react-router-native";
import Entypo from "react-native-vector-icons/Entypo"
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Gesture,GestureDetector,Swipeable } from "react-native-gesture-handler";
import { useEffect, useState } from "react";
import TrackPlayer from "react-native-track-player";
import RNFS from "react-native-fs";
export default function AllDownloadedPlaylistCard(){
    const getfiles = async () =>{
        const filedirs = await RNFS.readDir(RNFS.DocumentDirectoryPath);
        console.log(filedirs)
    }
    useEffect(() =>{
        getfiles()
    },[])


    return(
        <View style={{backgroundColor:"#141212",height:50,borderRadius: 5,borderWidth: 3,margin:5,borderColor:"#141212",flexDirection:"row",}}>
            
        <View   style={{backgroundColor:"#141212",flexDirection:"row",justifyContent:"center",alignItems:"center",flex:1}}>
            <TouchableOpacity onLongPress={() =>{removeplaylist()}} style={{flexDirection:"row",flex:1}} onPress={() =>{getfiles()}}>
            <View style={{flexDirection:"row",flex:1}}>
            <Image style={{borderRadius:5,width: 50, height: 50}} source={{uri:"https://img.freepik.com/premium-vector/download-icon-vector-illustration-install-symbol_654297-207.jpg?w=1380"}}></Image>
            <Text style={{color:"white",width:500,position:"relative",top:15,left:10}}>
                    Downloaded Songs | 30 Tracks
            </Text>
  
            

            </View>
            </TouchableOpacity>




        </View>



            


       
    </View>
    )
}
