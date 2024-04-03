import { View,Text, ScrollView, FlatList,Image,TextInput} from "react-native";
import { useState,useEffect} from "react";
import TrackProgress from "../TrackProgress/TrackProgress";
import NavigationFooter from "../NavigationFooter/NavigationFooter";
import { get_access_token } from "../access_token/getaccesstoken";
import { FavouritePlaylists } from "../HomeScreen/FavouriteRenders";
export default function Search({seek, setSeek}){
    const [access_token,setAccessToken] = useState("");
    const [initialfeed,setInitialFeed] = useState([]);
    
    const getinitialrnb = async () =>{
        const access_token = await get_access_token();
        const headers = {Authorization: `Bearer ${access_token}`}
        const resp = await fetch('https://api.spotify.com/v1/recommendations?limit=50&seed_genres=r-n-b&seed_artists=2h93pZq0e7k5yf4dywlkpM,31W5EY0aAly4Qieq6OFu6I,2jku7tDXc6XoB6MO2hFuqg', {headers: headers})
        const feedresult = await resp.json()

        const result = feedresult.tracks.map((album) =>{console.log();return({"id":album.album.id,"name":album.album.name,"images":[{"url":album.album.images[0].url}],"artists":[{"name":album.album.artists[0].name}],"total_tracks":album.album.total_tracks,"release_date":album.album.release_date,"album_type":album.album.album_type})})
  
        setAccessToken(access_token)
        setInitialFeed(result)
        
        //console.log(feedresult)
    
    }
    useEffect(() =>{
        getinitialrnb()
    

    },[])
    return(
        <View style={{flex:1}}>
            {/*Header */}
            <View  style={{flex:0.08,backgroundColor:"green",flexDirection:"row",backgroundColor:"#141212"}}>
                <View style={{flex:1,margin:10}}>
                <Text style={{fontSize:20}}>CaesarAIMusicStream</Text>
                
                </View>
                <View style={{flex:0.13,margin:10}}>
                <Image style={{width:44,height:39}} source={require('../../assets/CaesarAILogo.png')} />
                </View>

            </View>
            {/*Main Scroll Body*/}
            <ScrollView style={{flex:1,backgroundColor:"#141212"}}>
            {initialfeed.length > 0 && access_token !== ""  && <FavouritePlaylists access_token={access_token} favouritecards={true} playlists={initialfeed}/>}

            </ScrollView>
            {/*Song Progress Tracker */}
            <View style={{flex:0.08,backgroundColor:"#141212",justifyContent:"center",alignItems:"center"}}>
                <TrackProgress seek={seek} setSeek={setSeek}/>

            </View>

            {/*Navigation Footer*/}
            <NavigationFooter currentpage={"search"}/>


 
        </View>
    )
}