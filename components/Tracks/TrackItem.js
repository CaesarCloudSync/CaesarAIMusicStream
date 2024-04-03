import { View,Text,Image,TouchableOpacity, Alert } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

import { getaudio } from "./getstreamlinks";
export default function TrackItem({album_track,setCurrentTrack}){

        
    return(
        <View style={{flex:1}}>
            <View style={{flex:1,flexDirection:"row",margin:10,alignItems:"center"}}>
                <TouchableOpacity onPress={() =>{getaudio(album_track,setCurrentTrack)}} style={{flex:1,flexDirection:"row",alignItems:"center"}}>
                <Image style={{width: 60, height: 60}} source={{uri:album_track.thumbnail}}></Image>

                <View style={{padding:6}}>

                </View>
                <View style={{flex:1}}>
                <Text style={{color:"white"}}>{album_track.name}</Text>
                <Text style={{color:"grey"}}>{album_track.artist}</Text>
                </View>
                </TouchableOpacity>
                <View style={{flex:0.1,width:"100%",height:"100%",justifyContent:"center",alignItems:"center"}}>
                <MaterialIcons name="my-library-add" style={{fontSize:25,color:"white"}}/>

                </View>
                <View style={{flex:0.1,width:"100%",height:"100%",justifyContent:"center",alignItems:"center"}}>
                <MaterialIcons name="my-library-add" style={{fontSize:25,color:"white"}}/>

                    
                </View>
                
            </View>

        </View>
    )
    
}