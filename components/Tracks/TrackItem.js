import { View,Text,Image,TouchableOpacity, Alert } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import AntDesign from "react-native-vector-icons/AntDesign"
import { getaudio } from "./getstreamlinks";
import { useState } from "react";
import { getTableNames } from "../SQLDB/SQLDB";
import Entypo from "react-native-vector-icons/Entypo"
import { connectToDatabase } from "../SQLDB/SQLDB";
import { getyoutubelink } from "./getstreamlinks";
import addSong from "./DownloadSong";
export default function TrackItem({album_track,setCurrentTrack,highlightMusicIcon}){
    const [songIsAvailable,setSongIsAvailable] = useState(true);
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
    const downloadsong = async () =>{
        const youtube_link = await getyoutubelink(album_track,download=true);
        //console.log(youtube_link)
        await addSong(youtube_link)

    }
        
    return(
        <View style={{flex:1}}>
            <View style={{flex:1,flexDirection:"row",margin:10,alignItems:"center"}}>
                <TouchableOpacity onPress={() =>{highlightMusicIcon();getaudio(album_track,setCurrentTrack)}} style={{flex:1,flexDirection:"row",alignItems:"center"}}>
                <Image style={{width: 60, height: 60}} source={{uri:album_track.thumbnail}}></Image>

                <View style={{padding:6}}>

                </View>
                <View style={{flex:1}}>
                <Text style={{color:"white"}}>{album_track.name}</Text>
                <Text style={{color:"grey"}}>{album_track.artist}</Text>
                </View>
                </TouchableOpacity>
                {
                    songIsAvailable === true?

                <TouchableOpacity onPress={() =>{storeasunavailable()}} style={{flex:0.1,width:"100%",height:"100%",justifyContent:"center",alignItems:"center"}}>
                <AntDesign  name="checksquare" style={{fontSize:25,color:"green"}}/>

                    
                </TouchableOpacity>:
                <TouchableOpacity onPress={() =>{storeasunavailable()}} style={{flex:0.1,width:"100%",height:"100%",justifyContent:"center",alignItems:"center"}}>
                <Entypo  name="squared-cross" style={{fontSize:25,color:"red"}}/>

                    
                </TouchableOpacity>

                }


                <TouchableOpacity style={{flex:0.1,width:"100%",height:"100%",justifyContent:"center",alignItems:"center"}}>
                <MaterialIcons name="my-library-add" style={{fontSize:25,color:"white"}}/>

                </TouchableOpacity>
                <TouchableOpacity onPress={()=>{downloadsong()}}style={{flex:0.1,width:"100%",height:"100%",justifyContent:"center",alignItems:"center"}}>
                <MaterialCommunityIcons name="download-circle-outline" style={{fontSize:25,color:"white"}}/>

                    
                </TouchableOpacity>
                
            </View>

        </View>
    )
    
}