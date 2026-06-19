import { View,Text,Image, TouchableOpacity,Vibration } from "react-native"
import { useRef, useState } from "react";
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import axios from "axios";
import { useNavigate} from "react-router-native";
import { TouchableHighlight} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Gesture,GestureDetector,Swipeable,Directions } from "react-native-gesture-handler";

export default function PlaylistCarouselItem({access_token, favouritecards,playlistid,thumbnail, playlist_name,total_tracks,album_type}){
    const [addingtolibrary,setAddingToLibrary] = useState(false);
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    const singleTap = Gesture.Tap().onEnd((_event,success) =>{
        if (success){
            getalbumtracks(`/tracks`)
        }
    })
    


    const longPress = Gesture.LongPress().onStart(async (_event,success) =>{
        try {
            let playlist_card = {"name":playlist_name,"id":playlistid,"images":[{"url":thumbnail}],"album_type":album_type}
            await AsyncStorage.setItem(`playlist-recent-load:${playlist_name}`,JSON.stringify(playlist_card)) 
            navigate("/search")
        } catch (e) {
            console.error("Error in playlist long press:", e);
        }
    })
    
    const navigate = useNavigate();

    const getalbumtracks = async (route) =>{
        const headers = {Authorization: `Bearer ${access_token}`}
        const resp = await fetch(`https://api.spotify.com/v1/playlists/${playlistid}`, {headers: headers})
        const feedresult = await resp.json()
        let album_tracks = feedresult.tracks.items.map((trackitem) =>{let track = trackitem.track;return({"playlist_thumbnail":thumbnail,"playlist_id":feedresult.id,"playlist_name":playlist_name,"album_id":track.album.id,"album_name":track.album.name,"name":track.name,"id":track.id,"artist":track.artists[0].name,"artist_id":track.artists[0].id,"thumbnail":track.album.images[0].url,"track_number":track.track_number,"duration_ms":track.duration_ms})})
        navigate(route, { state: {"album_tracks":album_tracks} });
    }

    if (favouritecards !== true) {
        return (
            <View style={{backgroundColor:"#141212",width:185,height:300,borderRadius: 5,borderWidth: 3,margin:5,borderColor:"#141212"}}>
                <GestureDetector gesture={Gesture.Exclusive(longPress,singleTap)}>
                    <View key={playlist_name} style={{backgroundColor:"#141212",flexDirection:"column",justifyContent:"flex-start",alignItems:"stretch",flex:1}}>
                        <View style={{flex:1}}>
                            <Image style={{borderRadius:5,width: '100%', height: '100%'}} source={{uri:thumbnail}}></Image>
                        </View>
                        <View style={{padding:10}}>
                        </View>
                        <Text style={{color:"white",fontWeight:"bold",fontSize:14}} numberOfLines={2}>
                            {playlist_name}
                        </Text>
                        <Text style={{color:"grey",fontSize:12}}>
                            {capitalizeFirstLetter(album_type)}
                        </Text>
                        <Text style={{color:"grey",fontSize:12}}>
                            Tracks: {total_tracks}
                        </Text>
                    </View>
                </GestureDetector>
            </View>
        );
    } else {
        return(
            <View  key={playlist_name}style={{backgroundColor:"#141212",width:200,height:50,borderRadius: 5,borderWidth: 3,flexBasis:"47%",margin:5,borderColor:"#141212"}}>
            <GestureDetector gesture={Gesture.Exclusive(longPress,singleTap)}>
            <View   style={{backgroundColor:!addingtolibrary ? "#141212" : "grey",flexDirection:"row",justifyContent:"center",alignItems:"center",flex:1}}>
                <View style={{flex:favouritecards ? 0.5 : 1}}>
                    <Image style={{borderRadius:2,width: '100%', height: '100%'}} source={{uri:thumbnail}}></Image>
                </View>
                <View style={{padding:10}}>
                </View>
                <Text style={{color:"white",flex:favouritecards ? 1 : 0.15}}>
                    {playlist_name} | {capitalizeFirstLetter(album_type)}
                </Text>
            </View>
            </GestureDetector>
            </View>
        )
    }
    
        
    
    


    
}