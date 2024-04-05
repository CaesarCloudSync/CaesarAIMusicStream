import { View,Text,Image, TouchableOpacity,Vibration } from "react-native"
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import axios from "axios";
import { useNavigate } from "react-router-native";
import { TouchableHighlight} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";


export default function CarouselItem({spotifyid,access_token,favouritecards,thumbnail,album_name,artist_name,total_tracks,release_date,album_type}){
    const navigate = useNavigate();
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    const getalbumtracks = async (route) =>{

        const headers = {Authorization: `Bearer ${access_token}`}
        const resp = await fetch(`https://api.spotify.com/v1/albums/${spotifyid}`, {headers: headers})
        const feedresult = await resp.json()
        let album_tracks = feedresult.tracks.items.map((track) =>{return({"album_id":feedresult.id,"album_name":album_name,"name":track.name,"id":track.id,"artist":track.artists[0].name,"thumbnail":thumbnail,"track_number":track.track_number,"duration_ms":track.duration_ms})})
        navigate(route, { state: album_tracks });
        //console.log(access_token)

    }
    const addtolibrary = async () =>{
        const headers = {Authorization: `Bearer ${access_token}`}
        const resp = await fetch(`https://api.spotify.com/v1/albums/${spotifyid}`, {headers: headers})
        const feedresult = await resp.json()
        let album_tracks = feedresult.tracks.items.map((track) =>{return({"album_id":feedresult.id,"album_name":album_name,"name":track.name,"id":track.id,"artist":track.artists[0].name,"thumbnail":thumbnail,"track_number":track.track_number,"duration_ms":track.duration_ms})})
        let library = await AsyncStorage.getItem(JSON.stringify(`library:${album_name}|${artist_name}`)) 
        if (!library){
            await AsyncStorage.setItem(`library:${album_name}|${artist_name}`,JSON.stringify(album_tracks))
        }
        navigate("/library")
        
    }
    /*
    
  */
    if (favouritecards !== true){
        return(
            <TouchableHighlight onLongPress={()=>{addtolibrary()}} onPress={() =>{getalbumtracks("/tracks")}}>
            <View style={{backgroundColor:"white",width:favouritecards === true ? 50 : (favouritecards === false ? 200 : 300),height:favouritecards === true ? 50 : (favouritecards === false ? 300 : 300),borderRadius: 5,borderWidth: 3,margin:5,borderColor:"#141212"}}>
            
                <View  key={album_name} style={{backgroundColor:"#141212",flexDirection:favouritecards === true ? "row":"column",justifyContent:favouritecards === true ? "flex-start":"flex-start",alignItems:favouritecards === true ? "stretch": "stretch",flex:1}}>
                    <View style={{flex:favouritecards === true ? 0.5 : (favouritecards === false ? 1 : 1)}}>
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
                    {favouritecards !== true&&
                    <View>
    
                    <Text>
                        Total Tracks: {total_tracks}
                    </Text>
                    <Text>
                        Release Date: {release_date}
                    </Text>

                        </View>}
    
    
                
    
    
                </View>
            
                    
    
        
        </View>
        </TouchableHighlight>)
    }
    else{
        return(
        <TouchableHighlight onLongPress={()=>{addtolibrary()}}  onPress={() =>{getalbumtracks("/tracks")}} key={album_name}style={{backgroundColor:"#141212",width:100,height:50,borderRadius: 5,borderWidth: 3,flexBasis:"47%",margin:5,borderColor:"#141212"}}>
        <View   style={{backgroundColor:"#141212",flexDirection:"row",justifyContent:"center",alignItems:"center",flex:1}}>
            <View style={{flex:favouritecards ? 0.5 : 1}}>
                <Image style={{width: '100%', height: '100%'}} source={{uri:thumbnail}}></Image>
            </View>
            <View style={{padding:10}}>
            </View>
            <Text style={{color:"white",flex:favouritecards ? 1 : 0.15}}>
                {album_name} | {capitalizeFirstLetter(album_type)}
            </Text>
        
            {favouritecards === false &&
                <Text>
                Artist: {artist_name}
                </Text>}
                {favouritecards === false &&
            <View>
                            
                <Text>
                    Total Tracks: {total_tracks}
                </Text>
                <Text>
                    Release Date: {release_date}
                </Text>
                <TouchableOpacity onPress={() =>{console.log("hi")}}>
                <MaterialIcons name="my-library-add" style={{fontSize:25,color:"white",alignSelf:"flex-end"}}/>
                </TouchableOpacity>
                </View>
            }

            





        </View>
        
    </TouchableHighlight>)

    }

    
}