import { useState } from "react"
import { View,Text, FlatList,Image, TouchableOpacity} from "react-native"
import { useLocation,useNavigate } from "react-router-native"
import NavigationFooter from "../NavigationFooter/NavigationFooter";
import TrackItem from "./TrackItem";
import AntDesign from "react-native-vector-icons/AntDesign"
import CircularQueue from "./CircularQueue";
export default function Tracks(){
    const location = useLocation();
    const navigate = useNavigate();
    
    const [album_tracks,setAlbumTracks] = useState(location.state);
    const [trackqueue,setTrackQueue] = useState(new CircularQueue(album_tracks.length,album_tracks))

    return(
        <View style={{flex:1,backgroundColor:"#141212"}}>
            <TouchableOpacity onPress={() =>{navigate("/")}}>
            <AntDesign name="arrowleft" style={{fontSize:30}}/>
            </TouchableOpacity>
            
 
            <View style={{justifyContent:"center",alignItems:"center",flex:0.4}}>
                <Image style={{width: 175, height: 175}} source={{uri:album_tracks[0].thumbnail}}></Image>

            </View>
            <View style={{flex:0.1,justifyContent:"center",alignItems:"center"}}>
                    <Text style={{color:"white",fontSize:20}}>{album_tracks[0].album_name}</Text>
            </View>
            <FlatList 
            data={album_tracks}
            style={{flex:1,backgroundColor:"#141212"}}
            renderItem={({item}) =><TrackItem trackqueue={trackqueue} album_tracks={album_tracks} album_track={item}/>}
            />
  
            <NavigationFooter currentpage={"home"}/>
        </View>
    )

}