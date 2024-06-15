import { View,Text,Image, TouchableOpacity,Vibration } from "react-native"
import { useRef, useState } from "react";
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import axios from "axios";
import { useNavigate} from "react-router-native";
import { TouchableHighlight} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Gesture,GestureDetector,Swipeable,Directions } from "react-native-gesture-handler";

export default function CarouselItem({spotifyid,access_token,favouritecards,thumbnail,album_name,artist_name,total_tracks,release_date,album_type,toptrack,recentalbums,setRecentAlbums}){
    const [addingtolibrary,setAddingToLibrary] = useState(false);
    const singleTap = Gesture.Tap().onEnd((_event,success) =>{
        if (success){
            getalbumtracks(`/tracks`)
        }
    })
    const flingleft = Gesture.Fling()
    .direction(Directions.LEFT )
    .onEnd((event) => {
        addtolibrary()
        /*setTimeout(() =>{
            //console.log("jo")
            
        },300) */  })

    const doubleTap = Gesture.Tap().numberOfTaps(2).onEnd((_event,success) =>{
        if (success){
            getalbumtracks("/artistprofile")
        }
    })
    const longPress = Gesture.LongPress().onStart(async (_event,success) =>{
        if (recentalbums){
            await AsyncStorage.removeItem(`album-recent-load:${artist_name}_${album_name}`)
            let leftoveralbums = recentalbums.filter(obj => {return((obj.name !== album_name))});
            setRecentAlbums(leftoveralbums)
        }
        else{

        //  favouritecards={favouritecards} spotifyid={album.id}thumbnail={album.images[0].url} album_name={album.name} artist_name={album.artists[0].name} total_tracks={album.total_tracks} release_date={album.release_date} album_type={album.album_type}
        let album_card = {"name":album_name,"id":spotifyid,"images":[{"url":thumbnail}],"artists":[{"name":artist_name}],"album_type":album_type}
        await AsyncStorage.setItem(`album-recent-load:${artist_name}_${album_name}`,JSON.stringify(album_card)) 
        navigate("/search")
        }
    })
    
    // addtolibrary()
    const navigate = useNavigate();
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    const getalbumtracks = async (route) =>{

        const headers = {Authorization: `Bearer ${access_token}`}
        const resp = await fetch(`https://api.spotify.com/v1/albums/${spotifyid}`, {headers: headers})
        const feedresult = await resp.json()
        let album_tracks = feedresult.tracks.items.map((track) =>{return({"album_id":feedresult.id,"album_name":album_name,"name":track.name,"id":track.id,"artist":track.artists[0].name,"artist_id":track.artists[0].id,"thumbnail":thumbnail,"track_number":track.track_number,"duration_ms":track.duration_ms})})
        navigate(route, { state: album_tracks });
        //console.log(access_token)

    }
    const addtolibrary = async () =>{
        setAddingToLibrary(true)
        const headers = {Authorization: `Bearer ${access_token}`}
        const resp = await fetch(`https://api.spotify.com/v1/albums/${spotifyid}`, {headers: headers})
        setAddingToLibrary(false)
        const feedresult = await resp.json()
        
        let album_tracks = feedresult.tracks.items.map((track) =>{return({"album_id":feedresult.id,"album_name":album_name,"name":track.name,"id":track.id,"artist":track.artists[0].name,"artist_id":track.artists[0].id,"thumbnail":thumbnail,"track_number":track.track_number,"duration_ms":track.duration_ms})})
       
        let library = await AsyncStorage.getItem(JSON.stringify(`library:${album_name}|${artist_name}`)) 
        if (!library){
            await AsyncStorage.setItem(`library:${album_name}|${artist_name}`,JSON.stringify(album_tracks))
        }
      
        
        navigate("/library")
        

        
    }

        if (favouritecards !== true){
            return(
        
                <View  style={{backgroundColor:"#141212",width:favouritecards === true ? 50 : (favouritecards === false ? 200 : 300),height:favouritecards === true ? 50 : (favouritecards === false ? 300 : 300),borderRadius: 5,borderWidth: 3,margin:5,borderColor:"#141212"}}>
                <GestureDetector gesture={Gesture.Exclusive(doubleTap,longPress,singleTap)}>
                    <View  key={album_name} style={{backgroundColor:"#141212",flexDirection:favouritecards === true ? "row":"column",justifyContent:favouritecards === true ? "flex-start":"flex-start",alignItems:favouritecards === true ? "stretch": "stretch",flex:1}}>
                        <View style={{flex:favouritecards === true ? 0.5 : (favouritecards === false ? 1 : 1)}}>
                            <Image style={{borderRadius:5,width: '100%', height: '100%'}} source={{uri:thumbnail}}></Image>
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
                
                        
        
            </GestureDetector>
            </View >
    )
        }
        else{
    
            
            return(
        
            <View  key={album_name}style={{backgroundColor:"#141212",width:200,height:50,borderRadius: 5,borderWidth: 3,flexBasis:"47%",margin:5,borderColor:"#141212"}}>
           
            <GestureDetector gesture={Gesture.Exclusive(flingleft,doubleTap,longPress,singleTap)}>
            <View   style={{backgroundColor:!addingtolibrary ? "#141212" : "grey",flexDirection:"row",justifyContent:"center",alignItems:"center",flex:1}}>
                <View style={{flex:favouritecards ? 0.5 : 1}}>
                    <Image style={{borderRadius:2,width: '100%', height: '100%'}} source={{uri:thumbnail}}></Image>
                </View>
                <View style={{padding:10}}>
                </View>
                <Text style={{color:"white",flex:favouritecards ? 1 : 0.15}}>
                    {toptrack !== undefined ? toptrack : album_name} | {capitalizeFirstLetter(album_type)}
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
            </GestureDetector>
           
            </View>
    
               
    )
    
        }
    
    


    
}