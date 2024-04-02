import { View,Text,Image, TouchableOpacity } from "react-native"
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import axios from "axios";
import { useNavigate } from "react-router-native";
import { Pressable } from "react-native";
export default function CarouselItem({spotifyid,access_token,favouritecards,thumbnail,album_name,artist_name,total_tracks,release_date,album_type}){
    const navigate = useNavigate();
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    const getalbumtracks = async () =>{

        const headers = {Authorization: `Bearer ${access_token}`}
        const resp = await fetch(`https://api.spotify.com/v1/albums/${spotifyid}`, {headers: headers})
        const feedresult = await resp.json()
        let album_tracks = feedresult.tracks.items.map((track) =>{return({"album_name":album_name,"name":track.name,"id":track.id,"artist":track.artists[0].name,"thumbnail":thumbnail,"track_number":track.track_number,"duration_ms":track.duration_ms})})
        navigate("/tracks", { state: album_tracks });
        //console.log(access_token)

    }
    /*
    
  */
    return(
        <Pressable onPress={() =>{getalbumtracks()}}>
        <View style={{backgroundColor:"white",width:300,height:favouritecards ? 50 : 300,borderRadius: 5,borderWidth: 3,flexBasis:"47%",margin:5,borderColor:"#141212"}}>
        
            <View  key={album_name} style={{backgroundColor:"#141212",flexDirection:favouritecards === true ? "row":"column",justifyContent:favouritecards === true ? "center":"flex-start",alignItems:favouritecards === true ? "center": "stretch",flex:1}}>
                <View style={{flex:favouritecards ? 0.5 : 1}}>
                    <Image style={{width: '100%', height: '100%'}} source={{uri:thumbnail}}></Image>
                </View>
                <View style={{padding:10}}>
                </View>
                <Text style={{color:"white"}}>
                    {album_name} | {capitalizeFirstLetter(album_type)}
                </Text>
                <Text>
                    Artist: {artist_name}
                </Text>


                <Text>
                    Total Tracks: {total_tracks}
                </Text>
                <Text>
                    Release Date: {release_date}
                </Text>
                <TouchableOpacity>
                <MaterialIcons name="my-library-add" style={{fontSize:25,color:"white",alignSelf:"flex-end"}}/>
                </TouchableOpacity>
            


            </View>
        
                

    
    </View>
    </Pressable>)
    
}